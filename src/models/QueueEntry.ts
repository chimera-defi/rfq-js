/**
 * QueueEntry Model
 * Represents an event/action in the RFQ system queue
 */

export type QueueAction = 
  | 'rfq_created' 
  | 'quote_added' 
  | 'quote_accepted' 
  | 'rfq_expired' 
  | 'rfq_cancelled';

export interface QueueEntryData {
  rfqId: string;
  action: QueueAction;
  timestamp: number;
  data: Record<string, unknown>;
}

export class QueueEntry {
  public readonly rfqId: string;
  public readonly action: QueueAction;
  public readonly timestamp: number;
  public readonly data: Record<string, unknown>;

  constructor(
    rfqId: string,
    action: QueueAction,
    timestamp: number = Date.now(),
    data: Record<string, unknown> = {}
  ) {
    this.rfqId = rfqId;
    this.action = action;
    this.timestamp = timestamp;
    this.data = data;
  }

  /**
   * Convert QueueEntry to plain object
   * @returns {QueueEntryData} Plain object representation
   */
  toJSON(): QueueEntryData {
    return {
      rfqId: this.rfqId,
      action: this.action,
      timestamp: this.timestamp,
      data: this.data
    };
  }
}
