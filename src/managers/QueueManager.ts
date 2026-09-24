import { QueueEntry, QueueAction } from '../models/QueueEntry';

export interface QueueFilters {
  rfqId?: string;
  action?: QueueAction;
  startTime?: number;
  endTime?: number;
}

/**
 * QueueManager
 * Manages the event queue tracking RFQ and quote activities
 */
export class QueueManager {
  private queue: QueueEntry[] = [];

  /**
   * Add an entry to the queue
   * @param rfqId - RFQ identifier
   * @param action - Action type
   * @param data - Additional context data (quoteId, makerId, etc.)
   * @returns Created QueueEntry instance
   */
  addQueueEntry(
    rfqId: string,
    action: QueueAction,
    data: Record<string, unknown> = {}
  ): QueueEntry {
    const entry = new QueueEntry(rfqId, action, Date.now(), data);
    this.queue.push(entry);
    return entry;
  }

  /**
   * Get queue entries with optional filters
   * @param filters - Filter options
   * @returns Array of QueueEntry instances
   */
  getQueueEntries(filters: QueueFilters = {}): QueueEntry[] {
    let entries = [...this.queue];

    // Apply filters
    if (filters.rfqId) {
      entries = entries.filter(entry => entry.rfqId === filters.rfqId);
    }

    if (filters.action) {
      entries = entries.filter(entry => entry.action === filters.action);
    }

    if (filters.startTime !== undefined) {
      entries = entries.filter(entry => entry.timestamp >= filters.startTime!);
    }

    if (filters.endTime !== undefined) {
      entries = entries.filter(entry => entry.timestamp <= filters.endTime!);
    }

    return entries;
  }

  /**
   * Get recent activity entries
   * @param limit - Maximum number of entries to return (default: 100)
   * @returns Array of most recent QueueEntry instances
   */
  getRecentActivity(limit: number = 100): QueueEntry[] {
    return this.queue
      .slice(-limit)
      .reverse(); // Most recent first
  }

  /**
   * Get count of queue entries
   * @returns Total number of queue entries
   */
  getCount(): number {
    return this.queue.length;
  }

  /**
   * Get count of entries for a specific RFQ
   * @param rfqId - RFQ identifier
   * @returns Number of entries for the RFQ
   */
  getCountForRFQ(rfqId: string): number {
    return this.queue.filter(entry => entry.rfqId === rfqId).length;
  }

  /**
   * Clear all queue entries (useful for testing)
   */
  clear(): void {
    this.queue = [];
  }
}
