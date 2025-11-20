const Quote = require('../models/Quote');
const { validateQuote } = require('../utils/validators');

/**
 * QuoteManager
 * Manages quote lifecycle: create, retrieve, and acceptance
 */
class QuoteManager {
  constructor() {
    this.quotes = new Map(); // Map<quoteId, Quote>
    this.rfqQuotes = new Map(); // Map<rfqId, Set<quoteId>> - Index for quick lookup
  }

  /**
   * Add a quote for an RFQ
   * @param {string} quoteId - Unique quote identifier
   * @param {string} rfqId - RFQ identifier
   * @param {number} pricePerToken - Price per token
   * @param {string} makerId - Optional maker identifier
   * @returns {Quote} Created Quote instance
   * @throws {Error} If validation fails, quote ID exists, or RFQ is not open
   */
  addQuote(quoteId, rfqId, pricePerToken, makerId = null) {
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
    this.rfqQuotes.get(rfqId).add(quoteId);

    return quote;
  }

  /**
   * Get a quote by ID
   * @param {string} quoteId - Quote identifier
   * @returns {Quote|null} Quote instance or null if not found
   */
  getQuote(quoteId) {
    return this.quotes.get(quoteId) || null;
  }

  /**
   * Get all quotes for a specific RFQ
   * @param {string} rfqId - RFQ identifier
   * @returns {Array<Quote>} Array of Quote instances
   */
  getQuotesForRFQ(rfqId) {
    const quoteIds = this.rfqQuotes.get(rfqId);
    if (!quoteIds) {
      return [];
    }

    return Array.from(quoteIds)
      .map(quoteId => this.quotes.get(quoteId))
      .filter(quote => quote !== undefined);
  }

  /**
   * Get pending quotes for a specific RFQ
   * @param {string} rfqId - RFQ identifier
   * @returns {Array<Quote>} Array of pending Quote instances
   */
  getPendingQuotesForRFQ(rfqId) {
    return this.getQuotesForRFQ(rfqId).filter(quote => quote.isPending());
  }

  /**
   * Accept a quote (mark as accepted and reject other quotes for the same RFQ)
   * @param {string} quoteId - Quote identifier
   * @returns {Quote} Accepted Quote instance
   * @throws {Error} If quote not found or already processed
   */
  acceptQuote(quoteId) {
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
   * @param {string} quoteId - Quote identifier
   * @returns {boolean} True if quote exists
   */
  hasQuote(quoteId) {
    return this.quotes.has(quoteId);
  }

  /**
   * Get count of quotes
   * @returns {number} Total number of quotes
   */
  getCount() {
    return this.quotes.size;
  }

  /**
   * Get count of quotes for a specific RFQ
   * @param {string} rfqId - RFQ identifier
   * @returns {number} Number of quotes for the RFQ
   */
  getCountForRFQ(rfqId) {
    const quoteIds = this.rfqQuotes.get(rfqId);
    return quoteIds ? quoteIds.size : 0;
  }

  /**
   * Clear all quotes (useful for testing)
   */
  clear() {
    this.quotes.clear();
    this.rfqQuotes.clear();
  }
}

module.exports = QuoteManager;
