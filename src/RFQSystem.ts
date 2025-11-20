import { RFQManager, RFQFilters } from './managers/RFQManager';
import { QuoteManager } from './managers/QuoteManager';
import { QueueManager, QueueFilters } from './managers/QueueManager';
import { RFQ, RFQDirection } from './models/RFQ';
import { Quote } from './models/Quote';
import { QueueEntry } from './models/QueueEntry';

export interface AcceptQuoteResult {
  quote: Quote;
  rfq: RFQ;
}

export interface SystemStats {
  totalRFQs: number;
  totalQuotes: number;
  totalQueueEntries: number;
  openRFQs: number;
  filledRFQs: number;
  expiredRFQs: number;
}

/**
 * RFQSystem
 * Main orchestrator that coordinates RFQManager, QuoteManager, and QueueManager
 * 
 * Actor Model:
 * - Takers: Create RFQs and accept quotes
 * - Makers: Add quotes to RFQs
 * 
 * Typical Workflow:
 * 1. Taker creates an RFQ (createRFQ)
 * 2. Makers add quotes to the RFQ (addQuote)
 * 3. Taker accepts a quote (acceptQuote)
 */
export class RFQSystem {
  private rfqManager: RFQManager;
  private quoteManager: QuoteManager;
  private queueManager: QueueManager;

  constructor() {
    this.rfqManager = new RFQManager();
    this.quoteManager = new QuoteManager();
    this.queueManager = new QueueManager();
  }

  /**
   * Create a new RFQ (Taker Action)
   * Takers use this method to create a request for quotes
   * @param rfqId - Unique RFQ identifier
   * @param market - Market/token pair
   * @param direction - 'buy' or 'sell'
   * @param amount - Amount of tokens
   * @param expiration - Expiration timestamp (Unix timestamp)
   * @returns Created RFQ instance
   */
  createRFQ(
    rfqId: string,
    market: string,
    direction: RFQDirection,
    amount: number,
    expiration: number
  ): RFQ {
    // Check for expired RFQs before creating new one
    this.checkExpirations();

    const rfq = this.rfqManager.createRFQ(rfqId, market, direction, amount, expiration);
    
    // Add to queue
    this.queueManager.addQueueEntry(rfqId, 'rfq_created', {
      market,
      direction,
      amount,
      expiration
    });

    return rfq;
  }

  /**
   * Get an RFQ by ID
   * @param rfqId - RFQ identifier
   * @returns RFQ instance or null if not found
   */
  getRFQ(rfqId: string): RFQ | null {
    return this.rfqManager.getRFQ(rfqId);
  }

  /**
   * Get all RFQs with optional filters
   * @param filters - Filter options
   * @returns Array of RFQ instances
   */
  getAllRFQs(filters: RFQFilters = {}): RFQ[] {
    return this.rfqManager.getAllRFQs(filters);
  }

  /**
   * Cancel an RFQ (Taker Action)
   * Takers can cancel their own RFQs
   * @param rfqId - RFQ identifier
   * @returns Cancelled RFQ instance
   */
  cancelRFQ(rfqId: string): RFQ {
    const rfq = this.rfqManager.cancelRFQ(rfqId);
    
    // Add to queue
    this.queueManager.addQueueEntry(rfqId, 'rfq_cancelled', {
      status: rfq.status
    });

    return rfq;
  }

  /**
   * Add a quote for an RFQ (Maker Action)
   * Makers use this method to respond to RFQs with their quotes
   * @param quoteId - Unique quote identifier
   * @param rfqId - RFQ identifier
   * @param pricePerToken - Price per token
   * @param makerId - Maker identifier (identifies who is providing the quote)
   * @returns Created Quote instance
   * @throws {Error} If RFQ not found, RFQ is not open, or validation fails
   */
  addQuote(
    quoteId: string,
    rfqId: string,
    pricePerToken: number,
    makerId: string | null = null
  ): Quote {
    // Check for expired RFQs first
    this.checkExpirations();

    // Verify RFQ exists and is open
    const rfq = this.rfqManager.getRFQ(rfqId);
    if (!rfq) {
      throw new Error(`RFQ with ID "${rfqId}" not found`);
    }

    if (!rfq.isOpen()) {
      throw new Error(`Cannot add quote to RFQ with status "${rfq.status}"`);
    }

    const quote = this.quoteManager.addQuote(quoteId, rfqId, pricePerToken, makerId);
    
    // Add to queue
    this.queueManager.addQueueEntry(rfqId, 'quote_added', {
      quoteId,
      makerId,
      pricePerToken
    });

    return quote;
  }

  /**
   * Get a quote by ID
   * @param quoteId - Quote identifier
   * @returns Quote instance or null if not found
   */
  getQuote(quoteId: string): Quote | null {
    return this.quoteManager.getQuote(quoteId);
  }

  /**
   * Get all quotes for a specific RFQ
   * @param rfqId - RFQ identifier
   * @returns Array of Quote instances
   */
  getQuotesForRFQ(rfqId: string): Quote[] {
    return this.quoteManager.getQuotesForRFQ(rfqId);
  }

  /**
   * Accept a quote (Taker Action)
   * Takers use this method to select and accept a winning quote
   * @param quoteId - Quote identifier
   * @returns Object containing accepted quote and updated RFQ
   * @throws {Error} If quote not found, RFQ is not open, or quote already processed
   */
  acceptQuote(quoteId: string): AcceptQuoteResult {
    // Check for expired RFQs first
    this.checkExpirations();

    const quote = this.quoteManager.getQuote(quoteId);
    if (!quote) {
      throw new Error(`Quote with ID "${quoteId}" not found`);
    }

    const rfq = this.rfqManager.getRFQ(quote.rfqId);
    if (!rfq) {
      throw new Error(`RFQ with ID "${quote.rfqId}" not found`);
    }

    if (!rfq.isOpen()) {
      throw new Error(`Cannot accept quote for RFQ with status "${rfq.status}"`);
    }

    // Accept the quote (this will also reject other quotes for the same RFQ)
    const acceptedQuote = this.quoteManager.acceptQuote(quoteId);
    
    // Mark RFQ as filled
    rfq.markFilled();
    
    // Add to queue
    this.queueManager.addQueueEntry(quote.rfqId, 'quote_accepted', {
      quoteId,
      makerId: acceptedQuote.makerId,
      pricePerToken: acceptedQuote.pricePerToken
    });

    return {
      quote: acceptedQuote,
      rfq: rfq
    };
  }

  /**
   * Check and update expired RFQs
   * @returns Array of RFQs that were expired
   */
  checkExpirations(): RFQ[] {
    const expiredRFQs = this.rfqManager.checkExpirations();
    
    // Add expired RFQs to queue
    expiredRFQs.forEach(rfq => {
      this.queueManager.addQueueEntry(rfq.rfqId, 'rfq_expired', {
        expiration: rfq.expiration
      });
    });

    return expiredRFQs;
  }

  /**
   * Get queue entries with optional filters
   * @param filters - Filter options
   * @returns Array of QueueEntry instances
   */
  getQueueEntries(filters: QueueFilters = {}): QueueEntry[] {
    return this.queueManager.getQueueEntries(filters);
  }

  /**
   * Get recent activity
   * @param limit - Maximum number of entries to return
   * @returns Array of most recent QueueEntry instances
   */
  getRecentActivity(limit: number = 100): QueueEntry[] {
    return this.queueManager.getRecentActivity(limit);
  }

  /**
   * Get system statistics
   * @returns System statistics
   */
  getStats(): SystemStats {
    return {
      totalRFQs: this.rfqManager.getCount(),
      totalQuotes: this.quoteManager.getCount(),
      totalQueueEntries: this.queueManager.getCount(),
      openRFQs: this.rfqManager.getAllRFQs({ status: 'open' }).length,
      filledRFQs: this.rfqManager.getAllRFQs({ status: 'filled' }).length,
      expiredRFQs: this.rfqManager.getAllRFQs({ status: 'expired' }).length
    };
  }

}
