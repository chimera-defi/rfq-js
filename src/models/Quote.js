/**
 * Quote Model
 * Represents a maker's offer to fill an RFQ at a specific price
 */
class Quote {
  constructor(quoteId, rfqId, pricePerToken, makerId = null, createdAt = Date.now()) {
    this.quoteId = quoteId;
    this.rfqId = rfqId;
    this.pricePerToken = pricePerToken;
    this.makerId = makerId;
    this.createdAt = createdAt;
    this.status = 'pending'; // 'pending', 'accepted', 'rejected'
  }

  /**
   * Mark the quote as accepted
   */
  markAccepted() {
    this.status = 'accepted';
  }

  /**
   * Mark the quote as rejected
   */
  markRejected() {
    if (this.status === 'pending') {
      this.status = 'rejected';
    }
  }

  /**
   * Check if the quote is pending
   * @returns {boolean} True if pending
   */
  isPending() {
    return this.status === 'pending';
  }

  /**
   * Convert Quote to plain object
   * @returns {Object} Plain object representation
   */
  toJSON() {
    return {
      quoteId: this.quoteId,
      rfqId: this.rfqId,
      pricePerToken: this.pricePerToken,
      makerId: this.makerId,
      createdAt: this.createdAt,
      status: this.status
    };
  }
}

module.exports = Quote;
