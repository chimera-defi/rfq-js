/**
 * RFQ (Request for Quote) Model
 * Represents a request from a taker to buy or sell tokens
 */
class RFQ {
  constructor(rfqId, market, direction, amount, expiration, createdAt = Date.now()) {
    this.rfqId = rfqId;
    this.market = market;
    this.direction = direction;
    this.amount = amount;
    this.expiration = expiration;
    this.createdAt = createdAt;
    this.status = 'open'; // 'open', 'filled', 'expired', 'cancelled'
  }

  /**
   * Check if the RFQ is expired
   * @returns {boolean} True if expired
   */
  isExpired() {
    return Date.now() >= this.expiration;
  }

  /**
   * Check if the RFQ is open (not filled, expired, or cancelled)
   * @returns {boolean} True if open
   */
  isOpen() {
    return this.status === 'open' && !this.isExpired();
  }

  /**
   * Mark the RFQ as expired
   */
  markExpired() {
    if (this.status === 'open') {
      this.status = 'expired';
    }
  }

  /**
   * Mark the RFQ as filled
   */
  markFilled() {
    this.status = 'filled';
  }

  /**
   * Mark the RFQ as cancelled
   */
  markCancelled() {
    if (this.status === 'open') {
      this.status = 'cancelled';
    }
  }

  /**
   * Convert RFQ to plain object
   * @returns {Object} Plain object representation
   */
  toJSON() {
    return {
      rfqId: this.rfqId,
      market: this.market,
      direction: this.direction,
      amount: this.amount,
      expiration: this.expiration,
      createdAt: this.createdAt,
      status: this.status
    };
  }
}

module.exports = RFQ;
