import { RFQ } from './RFQ';
import { Quote } from './Quote';
import { RFQQueue } from './RFQQueue';
import { IRFQ, IQuote, IRFQDetails, IRFQStats, ISelectQuoteResult, Direction } from './types';

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
   * @returns The created RFQ
   */
  public createRFQ(
    market: string,
    direction: Direction,
    amount: number,
    expirationMs: number
  ): IRFQ {
    const id = this.generateId('rfq');
    const expiration = Date.now() + expirationMs;
    
    const rfq = new RFQ(id, market, direction, amount, expiration);
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
   * @returns The created quote
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
    return quote;
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
