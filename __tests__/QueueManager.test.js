const { QueueManager } = require('../src/managers/QueueManager');

describe('QueueManager', () => {
  let manager;

  beforeEach(() => {
    manager = new QueueManager();
  });

  describe('addQueueEntry', () => {
    it('should add a queue entry', () => {
      const entry = manager.addQueueEntry('rfq1', 'rfq_created', {});
      expect(entry).toBeDefined();
      expect(entry.rfqId).toBe('rfq1');
      expect(entry.action).toBe('rfq_created');
      expect(entry.timestamp).toBeDefined();
    });

    it('should add entry with data', () => {
      const data = { quoteId: 'quote1', makerId: 'maker1' };
      const entry = manager.addQueueEntry('rfq1', 'quote_added', data);
      expect(entry.data).toEqual(data);
    });

    it('should add multiple entries', () => {
      manager.addQueueEntry('rfq1', 'rfq_created');
      manager.addQueueEntry('rfq1', 'quote_added', { quoteId: 'quote1' });
      expect(manager.getCount()).toBe(2);
    });
  });

  describe('getQueueEntries', () => {
    beforeEach(() => {
      const baseTime = Date.now();
      // Add entries with different RFQs, actions, and times
      manager.addQueueEntry('rfq1', 'rfq_created');
      manager.addQueueEntry('rfq1', 'quote_added', { quoteId: 'quote1' });
      manager.addQueueEntry('rfq2', 'rfq_created');
      manager.addQueueEntry('rfq1', 'quote_accepted', { quoteId: 'quote1' });
    });

    it('should return all entries when no filters applied', () => {
      const entries = manager.getQueueEntries();
      expect(entries.length).toBe(4);
    });

    it('should filter by RFQ ID', () => {
      const entries = manager.getQueueEntries({ rfqId: 'rfq1' });
      expect(entries.length).toBe(3);
      expect(entries.every(entry => entry.rfqId === 'rfq1')).toBe(true);
    });

    it('should filter by action', () => {
      const entries = manager.getQueueEntries({ action: 'rfq_created' });
      expect(entries.length).toBe(2);
      expect(entries.every(entry => entry.action === 'rfq_created')).toBe(true);
    });

    it('should filter by startTime', () => {
      // Clear existing entries for this test
      manager.clear();
      
      const baseTime = 1000000;
      // Manually create entries with specific timestamps
      const entry1 = manager.addQueueEntry('rfq1', 'action1');
      entry1.timestamp = baseTime;
      const entry2 = manager.addQueueEntry('rfq2', 'action2');
      entry2.timestamp = baseTime + 100;
      
      const startTime = baseTime + 50;
      
      const entry3 = manager.addQueueEntry('rfq3', 'rfq_created');
      entry3.timestamp = baseTime + 200;
      
      const entries = manager.getQueueEntries({ startTime });
      expect(entries.length).toBe(2); // entry2 and entry3 (after startTime)
      expect(entries.some(e => e.rfqId === 'rfq2')).toBe(true);
      expect(entries.some(e => e.rfqId === 'rfq3')).toBe(true);
    });

    it('should filter by endTime', () => {
      const baseTime = 1000000;
      // Set timestamps for existing entries
      const existingEntries = manager.getQueueEntries();
      existingEntries.forEach((entry, index) => {
        entry.timestamp = baseTime + (index * 100);
      });
      
      const endTime = baseTime + 350; // After all 4 existing entries (0, 100, 200, 300)
      
      const newEntry = manager.addQueueEntry('rfq3', 'rfq_created');
      newEntry.timestamp = baseTime + 400; // After endTime
      
      const entries = manager.getQueueEntries({ endTime });
      expect(entries.length).toBe(4); // Only entries before endTime (from beforeEach)
      expect(entries.every(e => e.timestamp <= endTime)).toBe(true);
      expect(entries.every(e => e.rfqId !== 'rfq3')).toBe(true); // New entry should be excluded
    });

    it('should apply multiple filters', () => {
      const entries = manager.getQueueEntries({ 
        rfqId: 'rfq1', 
        action: 'quote_added' 
      });
      expect(entries.length).toBe(1);
      expect(entries[0].action).toBe('quote_added');
    });
  });

  describe('getRecentActivity', () => {
    it('should return recent entries in reverse order', () => {
      manager.addQueueEntry('rfq1', 'action1');
      manager.addQueueEntry('rfq2', 'action2');
      manager.addQueueEntry('rfq3', 'action3');

      const recent = manager.getRecentActivity(2);
      expect(recent.length).toBe(2);
      expect(recent[0].rfqId).toBe('rfq3'); // Most recent first
      expect(recent[1].rfqId).toBe('rfq2');
    });

    it('should respect limit', () => {
      for (let i = 0; i < 150; i++) {
        manager.addQueueEntry(`rfq${i}`, 'action');
      }

      const recent = manager.getRecentActivity(100);
      expect(recent.length).toBe(100);
    });

    it('should default to 100 entries', () => {
      for (let i = 0; i < 50; i++) {
        manager.addQueueEntry(`rfq${i}`, 'action');
      }

      const recent = manager.getRecentActivity();
      expect(recent.length).toBe(50); // Less than 100, so all entries
    });
  });

  describe('getCount', () => {
    it('should return correct count', () => {
      expect(manager.getCount()).toBe(0);
      manager.addQueueEntry('rfq1', 'action1');
      expect(manager.getCount()).toBe(1);
      manager.addQueueEntry('rfq2', 'action2');
      expect(manager.getCount()).toBe(2);
    });
  });

  describe('getCountForRFQ', () => {
    it('should return correct count for RFQ', () => {
      expect(manager.getCountForRFQ('rfq1')).toBe(0);
      manager.addQueueEntry('rfq1', 'action1');
      expect(manager.getCountForRFQ('rfq1')).toBe(1);
      manager.addQueueEntry('rfq1', 'action2');
      expect(manager.getCountForRFQ('rfq1')).toBe(2);
      manager.addQueueEntry('rfq2', 'action3');
      expect(manager.getCountForRFQ('rfq1')).toBe(2);
      expect(manager.getCountForRFQ('rfq2')).toBe(1);
    });
  });
});
