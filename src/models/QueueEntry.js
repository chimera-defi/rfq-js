/**
 * QueueEntry Model
 * Represents an event/action in the RFQ system queue
 */
class QueueEntry {
  constructor(rfqId, action, timestamp = Date.now(), data = {}) {
    this.rfqId = rfqId;
    this.action = action; // 'rfq_created', 'quote_added', 'quote_accepted', 'rfq_expired', 'rfq_cancelled'
    this.timestamp = timestamp;
    this.data = data; // Additional context (quoteId, makerId, etc.)
  }

  /**
   * Convert QueueEntry to plain object
   * @returns {Object} Plain object representation
   */
  toJSON() {
    return {
      rfqId: this.rfqId,
      action: this.action,
      timestamp: this.timestamp,
      data: this.data
    };
  }
}

module.exports = QueueEntry;
