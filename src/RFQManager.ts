import { RFQ } from './RFQ';
import { Quote } from './Quote';
import { RFQQueue } from './RFQQueue';
import { IRFQ, IQuote, IRFQDetails, IRFQStats, ISelectQuoteResult, Direction, IAutoAcceptConfig } from './types';

/**
 * RFQManager Class
 * High-level orchestrator for the RFQ system
 */
export class RFQManager {
  private queue: RFQQueue;
  private idCounter: number;

  constructor() {
    this.queue = new RFQQueue();
    this.idCounter = 0;
  }

  /**
   * Generate a unique ID
   * @param prefix - Prefix for the ID
   * @returns Unique ID
   */
  private generateId(prefix: string = 'id'): string {
    this.idCounter++;
    return `${prefix}_${this.idCounter}_${Date.now()}`;
  }

  /**
   * Create and submit a new RFQ
   * @param market - Trading pair (e.g., "BTC/USD")
   * @param direction - "buy" or "sell"
   * @param amount - Quantity to trade
   * @param expirationMs - Time in milliseconds until expiration
   * @param autoAccept - Optional auto-accept configuration for 2-step process
   * @returns The created RFQ
   */
  public createRFQ(
    market: string,
    direction: Direction,
    amount: number,
    expirationMs: number,
    autoAccept?: IAutoAcceptConfig
  ): IRFQ {
    const id = this.generateId('rfq');
    const expiration = Date.now() + expirationMs;
    
    const rfq = new RFQ(id, market, direction, amount, expiration, autoAccept);
    this.queue.addRFQ(rfq);
    
    // Automatically expire old RFQs when creating new ones
    this.expireOldRFQs();
    
    return rfq;
  }

  /**
   * Submit a quote for an RFQ
   * @param rfqId - The RFQ ID to quote on
   * @param makerId - Identifier for the maker
   * @param pricePerToken - Price offered
   * @returns The created quote, or auto-accept result if triggered
   */
  public submitQuote(
    rfqId: string,
    makerId: string,
    pricePerToken: number
  ): IQuote {
    // First expire old RFQs
    this.expireOldRFQs();
    
    const id = this.generateId('quote');
    const quote = new Quote(id, rfqId, makerId, pricePerToken);
    
    this.queue.addQuote(quote);
    
    // Check if auto-accept should trigger
    this.checkAndAutoAccept(rfqId);
    
    return quote;
  }

  /**
   * Check if RFQ should auto-accept and execute if conditions met
   * @param rfqId - The RFQ ID to check
   * @returns The auto-accepted result, or null if not triggered
   */
  private checkAndAutoAccept(rfqId: string): ISelectQuoteResult | null {
    const rfq = this.queue.getRFQ(rfqId);
    if (!rfq) {
      return null;
    }
    
    const quotes = this.queue.getQuotes(rfqId);
    
    // Check if should auto-accept
    if (!rfq.shouldAutoAccept(quotes.length)) {
      return null;
    }
    
    // Find best quote based on direction
    const bestQuote = this.findBestQuote(rfq, quotes);
    if (!bestQuote) {
      return null;
    }
    
    // Auto-accept the best quote
    return this.queue.selectQuote(rfqId, bestQuote.id);
  }

  /**
   * Find the best quote for an RFQ based on direction
   * @param rfq - The RFQ
   * @param quotes - Available quotes
   * @returns The best quote
   */
  private findBestQuote(rfq: IRFQ, quotes: IQuote[]): IQuote | null {
    if (quotes.length === 0) {
      return null;
    }
    
    if (rfq.direction === 'buy') {
      // For buy orders, lowest price is best
      return quotes.reduce((best, current) => 
        current.pricePerToken < best.pricePerToken ? current : best
      );
    } else {
      // For sell orders, highest price is best
      return quotes.reduce((best, current) => 
        current.pricePerToken > best.pricePerToken ? current : best
      );
    }
  }

  /**
   * Accept a specific quote for an RFQ
   * @param rfqId - The RFQ ID
   * @param quoteId - The quote ID to accept
   * @returns Object with filled RFQ and accepted quote
   */
  public acceptQuote(rfqId: string, quoteId: string): ISelectQuoteResult {
    // First expire old RFQs
    this.expireOldRFQs();
    
    const result = this.queue.selectQuote(rfqId, quoteId);
    return result;
  }

  /**
   * Get details of an RFQ including all its quotes
   * @param rfqId - The RFQ ID
   * @returns Object with RFQ and its quotes, or null if not found
   */
  public getRFQDetails(rfqId: string): IRFQDetails | null {
    const rfq = this.queue.getRFQ(rfqId);
    if (!rfq) {
      return null;
    }

    const quotes = this.queue.getQuotes(rfqId);
    
    return {
      rfq: rfq.toJSON(),
      quotes: quotes.map(q => q.toJSON())
    };
  }

  /**
   * Get all RFQs with their quotes
   * @returns Array of RFQ details
   */
  public getAllRFQDetails(): IRFQDetails[] {
    const rfqs = this.queue.getAllRFQs();
    return rfqs.map(rfq => ({
      rfq: rfq.toJSON(),
      quotes: this.queue.getQuotes(rfq.id).map(q => q.toJSON())
    }));
  }

  /**
   * Get all open RFQs (not expired, not filled, not cancelled)
   * @returns Array of open RFQ details
   */
  public getOpenRFQs(): IRFQDetails[] {
    this.expireOldRFQs();
    
    const rfqs = this.queue.getAllRFQs();
    return rfqs
      .filter(rfq => rfq.isOpen())
      .map(rfq => ({
        rfq: rfq.toJSON(),
        quotes: this.queue.getQuotes(rfq.id).map(q => q.toJSON())
      }));
  }

  /**
   * Expire all RFQs that have passed their expiration time
   * @returns Array of expired RFQs
   */
  public expireOldRFQs(): IRFQ[] {
    return this.queue.expireRFQs();
  }

  /**
   * Get system statistics
   * @returns Statistics object
   */
  public getStats(): IRFQStats {
    return this.queue.getStats();
  }

  /**
   * Clear all data (useful for testing)
   */
  public clear(): void {
    this.queue.clear();
    this.idCounter = 0;
  }
}
