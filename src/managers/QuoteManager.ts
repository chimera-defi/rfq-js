import { Quote } from '../models/Quote';
import { validateQuote } from '../utils/validators';

/**
 * QuoteManager
 * Manages quote lifecycle: create, retrieve, and acceptance
 */
export class QuoteManager {
  private quotes: Map<string, Quote> = new Map();
  private rfqQuotes: Map<string, Set<string>> = new Map(); // Index for quick lookup

  /**
   * Add a quote for an RFQ
   * @param quoteId - Unique quote identifier
   * @param rfqId - RFQ identifier
   * @param pricePerToken - Price per token
   * @param makerId - Optional maker identifier
   * @returns Created Quote instance
   * @throws {Error} If validation fails, quote ID exists, or RFQ is not open
   */
  addQuote(
    quoteId: string,
    rfqId: string,
    pricePerToken: number,
    makerId: string | null = null
  ): Quote {
    // Validate input
    validateQuote(quoteId, rfqId, pricePerToken);

    // Check for duplicate quote ID
    if (this.quotes.has(quoteId)) {
      throw new Error(`Quote with ID "${quoteId}" already exists`);
    }

    // Create and store quote
    const quote = new Quote(quoteId, rfqId, pricePerToken, makerId);
    this.quotes.set(quoteId, quote);

    // Update index
    if (!this.rfqQuotes.has(rfqId)) {
      this.rfqQuotes.set(rfqId, new Set());
    }
    this.rfqQuotes.get(rfqId)!.add(quoteId);

    return quote;
  }

  /**
   * Get a quote by ID
   * @param quoteId - Quote identifier
   * @returns Quote instance or null if not found
   */
  getQuote(quoteId: string): Quote | null {
    return this.quotes.get(quoteId) || null;
  }

  /**
   * Get all quotes for a specific RFQ
   * @param rfqId - RFQ identifier
   * @returns Array of Quote instances
   */
  getQuotesForRFQ(rfqId: string): Quote[] {
    const quoteIds = this.rfqQuotes.get(rfqId);
    if (!quoteIds) {
      return [];
    }

    return Array.from(quoteIds)
      .map(quoteId => this.quotes.get(quoteId))
      .filter((quote): quote is Quote => quote !== undefined);
  }

  /**
   * Get pending quotes for a specific RFQ
   * @param rfqId - RFQ identifier
   * @returns Array of pending Quote instances
   */
  getPendingQuotesForRFQ(rfqId: string): Quote[] {
    return this.getQuotesForRFQ(rfqId).filter(quote => quote.isPending());
  }

  /**
   * Accept a quote (mark as accepted and reject other quotes for the same RFQ)
   * @param quoteId - Quote identifier
   * @returns Accepted Quote instance
   * @throws {Error} If quote not found or already processed
   */
  acceptQuote(quoteId: string): Quote {
    const quote = this.getQuote(quoteId);
    if (!quote) {
      throw new Error(`Quote with ID "${quoteId}" not found`);
    }

    if (!quote.isPending()) {
      throw new Error(`Quote with ID "${quoteId}" is already ${quote.status}`);
    }

    // Mark this quote as accepted
    quote.markAccepted();

    // Reject all other pending quotes for the same RFQ
    const otherQuotes = this.getPendingQuotesForRFQ(quote.rfqId);
    otherQuotes.forEach(otherQuote => {
      if (otherQuote.quoteId !== quoteId) {
        otherQuote.markRejected();
      }
    });

    return quote;
  }

  /**
   * Check if a quote exists
   * @param quoteId - Quote identifier
   * @returns True if quote exists
   */
  hasQuote(quoteId: string): boolean {
    return this.quotes.has(quoteId);
  }

  /**
   * Get count of quotes
   * @returns Total number of quotes
   */
  getCount(): number {
    return this.quotes.size;
  }

  /**
   * Get count of quotes for a specific RFQ
   * @param rfqId - RFQ identifier
   * @returns Number of quotes for the RFQ
   */
  getCountForRFQ(rfqId: string): number {
    const quoteIds = this.rfqQuotes.get(rfqId);
    return quoteIds ? quoteIds.size : 0;
  }

  /**
   * Clear all quotes (useful for testing)
   */
  clear(): void {
    this.quotes.clear();
    this.rfqQuotes.clear();
  }
}
