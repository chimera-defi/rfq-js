/**
 * Quote Class
 * Represents a maker's response to an RFQ
 */
class Quote {
  /**
   * Create a Quote
   * @param {string} id - Unique identifier
   * @param {string} rfqId - Reference to the RFQ
   * @param {string} makerId - Identifier for the maker
   * @param {number} pricePerToken - Price offered by the maker
   */
  constructor(id, rfqId, makerId, pricePerToken) {
    this.validate(id, rfqId, makerId, pricePerToken);
    
    this.id = id;
    this.rfqId = rfqId;
    this.makerId = makerId;
    this.pricePerToken = pricePerToken;
    this.createdAt = Date.now();
  }

  /**
   * Validate Quote parameters
   */
  validate(id, rfqId, makerId, pricePerToken) {
    if (!id || typeof id !== 'string') {
      throw new Error('Quote id must be a non-empty string');
    }

    if (!rfqId || typeof rfqId !== 'string') {
      throw new Error('RFQ id must be a non-empty string');
    }

    if (!makerId || typeof makerId !== 'string') {
      throw new Error('Maker id must be a non-empty string');
    }

    if (typeof pricePerToken !== 'number' || pricePerToken <= 0) {
      throw new Error('Price per token must be a positive number');
    }
  }

  /**
   * Get a plain object representation of the Quote
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.id,
      rfqId: this.rfqId,
      makerId: this.makerId,
      pricePerToken: this.pricePerToken,
      createdAt: this.createdAt
    };
  }
}

module.exports = Quote;
