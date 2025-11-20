const RFQManager = require('./managers/RFQManager');
const QuoteManager = require('./managers/QuoteManager');
const QueueManager = require('./managers/QueueManager');

/**
 * RFQSystem
 * Main orchestrator that coordinates RFQManager, QuoteManager, and QueueManager
 */
class RFQSystem {
  constructor() {
    this.rfqManager = new RFQManager();
    this.quoteManager = new QuoteManager();
    this.queueManager = new QueueManager();
  }

  /**
   * Create a new RFQ
   * @param {string} rfqId - Unique RFQ identifier
   * @param {string} market - Market/token pair
   * @param {string} direction - 'buy' or 'sell'
   * @param {number} amount - Amount of tokens
   * @param {number} expiration - Expiration timestamp (Unix timestamp)
   * @returns {RFQ} Created RFQ instance
   */
  createRFQ(rfqId, market, direction, amount, expiration) {
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
   * @param {string} rfqId - RFQ identifier
   * @returns {RFQ|null} RFQ instance or null if not found
   */
  getRFQ(rfqId) {
    return this.rfqManager.getRFQ(rfqId);
  }

  /**
   * Get all RFQs with optional filters
   * @param {Object} filters - Filter options
   * @returns {Array<RFQ>} Array of RFQ instances
   */
  getAllRFQs(filters = {}) {
    return this.rfqManager.getAllRFQs(filters);
  }

  /**
   * Cancel an RFQ
   * @param {string} rfqId - RFQ identifier
   * @returns {RFQ} Cancelled RFQ instance
   */
  cancelRFQ(rfqId) {
    const rfq = this.rfqManager.cancelRFQ(rfqId);
    
    // Add to queue
    this.queueManager.addQueueEntry(rfqId, 'rfq_cancelled', {
      status: rfq.status
    });

    return rfq;
  }

  /**
   * Add a quote for an RFQ
   * @param {string} quoteId - Unique quote identifier
   * @param {string} rfqId - RFQ identifier
   * @param {number} pricePerToken - Price per token
   * @param {string} makerId - Optional maker identifier
   * @returns {Quote} Created Quote instance
   * @throws {Error} If RFQ not found, RFQ is not open, or validation fails
   */
  addQuote(quoteId, rfqId, pricePerToken, makerId = null) {
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
   * @param {string} quoteId - Quote identifier
   * @returns {Quote|null} Quote instance or null if not found
   */
  getQuote(quoteId) {
    return this.quoteManager.getQuote(quoteId);
  }

  /**
   * Get all quotes for a specific RFQ
   * @param {string} rfqId - RFQ identifier
   * @returns {Array<Quote>} Array of Quote instances
   */
  getQuotesForRFQ(rfqId) {
    return this.quoteManager.getQuotesForRFQ(rfqId);
  }

  /**
   * Accept a quote (taker selects winning quote)
   * @param {string} quoteId - Quote identifier
   * @returns {Object} Object containing accepted quote and updated RFQ
   * @throws {Error} If quote not found, RFQ is not open, or quote already processed
   */
  acceptQuote(quoteId) {
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
   * @returns {Array<RFQ>} Array of RFQs that were expired
   */
  checkExpirations() {
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
   * @param {Object} filters - Filter options
   * @returns {Array<QueueEntry>} Array of QueueEntry instances
   */
  getQueueEntries(filters = {}) {
    return this.queueManager.getQueueEntries(filters);
  }

  /**
   * Get recent activity
   * @param {number} limit - Maximum number of entries to return
   * @returns {Array<QueueEntry>} Array of most recent QueueEntry instances
   */
  getRecentActivity(limit = 100) {
    return this.queueManager.getRecentActivity(limit);
  }

  /**
   * Get system statistics
   * @returns {Object} System statistics
   */
  getStats() {
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

module.exports = RFQSystem;
