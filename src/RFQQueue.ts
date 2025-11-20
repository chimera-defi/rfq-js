import { IRFQ, IQuote, IRFQStats, ISelectQuoteResult, RFQStatus } from './types';

/**
 * RFQQueue Class
 * Manages the queue of RFQs and quotes in memory
 */
export class RFQQueue {
  private rfqs: Map<string, IRFQ>;
  private quotes: Map<string, IQuote>;
  private rfqQuotes: Map<string, Set<string>>;

  constructor() {
    this.rfqs = new Map();
    this.quotes = new Map();
    this.rfqQuotes = new Map();
  }

  /**
   * Add an RFQ to the queue
   * @param rfq - The RFQ to add
   * @returns The added RFQ
   */
  public addRFQ(rfq: IRFQ): IRFQ {
    if (!rfq || !rfq.id) {
      throw new Error('Invalid RFQ object');
    }
    
    if (this.rfqs.has(rfq.id)) {
      throw new Error(`RFQ with id ${rfq.id} already exists`);
    }

    this.rfqs.set(rfq.id, rfq);
    this.rfqQuotes.set(rfq.id, new Set());
    return rfq;
  }

  /**
   * Get an RFQ by ID
   * @param rfqId - The RFQ ID
   * @returns The RFQ or null if not found
   */
  public getRFQ(rfqId: string): IRFQ | null {
    return this.rfqs.get(rfqId) || null;
  }

  /**
   * Get all RFQs
   * @returns Array of all RFQs
   */
  public getAllRFQs(): IRFQ[] {
    return Array.from(this.rfqs.values());
  }

  /**
   * Add a quote to the queue
   * @param quote - The quote to add
   * @returns The added quote
   */
  public addQuote(quote: IQuote): IQuote {
    if (!quote || !quote.id || !quote.rfqId) {
      throw new Error('Invalid Quote object');
    }

    // Check if RFQ exists
    const rfq = this.getRFQ(quote.rfqId);
    if (!rfq) {
      throw new Error(`RFQ with id ${quote.rfqId} not found`);
    }

    // Check if RFQ is open
    if (!rfq.isOpen()) {
      if (rfq.isExpired() && rfq.status === RFQStatus.OPEN) {
        throw new Error(`Cannot add quote to expired RFQ (id: ${rfq.id})`);
      }
      throw new Error(`Cannot add quote to RFQ with status: ${rfq.status}`);
    }

    // Check if quote ID already exists
    if (this.quotes.has(quote.id)) {
      throw new Error(`Quote with id ${quote.id} already exists`);
    }

    this.quotes.set(quote.id, quote);
    this.rfqQuotes.get(quote.rfqId)!.add(quote.id);
    return quote;
  }

  /**
   * Get a quote by ID
   * @param quoteId - The quote ID
   * @returns The quote or null if not found
   */
  public getQuote(quoteId: string): IQuote | null {
    return this.quotes.get(quoteId) || null;
  }

  /**
   * Get all quotes for a specific RFQ
   * @param rfqId - The RFQ ID
   * @returns Array of quotes for the RFQ
   */
  public getQuotes(rfqId: string): IQuote[] {
    const quoteIds = this.rfqQuotes.get(rfqId);
    if (!quoteIds) {
      return [];
    }

    return Array.from(quoteIds)
      .map(id => this.quotes.get(id))
      .filter((quote): quote is IQuote => quote !== undefined);
  }

  /**
   * Select a quote and mark the RFQ as filled
   * @param rfqId - The RFQ ID
   * @param quoteId - The quote ID to select
   * @returns Object with the filled RFQ and selected quote
   */
  public selectQuote(rfqId: string, quoteId: string): ISelectQuoteResult {
    const rfq = this.getRFQ(rfqId);
    if (!rfq) {
      throw new Error(`RFQ with id ${rfqId} not found`);
    }

    const quote = this.getQuote(quoteId);
    if (!quote) {
      throw new Error(`Quote with id ${quoteId} not found`);
    }

    if (quote.rfqId !== rfqId) {
      throw new Error(`Quote ${quoteId} does not belong to RFQ ${rfqId}`);
    }

    // Fill the RFQ (this will validate status and expiration)
    rfq.fill(quoteId);

    return {
      rfq,
      quote
    };
  }

  /**
   * Expire all RFQs that have passed their expiration time
   * @returns Array of expired RFQs
   */
  public expireRFQs(): IRFQ[] {
    const expiredRFQs: IRFQ[] = [];
    const now = Date.now();

    for (const rfq of this.rfqs.values()) {
      if (rfq.status === RFQStatus.OPEN && rfq.expiration <= now) {
        rfq.expire();
        expiredRFQs.push(rfq);
      }
    }

    return expiredRFQs;
  }

  /**
   * Get statistics about the queue
   * @returns Statistics object
   */
  public getStats(): IRFQStats {
    const rfqsByStatus: Record<RFQStatus, number> = {
      [RFQStatus.OPEN]: 0,
      [RFQStatus.FILLED]: 0,
      [RFQStatus.EXPIRED]: 0,
      [RFQStatus.CANCELLED]: 0
    };

    for (const rfq of this.rfqs.values()) {
      rfqsByStatus[rfq.status] = (rfqsByStatus[rfq.status] || 0) + 1;
    }

    return {
      totalRFQs: this.rfqs.size,
      totalQuotes: this.quotes.size,
      rfqsByStatus
    };
  }

  /**
   * Clear all data (useful for testing)
   */
  public clear(): void {
    this.rfqs.clear();
    this.quotes.clear();
    this.rfqQuotes.clear();
  }
}
