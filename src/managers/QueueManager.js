const QueueEntry = require('../models/QueueEntry');

/**
 * QueueManager
 * Manages the event queue tracking RFQ and quote activities
 */
class QueueManager {
  constructor() {
    this.queue = []; // Array of QueueEntry instances
  }

  /**
   * Add an entry to the queue
   * @param {string} rfqId - RFQ identifier
   * @param {string} action - Action type ('rfq_created', 'quote_added', 'quote_accepted', 'rfq_expired', 'rfq_cancelled')
   * @param {Object} data - Additional context data (quoteId, makerId, etc.)
   * @returns {QueueEntry} Created QueueEntry instance
   */
  addQueueEntry(rfqId, action, data = {}) {
    const entry = new QueueEntry(rfqId, action, Date.now(), data);
    this.queue.push(entry);
    return entry;
  }

  /**
   * Get queue entries with optional filters
   * @param {Object} filters - Filter options
   * @param {string} filters.rfqId - Filter by RFQ ID
   * @param {string} filters.action - Filter by action type
   * @param {number} filters.startTime - Filter entries after this timestamp
   * @param {number} filters.endTime - Filter entries before this timestamp
   * @returns {Array<QueueEntry>} Array of QueueEntry instances
   */
  getQueueEntries(filters = {}) {
    let entries = [...this.queue];

    // Apply filters
    if (filters.rfqId) {
      entries = entries.filter(entry => entry.rfqId === filters.rfqId);
    }

    if (filters.action) {
      entries = entries.filter(entry => entry.action === filters.action);
    }

    if (filters.startTime !== undefined) {
      entries = entries.filter(entry => entry.timestamp >= filters.startTime);
    }

    if (filters.endTime !== undefined) {
      entries = entries.filter(entry => entry.timestamp <= filters.endTime);
    }

    return entries;
  }

  /**
   * Get recent activity entries
   * @param {number} limit - Maximum number of entries to return (default: 100)
   * @returns {Array<QueueEntry>} Array of most recent QueueEntry instances
   */
  getRecentActivity(limit = 100) {
    return this.queue
      .slice(-limit)
      .reverse(); // Most recent first
  }

  /**
   * Get count of queue entries
   * @returns {number} Total number of queue entries
   */
  getCount() {
    return this.queue.length;
  }

  /**
   * Get count of entries for a specific RFQ
   * @param {string} rfqId - RFQ identifier
   * @returns {number} Number of entries for the RFQ
   */
  getCountForRFQ(rfqId) {
    return this.queue.filter(entry => entry.rfqId === rfqId).length;
  }

  /**
   * Clear all queue entries (useful for testing)
   */
  clear() {
    this.queue = [];
  }
}

module.exports = QueueManager;
