/**
 * RFQ (Request for Quote) Class
 * Represents a request from a taker to get price quotes from makers
 */
class RFQ {
  /**
   * Create an RFQ
   * @param {string} id - Unique identifier
   * @param {string} market - Trading pair (e.g., "BTC/USD")
   * @param {string} direction - "buy" or "sell"
   * @param {number} amount - Quantity to trade
   * @param {number} expiration - Unix timestamp for expiration
   */
  constructor(id, market, direction, amount, expiration) {
    this.validate(id, market, direction, amount, expiration);
    
    this.id = id;
    this.market = market;
    this.direction = direction;
    this.amount = amount;
    this.expiration = expiration;
    this.status = 'open';
    this.createdAt = Date.now();
    this.selectedQuoteId = null;
  }

  /**
   * Validate RFQ parameters
   */
  validate(id, market, direction, amount, expiration) {
    if (!id || typeof id !== 'string') {
      throw new Error('RFQ id must be a non-empty string');
    }

    if (!market || typeof market !== 'string' || market.trim().length === 0) {
      throw new Error('Market must be a non-empty string');
    }

    if (direction !== 'buy' && direction !== 'sell') {
      throw new Error('Direction must be either "buy" or "sell"');
    }

    if (typeof amount !== 'number' || amount <= 0 || !Number.isFinite(amount)) {
      throw new Error('Amount must be a positive finite number');
    }

    if (typeof expiration !== 'number' || !Number.isFinite(expiration) || expiration <= Date.now()) {
      throw new Error('Expiration must be a future timestamp');
    }
  }

  /**
   * Check if the RFQ is expired
   * @returns {boolean}
   */
  isExpired() {
    return Date.now() > this.expiration;
  }

  /**
   * Check if the RFQ is open for quotes
   * @returns {boolean}
   */
  isOpen() {
    return this.status === 'open' && !this.isExpired();
  }

  /**
   * Mark the RFQ as filled with a selected quote
   * @param {string} quoteId - The ID of the selected quote
   */
  fill(quoteId) {
    if (this.status !== 'open') {
      throw new Error(`Cannot fill RFQ with status: ${this.status}`);
    }
    if (this.isExpired()) {
      throw new Error('Cannot fill an expired RFQ');
    }
    this.status = 'filled';
    this.selectedQuoteId = quoteId;
  }

  /**
   * Mark the RFQ as expired
   */
  expire() {
    if (this.status === 'open') {
      this.status = 'expired';
    }
  }

  /**
   * Cancel the RFQ
   */
  cancel() {
    if (this.status === 'open') {
      this.status = 'cancelled';
    } else {
      throw new Error(`Cannot cancel RFQ with status: ${this.status}`);
    }
  }

  /**
   * Get a plain object representation of the RFQ
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.id,
      market: this.market,
      direction: this.direction,
      amount: this.amount,
      expiration: this.expiration,
      status: this.status,
      createdAt: this.createdAt,
      selectedQuoteId: this.selectedQuoteId
    };
  }
}

module.exports = RFQ;
