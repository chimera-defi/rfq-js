const RFQ = require('../models/RFQ');
const { validateRFQ } = require('../utils/validators');

/**
 * RFQManager
 * Manages RFQ lifecycle: create, retrieve, cancel, and expiration handling
 */
class RFQManager {
  constructor() {
    this.rfqs = new Map(); // Map<rfqId, RFQ>
  }

  /**
   * Create a new RFQ
   * @param {string} rfqId - Unique RFQ identifier
   * @param {string} market - Market/token pair
   * @param {string} direction - 'buy' or 'sell'
   * @param {number} amount - Amount of tokens
   * @param {number} expiration - Expiration timestamp (Unix timestamp)
   * @returns {RFQ} Created RFQ instance
   * @throws {Error} If validation fails or RFQ ID already exists
   */
  createRFQ(rfqId, market, direction, amount, expiration) {
    // Validate input
    validateRFQ(rfqId, market, direction, amount, expiration);

    // Check for duplicate RFQ ID
    if (this.rfqs.has(rfqId)) {
      throw new Error(`RFQ with ID "${rfqId}" already exists`);
    }

    // Create and store RFQ
    const rfq = new RFQ(rfqId, market, direction, amount, expiration);
    this.rfqs.set(rfqId, rfq);

    return rfq;
  }

  /**
   * Get an RFQ by ID
   * @param {string} rfqId - RFQ identifier
   * @returns {RFQ|null} RFQ instance or null if not found
   */
  getRFQ(rfqId) {
    return this.rfqs.get(rfqId) || null;
  }

  /**
   * Get all RFQs with optional filters
   * @param {Object} filters - Filter options
   * @param {string} filters.status - Filter by status ('open', 'filled', 'expired', 'cancelled')
   * @param {string} filters.market - Filter by market
   * @param {string} filters.direction - Filter by direction ('buy' or 'sell')
   * @returns {Array<RFQ>} Array of RFQ instances
   */
  getAllRFQs(filters = {}) {
    let rfqs = Array.from(this.rfqs.values());

    // Apply filters
    if (filters.status) {
      rfqs = rfqs.filter(rfq => rfq.status === filters.status);
    }

    if (filters.market) {
      rfqs = rfqs.filter(rfq => rfq.market === filters.market);
    }

    if (filters.direction) {
      rfqs = rfqs.filter(rfq => rfq.direction === filters.direction);
    }

    return rfqs;
  }

  /**
   * Cancel an RFQ
   * @param {string} rfqId - RFQ identifier
   * @returns {RFQ} Cancelled RFQ instance
   * @throws {Error} If RFQ not found or cannot be cancelled
   */
  cancelRFQ(rfqId) {
    const rfq = this.getRFQ(rfqId);
    if (!rfq) {
      throw new Error(`RFQ with ID "${rfqId}" not found`);
    }

    if (rfq.status !== 'open') {
      throw new Error(`Cannot cancel RFQ with status "${rfq.status}"`);
    }

    rfq.markCancelled();
    return rfq;
  }

  /**
   * Check and update expired RFQs
   * @returns {Array<RFQ>} Array of RFQs that were expired
   */
  checkExpirations() {
    const expiredRFQs = [];
    
    for (const rfq of this.rfqs.values()) {
      if (rfq.isExpired() && rfq.status === 'open') {
        rfq.markExpired();
        expiredRFQs.push(rfq);
      }
    }

    return expiredRFQs;
  }

  /**
   * Check if an RFQ exists
   * @param {string} rfqId - RFQ identifier
   * @returns {boolean} True if RFQ exists
   */
  hasRFQ(rfqId) {
    return this.rfqs.has(rfqId);
  }

  /**
   * Get count of RFQs
   * @returns {number} Total number of RFQs
   */
  getCount() {
    return this.rfqs.size;
  }

  /**
   * Clear all RFQs (useful for testing)
   */
  clear() {
    this.rfqs.clear();
  }
}

module.exports = RFQManager;
