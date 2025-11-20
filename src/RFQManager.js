const RFQ = require('./RFQ');
const Quote = require('./Quote');
const RFQQueue = require('./RFQQueue');

/**
 * RFQManager Class
 * High-level orchestrator for the RFQ system
 */
class RFQManager {
  constructor() {
    this.queue = new RFQQueue();
    this.idCounter = 0;
  }

  /**
   * Generate a unique ID
   * @param {string} prefix - Prefix for the ID
   * @returns {string} Unique ID
   */
  generateId(prefix = 'id') {
    this.idCounter++;
    return `${prefix}_${this.idCounter}_${Date.now()}`;
  }

  /**
   * Create and submit a new RFQ
   * @param {string} market - Trading pair (e.g., "BTC/USD")
   * @param {string} direction - "buy" or "sell"
   * @param {number} amount - Quantity to trade
   * @param {number} expirationMs - Time in milliseconds until expiration
   * @returns {RFQ} The created RFQ
   */
  createRFQ(market, direction, amount, expirationMs) {
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
   * @param {string} rfqId - The RFQ ID to quote on
   * @param {string} makerId - Identifier for the maker
   * @param {number} pricePerToken - Price offered
   * @returns {Quote} The created quote
   */
  submitQuote(rfqId, makerId, pricePerToken) {
    // First expire old RFQs
    this.expireOldRFQs();
    
    const id = this.generateId('quote');
    const quote = new Quote(id, rfqId, makerId, pricePerToken);
    
    this.queue.addQuote(quote);
    return quote;
  }

  /**
   * Accept a specific quote for an RFQ
   * @param {string} rfqId - The RFQ ID
   * @param {string} quoteId - The quote ID to accept
   * @returns {Object} Object with filled RFQ and accepted quote
   */
  acceptQuote(rfqId, quoteId) {
    // First expire old RFQs
    this.expireOldRFQs();
    
    const result = this.queue.selectQuote(rfqId, quoteId);
    return result;
  }

  /**
   * Get details of an RFQ including all its quotes
   * @param {string} rfqId - The RFQ ID
   * @returns {Object|null} Object with RFQ and its quotes, or null if not found
   */
  getRFQDetails(rfqId) {
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
   * @returns {Array<Object>} Array of RFQ details
   */
  getAllRFQDetails() {
    const rfqs = this.queue.getAllRFQs();
    return rfqs.map(rfq => ({
      rfq: rfq.toJSON(),
      quotes: this.queue.getQuotes(rfq.id).map(q => q.toJSON())
    }));
  }

  /**
   * Get all open RFQs (not expired, not filled, not cancelled)
   * @returns {Array<Object>} Array of open RFQ details
   */
  getOpenRFQs() {
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
   * @returns {Array<RFQ>} Array of expired RFQs
   */
  expireOldRFQs() {
    return this.queue.expireRFQs();
  }

  /**
   * Get system statistics
   * @returns {Object} Statistics object
   */
  getStats() {
    return this.queue.getStats();
  }

  /**
   * Clear all data (useful for testing)
   */
  clear() {
    this.queue.clear();
    this.idCounter = 0;
  }
}

module.exports = RFQManager;
