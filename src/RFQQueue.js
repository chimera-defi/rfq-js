/**
 * RFQQueue Class
 * Manages the queue of RFQs and quotes in memory
 */
class RFQQueue {
  constructor() {
    // Storage maps
    this.rfqs = new Map(); // rfqId -> RFQ object
    this.quotes = new Map(); // quoteId -> Quote object
    this.rfqQuotes = new Map(); // rfqId -> Set of quote IDs
  }

  /**
   * Add an RFQ to the queue
   * @param {RFQ} rfq - The RFQ to add
   * @returns {RFQ} The added RFQ
   */
  addRFQ(rfq) {
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
   * @param {string} rfqId - The RFQ ID
   * @returns {RFQ|null} The RFQ or null if not found
   */
  getRFQ(rfqId) {
    return this.rfqs.get(rfqId) || null;
  }

  /**
   * Get all RFQs
   * @returns {Array<RFQ>} Array of all RFQs
   */
  getAllRFQs() {
    return Array.from(this.rfqs.values());
  }

  /**
   * Add a quote to the queue
   * @param {Quote} quote - The quote to add
   * @returns {Quote} The added quote
   */
  addQuote(quote) {
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
      throw new Error(`Cannot add quote to RFQ with status: ${rfq.status}`);
    }

    // Check if quote ID already exists
    if (this.quotes.has(quote.id)) {
      throw new Error(`Quote with id ${quote.id} already exists`);
    }

    this.quotes.set(quote.id, quote);
    this.rfqQuotes.get(quote.rfqId).add(quote.id);
    return quote;
  }

  /**
   * Get a quote by ID
   * @param {string} quoteId - The quote ID
   * @returns {Quote|null} The quote or null if not found
   */
  getQuote(quoteId) {
    return this.quotes.get(quoteId) || null;
  }

  /**
   * Get all quotes for a specific RFQ
   * @param {string} rfqId - The RFQ ID
   * @returns {Array<Quote>} Array of quotes for the RFQ
   */
  getQuotes(rfqId) {
    const quoteIds = this.rfqQuotes.get(rfqId);
    if (!quoteIds) {
      return [];
    }

    return Array.from(quoteIds)
      .map(id => this.quotes.get(id))
      .filter(quote => quote !== undefined);
  }

  /**
   * Select a quote and mark the RFQ as filled
   * @param {string} rfqId - The RFQ ID
   * @param {string} quoteId - The quote ID to select
   * @returns {Object} Object with the filled RFQ and selected quote
   */
  selectQuote(rfqId, quoteId) {
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
   * @returns {Array<RFQ>} Array of expired RFQs
   */
  expireRFQs() {
    const expiredRFQs = [];
    const now = Date.now();

    for (const rfq of this.rfqs.values()) {
      if (rfq.status === 'open' && rfq.expiration <= now) {
        rfq.expire();
        expiredRFQs.push(rfq);
      }
    }

    return expiredRFQs;
  }

  /**
   * Get statistics about the queue
   * @returns {Object} Statistics object
   */
  getStats() {
    const rfqsByStatus = {
      open: 0,
      filled: 0,
      expired: 0,
      cancelled: 0
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
  clear() {
    this.rfqs.clear();
    this.quotes.clear();
    this.rfqQuotes.clear();
  }
}

module.exports = RFQQueue;
