import { EventLog } from '../EventLog';

describe('EventLog', () => {
  let eventLog: EventLog;

  beforeEach(() => {
    eventLog = new EventLog();
  });

  describe('Event Logging', () => {
    test('should log an event', () => {
      const event = eventLog.logEvent('rfq_created', 'rfq1', undefined, undefined, {
        market: 'BTC/USD'
      });

      expect(event.eventId).toBeDefined();
      expect(event.eventType).toBe('rfq_created');
      expect(event.rfqId).toBe('rfq1');
      expect(event.timestamp).toBeGreaterThan(0);
      expect(event.data.market).toBe('BTC/USD');
    });

    test('should log event with quote and maker', () => {
      const event = eventLog.logEvent('quote_added', 'rfq1', 'quote1', 'maker1', {
        price: 50000
      });

      expect(event.quoteId).toBe('quote1');
      expect(event.makerId).toBe('maker1');
      expect(event.data.price).toBe(50000);
    });

    test('should generate unique event IDs', () => {
      const event1 = eventLog.logEvent('rfq_created', 'rfq1');
      const event2 = eventLog.logEvent('rfq_created', 'rfq2');

      expect(event1.eventId).not.toBe(event2.eventId);
    });
  });

  describe('Event Retrieval', () => {
    beforeEach(() => {
      // Log some test events
      eventLog.logEvent('rfq_created', 'rfq1', undefined, undefined, { market: 'BTC/USD' });
      eventLog.logEvent('quote_added', 'rfq1', 'quote1', 'maker1');
      eventLog.logEvent('quote_added', 'rfq1', 'quote2', 'maker2');
      eventLog.logEvent('quote_accepted', 'rfq1', 'quote1', 'maker1');
      eventLog.logEvent('rfq_filled', 'rfq1', 'quote1', 'maker1');
      eventLog.logEvent('rfq_created', 'rfq2', undefined, undefined, { market: 'ETH/USD' });
    });

    test('should get all events', () => {
      const events = eventLog.getEvents();
      expect(events).toHaveLength(6);
      // Should be sorted newest first
      expect(events[0].eventType).toBe('rfq_created'); // rfq2
      expect(events[5].eventType).toBe('rfq_created'); // rfq1
    });

    test('should filter by rfqId', () => {
      const events = eventLog.getEvents({ rfqId: 'rfq1' });
      expect(events).toHaveLength(5);
      events.forEach(e => expect(e.rfqId).toBe('rfq1'));
    });

    test('should filter by eventType', () => {
      const events = eventLog.getEvents({ eventType: 'quote_added' });
      expect(events).toHaveLength(2);
      events.forEach(e => expect(e.eventType).toBe('quote_added'));
    });

    test('should filter by makerId', () => {
      const events = eventLog.getEvents({ makerId: 'maker1' });
      expect(events).toHaveLength(3);
      events.forEach(e => expect(e.makerId).toBe('maker1'));
    });

    test('should filter by time range', () => {
      const now = Date.now();
      const events = eventLog.getEvents({ 
        startTime: now - 1000,
        endTime: now + 1000
      });
      expect(events.length).toBeGreaterThan(0);
    });

    test('should combine multiple filters', () => {
      const events = eventLog.getEvents({ 
        rfqId: 'rfq1',
        eventType: 'quote_added'
      });
      expect(events).toHaveLength(2);
      events.forEach(e => {
        expect(e.rfqId).toBe('rfq1');
        expect(e.eventType).toBe('quote_added');
      });
    });
  });

  describe('getEventsForRFQ', () => {
    test('should get all events for an RFQ in chronological order', () => {
      eventLog.logEvent('rfq_created', 'rfq1');
      eventLog.logEvent('quote_added', 'rfq1', 'quote1', 'maker1');
      eventLog.logEvent('quote_added', 'rfq1', 'quote2', 'maker2');
      eventLog.logEvent('quote_accepted', 'rfq1', 'quote1', 'maker1');

      const events = eventLog.getEventsForRFQ('rfq1');
      
      expect(events).toHaveLength(4);
      expect(events[0].eventType).toBe('rfq_created');
      expect(events[1].eventType).toBe('quote_added');
      expect(events[2].eventType).toBe('quote_added');
      expect(events[3].eventType).toBe('quote_accepted');
    });

    test('should return empty array for non-existent RFQ', () => {
      const events = eventLog.getEventsForRFQ('nonexistent');
      expect(events).toEqual([]);
    });
  });

  describe('getRecentEvents', () => {
    test('should get recent events with default limit', () => {
      for (let i = 0; i < 150; i++) {
        eventLog.logEvent('rfq_created', `rfq${i}`);
      }

      const events = eventLog.getRecentEvents();
      expect(events).toHaveLength(100); // Default limit
    });

    test('should respect custom limit', () => {
      for (let i = 0; i < 50; i++) {
        eventLog.logEvent('rfq_created', `rfq${i}`);
      }

      const events = eventLog.getRecentEvents(10);
      expect(events).toHaveLength(10);
    });

    test('should return events sorted by timestamp (newest first)', () => {
      const event1 = eventLog.logEvent('rfq_created', 'rfq1');
      const event2 = eventLog.logEvent('rfq_created', 'rfq2');
      const event3 = eventLog.logEvent('rfq_created', 'rfq3');

      const events = eventLog.getRecentEvents();
      // Events should be sorted newest first (by timestamp, then by eventId)
      expect(events).toHaveLength(3);
      expect(events[0].timestamp).toBeGreaterThanOrEqual(events[1].timestamp);
      expect(events[1].timestamp).toBeGreaterThanOrEqual(events[2].timestamp);
      
      // Verify the events are present
      const eventIds = events.map(e => e.eventId);
      expect(eventIds).toContain(event1.eventId);
      expect(eventIds).toContain(event2.eventId);
      expect(eventIds).toContain(event3.eventId);
    });
  });

  describe('getEvent', () => {
    test('should get event by ID', () => {
      const logged = eventLog.logEvent('rfq_created', 'rfq1');
      const retrieved = eventLog.getEvent(logged.eventId);

      expect(retrieved).toEqual(logged);
    });

    test('should return null for non-existent event', () => {
      const event = eventLog.getEvent('nonexistent');
      expect(event).toBeNull();
    });
  });

  describe('Statistics', () => {
    test('should get total event count', () => {
      expect(eventLog.getEventCount()).toBe(0);

      eventLog.logEvent('rfq_created', 'rfq1');
      eventLog.logEvent('quote_added', 'rfq1', 'quote1', 'maker1');

      expect(eventLog.getEventCount()).toBe(2);
    });

    test('should get event counts by type', () => {
      eventLog.logEvent('rfq_created', 'rfq1');
      eventLog.logEvent('rfq_created', 'rfq2');
      eventLog.logEvent('quote_added', 'rfq1', 'quote1', 'maker1');
      eventLog.logEvent('quote_added', 'rfq1', 'quote2', 'maker2');
      eventLog.logEvent('quote_added', 'rfq2', 'quote3', 'maker1');
      eventLog.logEvent('quote_accepted', 'rfq1', 'quote1', 'maker1');

      const counts = eventLog.getEventCountsByType();

      expect(counts.get('rfq_created')).toBe(2);
      expect(counts.get('quote_added')).toBe(3);
      expect(counts.get('quote_accepted')).toBe(1);
    });
  });

  describe('clear', () => {
    test('should clear all events', () => {
      eventLog.logEvent('rfq_created', 'rfq1');
      eventLog.logEvent('quote_added', 'rfq1', 'quote1', 'maker1');

      expect(eventLog.getEventCount()).toBe(2);

      eventLog.clear();

      expect(eventLog.getEventCount()).toBe(0);
      expect(eventLog.getEvents()).toEqual([]);
    });
  });
});
