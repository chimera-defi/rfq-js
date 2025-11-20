import { ISystemEvent, EventType, IEventFilters } from './types';

/**
 * EventLog Class
 * Tracks all system events for audit trail and monitoring
 */
export class EventLog {
  private events: Map<string, ISystemEvent>;
  private eventIdCounter: number;
  private eventsByRFQ: Map<string, Set<string>>;

  constructor() {
    this.events = new Map();
    this.eventIdCounter = 0;
    this.eventsByRFQ = new Map();
  }

  /**
   * Generate a unique event ID
   */
  private generateEventId(): string {
    this.eventIdCounter++;
    return `event_${this.eventIdCounter}_${Date.now()}`;
  }

  /**
   * Log a system event
   * @param eventType - Type of event
   * @param rfqId - RFQ ID
   * @param quoteId - Optional quote ID
   * @param makerId - Optional maker ID
   * @param data - Optional additional data
   * @returns The created event
   */
  public logEvent(
    eventType: EventType,
    rfqId: string,
    quoteId?: string,
    makerId?: string,
    data?: any
  ): ISystemEvent {
    const event: ISystemEvent = {
      eventId: this.generateEventId(),
      eventType,
      timestamp: Date.now(),
      rfqId,
      quoteId,
      makerId,
      data
    };

    this.events.set(event.eventId, event);

    // Index by RFQ ID
    if (!this.eventsByRFQ.has(rfqId)) {
      this.eventsByRFQ.set(rfqId, new Set());
    }
    this.eventsByRFQ.get(rfqId)!.add(event.eventId);

    return event;
  }

  /**
   * Get all events with optional filters
   * @param filters - Optional filters
   * @returns Filtered events sorted by timestamp (newest first)
   */
  public getEvents(filters?: IEventFilters): ISystemEvent[] {
    let events = Array.from(this.events.values());

    if (filters) {
      if (filters.rfqId) {
        events = events.filter(e => e.rfqId === filters.rfqId);
      }
      if (filters.eventType) {
        events = events.filter(e => e.eventType === filters.eventType);
      }
      if (filters.startTime) {
        events = events.filter(e => e.timestamp >= filters.startTime!);
      }
      if (filters.endTime) {
        events = events.filter(e => e.timestamp <= filters.endTime!);
      }
      if (filters.makerId) {
        events = events.filter(e => e.makerId === filters.makerId);
      }
    }

    // Sort by timestamp, newest first
    return events.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Get events for a specific RFQ
   * @param rfqId - RFQ ID
   * @returns Events for the RFQ sorted by timestamp
   */
  public getEventsForRFQ(rfqId: string): ISystemEvent[] {
    const eventIds = this.eventsByRFQ.get(rfqId);
    if (!eventIds) {
      return [];
    }

    const events = Array.from(eventIds)
      .map(id => this.events.get(id)!)
      .filter(e => e !== undefined);

    return events.sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Get recent events
   * @param limit - Maximum number of events to return
   * @returns Recent events sorted by timestamp (newest first)
   */
  public getRecentEvents(limit: number = 100): ISystemEvent[] {
    const events = Array.from(this.events.values());
    return events
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Get event by ID
   * @param eventId - Event ID
   * @returns Event or null if not found
   */
  public getEvent(eventId: string): ISystemEvent | null {
    return this.events.get(eventId) || null;
  }

  /**
   * Get total event count
   * @returns Total number of events
   */
  public getEventCount(): number {
    return this.events.size;
  }

  /**
   * Get event counts by type
   * @returns Map of event type to count
   */
  public getEventCountsByType(): Map<EventType, number> {
    const counts = new Map<EventType, number>();
    
    for (const event of this.events.values()) {
      const current = counts.get(event.eventType) || 0;
      counts.set(event.eventType, current + 1);
    }

    return counts;
  }

  /**
   * Clear all events
   */
  public clear(): void {
    this.events.clear();
    this.eventsByRFQ.clear();
    this.eventIdCounter = 0;
  }
}
