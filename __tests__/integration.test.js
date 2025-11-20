const { RFQSystem } = require('../src/RFQSystem');

/**
 * Comprehensive Integration Tests
 * Testing complex scenarios and interactions between components
 */
describe('RFQ System Integration Tests', () => {
  let system;

  beforeEach(() => {
    system = new RFQSystem();
  });

  describe('Multiple RFQs and Quotes', () => {
    it('should handle multiple RFQs with multiple quotes each', () => {
      const expiration = Date.now() + 3600000;
      
      // Create multiple RFQs
      const rfq1 = system.createRFQ('rfq1', 'ETH/USD', 'buy', 100, expiration);
      const rfq2 = system.createRFQ('rfq2', 'BTC/USD', 'sell', 50, expiration);
      const rfq3 = system.createRFQ('rfq3', 'ETH/USD', 'sell', 200, expiration);

      // Add quotes to each RFQ
      system.addQuote('q1-1', 'rfq1', 2500.0, 'maker1');
      system.addQuote('q1-2', 'rfq1', 2501.0, 'maker2');
      system.addQuote('q1-3', 'rfq1', 2499.5, 'maker3');

      system.addQuote('q2-1', 'rfq2', 45000.0, 'maker1');
      system.addQuote('q2-2', 'rfq2', 45050.0, 'maker2');

      system.addQuote('q3-1', 'rfq3', 2500.0, 'maker2');
      system.addQuote('q3-2', 'rfq3', 2505.0, 'maker3');

      // Verify all quotes exist
      expect(system.getQuotesForRFQ('rfq1').length).toBe(3);
      expect(system.getQuotesForRFQ('rfq2').length).toBe(2);
      expect(system.getQuotesForRFQ('rfq3').length).toBe(2);

      // Accept quotes for different RFQs
      system.acceptQuote('q1-3'); // Best price for rfq1
      system.acceptQuote('q2-1'); // Best price for rfq2

      // Verify states
      expect(system.getRFQ('rfq1').status).toBe('filled');
      expect(system.getRFQ('rfq2').status).toBe('filled');
      expect(system.getRFQ('rfq3').status).toBe('open');

      // Verify quote states
      expect(system.getQuote('q1-3').status).toBe('accepted');
      expect(system.getQuote('q1-1').status).toBe('rejected');
      expect(system.getQuote('q1-2').status).toBe('rejected');
      expect(system.getQuote('q2-1').status).toBe('accepted');
      expect(system.getQuote('q3-1').status).toBe('pending'); // Still pending
    });

    it('should track queue entries for multiple RFQs correctly', () => {
      const expiration = Date.now() + 3600000;
      
      system.createRFQ('rfq1', 'ETH/USD', 'buy', 100, expiration);
      system.createRFQ('rfq2', 'BTC/USD', 'sell', 50, expiration);
      
      system.addQuote('q1', 'rfq1', 100.0);
      system.addQuote('q2', 'rfq2', 200.0);
      system.acceptQuote('q1');

      const rfq1Entries = system.getQueueEntries({ rfqId: 'rfq1' });
      const rfq2Entries = system.getQueueEntries({ rfqId: 'rfq2' });

      expect(rfq1Entries.length).toBe(3); // created + quote_added + quote_accepted
      expect(rfq2Entries.length).toBe(2); // created + quote_added

      // Verify actions
      expect(rfq1Entries.some(e => e.action === 'rfq_created')).toBe(true);
      expect(rfq1Entries.some(e => e.action === 'quote_added')).toBe(true);
      expect(rfq1Entries.some(e => e.action === 'quote_accepted')).toBe(true);
    });
  });

  describe('Expiration Scenarios', () => {
    it('should prevent adding quotes to expired RFQs', () => {
      const expiration = Date.now() + 3600000; // Future expiration
      const rfq = system.createRFQ('rfq1', 'ETH/USD', 'buy', 100, expiration);

      // Manually expire it (before checkExpirations is called)
      rfq.expiration = Date.now() - 1000;

      // Try to add quote - should detect expired RFQ even if status is still "open"
      expect(() => {
        system.addQuote('quote1', 'rfq1', 100.0);
      }).toThrow('Cannot add quote to expired RFQ (id: rfq1)');
    });

    it('should prevent accepting quotes for expired RFQs', () => {
      const expiration = Date.now() + 3600000;
      const rfq = system.createRFQ('rfq1', 'ETH/USD', 'buy', 100, expiration);
      const quote = system.addQuote('quote1', 'rfq1', 100.0);

      // Expire the RFQ
      rfq.expiration = Date.now() - 1000;

      // Try to accept quote - should check expiration first
      expect(() => {
        system.acceptQuote('quote1');
      }).toThrow('Cannot accept quote for RFQ with status "expired"');
    });

    it('should expire multiple RFQs and track in queue', () => {
      const expiration = Date.now() + 3600000;
      const rfq1 = system.createRFQ('rfq1', 'ETH/USD', 'buy', 100, expiration);
      const rfq2 = system.createRFQ('rfq2', 'BTC/USD', 'sell', 50, expiration);
      const rfq3 = system.createRFQ('rfq3', 'ETH/USD', 'sell', 200, expiration);

      // Force expiration
      rfq1.expiration = Date.now() - 1000;
      rfq2.expiration = Date.now() - 1000;
      // rfq3 remains valid

      const expiredRFQs = system.checkExpirations();
      expect(expiredRFQs.length).toBe(2);
      expect(expiredRFQs.map(r => r.rfqId).sort()).toEqual(['rfq1', 'rfq2']);

      // Verify queue entries
      const expiredEntries = system.getQueueEntries({ action: 'rfq_expired' });
      expect(expiredEntries.length).toBe(2);
    });
  });

  describe('Cancellation Scenarios', () => {
    it('should cancel RFQ with pending quotes', () => {
      const expiration = Date.now() + 3600000;
      system.createRFQ('rfq1', 'ETH/USD', 'buy', 100, expiration);
      
      system.addQuote('quote1', 'rfq1', 100.0, 'maker1');
      system.addQuote('quote2', 'rfq1', 101.0, 'maker2');

      const cancelledRFQ = system.cancelRFQ('rfq1');
      expect(cancelledRFQ.status).toBe('cancelled');

      // Quotes should still exist but RFQ is cancelled
      expect(system.getQuote('quote1')).toBeDefined();
      expect(system.getQuote('quote2')).toBeDefined();
      
      // Cannot add more quotes
      expect(() => {
        system.addQuote('quote3', 'rfq1', 102.0);
      }).toThrow('Cannot add quote to RFQ with status "cancelled"');
    });

    it('should not allow accepting quotes for cancelled RFQs', () => {
      const expiration = Date.now() + 3600000;
      system.createRFQ('rfq1', 'ETH/USD', 'buy', 100, expiration);
      system.addQuote('quote1', 'rfq1', 100.0);
      
      system.cancelRFQ('rfq1');

      expect(() => {
        system.acceptQuote('quote1');
      }).toThrow('Cannot accept quote for RFQ with status "cancelled"');
    });
  });

  describe('Queue Activity Tracking', () => {
    it('should track complete lifecycle in queue', () => {
      const expiration = Date.now() + 3600000;
      
      // Create RFQ
      system.createRFQ('rfq1', 'ETH/USD', 'buy', 100, expiration);
      
      // Add quotes
      system.addQuote('quote1', 'rfq1', 100.0, 'maker1');
      system.addQuote('quote2', 'rfq1', 101.0, 'maker2');
      
      // Accept quote
      system.acceptQuote('quote1');
      
      // Cancel (should fail since filled)
      expect(() => system.cancelRFQ('rfq1')).toThrow();

      const entries = system.getQueueEntries({ rfqId: 'rfq1' });
      expect(entries.length).toBe(4); // created + 2 quotes + accepted
      
      // Verify order and actions
      const actions = entries.map(e => e.action);
      expect(actions).toContain('rfq_created');
      expect(actions.filter(a => a === 'quote_added').length).toBe(2);
      expect(actions).toContain('quote_accepted');
    });

    it('should filter queue entries by action type', () => {
      const expiration = Date.now() + 3600000;
      
      system.createRFQ('rfq1', 'ETH/USD', 'buy', 100, expiration);
      system.createRFQ('rfq2', 'BTC/USD', 'sell', 50, expiration);
      
      system.addQuote('q1', 'rfq1', 100.0);
      system.addQuote('q2', 'rfq2', 200.0);
      system.acceptQuote('q1');

      const quoteAddedEntries = system.getQueueEntries({ action: 'quote_added' });
      expect(quoteAddedEntries.length).toBe(2);

      const acceptedEntries = system.getQueueEntries({ action: 'quote_accepted' });
      expect(acceptedEntries.length).toBe(1);
      expect(acceptedEntries[0].data.quoteId).toBe('q1');
    });

    it('should return recent activity in correct order', () => {
      const expiration = Date.now() + 3600000;
      
      system.createRFQ('rfq1', 'ETH/USD', 'buy', 100, expiration);
      system.createRFQ('rfq2', 'BTC/USD', 'sell', 50, expiration);
      system.addQuote('q1', 'rfq1', 100.0);
      system.addQuote('q2', 'rfq2', 200.0);
      system.acceptQuote('q1');

      const recent = system.getRecentActivity(3);
      expect(recent.length).toBe(3);
      // Most recent should be last action
      expect(recent[0].action).toBe('quote_accepted');
    });
  });

  describe('Statistics Accuracy', () => {
    it('should provide accurate statistics', () => {
      const expiration = Date.now() + 3600000;
      
      // Create RFQs
      system.createRFQ('rfq1', 'ETH/USD', 'buy', 100, expiration);
      system.createRFQ('rfq2', 'BTC/USD', 'sell', 50, expiration);
      const rfq3 = system.createRFQ('rfq3', 'ETH/USD', 'sell', 200, expiration);

      // Add quotes
      system.addQuote('q1', 'rfq1', 100.0);
      system.addQuote('q2', 'rfq1', 101.0);
      system.addQuote('q3', 'rfq2', 200.0);

      // Accept quote
      system.acceptQuote('q1');

      // Expire one
      rfq3.expiration = Date.now() - 1000;
      system.checkExpirations();

      const stats = system.getStats();
      expect(stats.totalRFQs).toBe(3);
      expect(stats.totalQuotes).toBe(3);
      expect(stats.openRFQs).toBe(1); // Only rfq2 is open
      expect(stats.filledRFQs).toBe(1); // rfq1
      expect(stats.expiredRFQs).toBe(1); // rfq3
    });

    it('should handle empty system statistics', () => {
      const stats = system.getStats();
      expect(stats.totalRFQs).toBe(0);
      expect(stats.totalQuotes).toBe(0);
      expect(stats.openRFQs).toBe(0);
      expect(stats.filledRFQs).toBe(0);
      expect(stats.expiredRFQs).toBe(0);
      expect(stats.totalQueueEntries).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle RFQ with no quotes', () => {
      const expiration = Date.now() + 3600000;
      const rfq = system.createRFQ('rfq1', 'ETH/USD', 'buy', 100, expiration);
      
      expect(system.getQuotesForRFQ('rfq1')).toEqual([]);
      expect(rfq.status).toBe('open');
    });

    it('should handle accepting quote when only one quote exists', () => {
      const expiration = Date.now() + 3600000;
      system.createRFQ('rfq1', 'ETH/USD', 'buy', 100, expiration);
      system.addQuote('quote1', 'rfq1', 100.0);

      const result = system.acceptQuote('quote1');
      expect(result.quote.status).toBe('accepted');
      expect(result.rfq.status).toBe('filled');
    });

    it('should handle multiple RFQs in same market', () => {
      const expiration = Date.now() + 3600000;
      
      system.createRFQ('rfq1', 'ETH/USD', 'buy', 100, expiration);
      system.createRFQ('rfq2', 'ETH/USD', 'buy', 200, expiration);
      system.createRFQ('rfq3', 'ETH/USD', 'sell', 150, expiration);

      const ethRFQs = system.getAllRFQs({ market: 'ETH/USD' });
      expect(ethRFQs.length).toBe(3);

      const buyRFQs = system.getAllRFQs({ market: 'ETH/USD', direction: 'buy' });
      expect(buyRFQs.length).toBe(2);
    });

    it('should handle rapid quote additions and acceptance', () => {
      const expiration = Date.now() + 3600000;
      system.createRFQ('rfq1', 'ETH/USD', 'buy', 100, expiration);

      // Add multiple quotes rapidly
      for (let i = 1; i <= 10; i++) {
        system.addQuote(`quote${i}`, 'rfq1', 100.0 + i, `maker${i}`);
      }

      expect(system.getQuotesForRFQ('rfq1').length).toBe(10);

      // Accept one
      system.acceptQuote('quote5');
      
      // All others should be rejected
      const quotes = system.getQuotesForRFQ('rfq1');
      expect(quotes.filter(q => q.status === 'accepted').length).toBe(1);
      expect(quotes.filter(q => q.status === 'rejected').length).toBe(9);
    });
  });

  describe('Data Integrity', () => {
    it('should maintain data consistency after operations', () => {
      const expiration = Date.now() + 3600000;
      
      system.createRFQ('rfq1', 'ETH/USD', 'buy', 100, expiration);
      system.addQuote('quote1', 'rfq1', 100.0, 'maker1');
      system.addQuote('quote2', 'rfq1', 101.0, 'maker2');

      // Verify RFQ has correct quotes
      const quotes = system.getQuotesForRFQ('rfq1');
      expect(quotes.length).toBe(2);
      expect(quotes.every(q => q.rfqId === 'rfq1')).toBe(true);

      // Accept quote
      system.acceptQuote('quote1');

      // Verify RFQ is filled
      const rfq = system.getRFQ('rfq1');
      expect(rfq.status).toBe('filled');

      // Verify quote states
      expect(system.getQuote('quote1').status).toBe('accepted');
      expect(system.getQuote('quote2').status).toBe('rejected');
    });

    it('should maintain queue integrity across operations', () => {
      const expiration = Date.now() + 3600000;
      
      system.createRFQ('rfq1', 'ETH/USD', 'buy', 100, expiration);
      system.addQuote('quote1', 'rfq1', 100.0);
      system.acceptQuote('quote1');

      const entries = system.getQueueEntries({ rfqId: 'rfq1' });
      
      // Verify all entries reference correct RFQ
      expect(entries.every(e => e.rfqId === 'rfq1')).toBe(true);
      
      // Verify quote_accepted entry has correct data
      const acceptedEntry = entries.find(e => e.action === 'quote_accepted');
      expect(acceptedEntry).toBeDefined();
      expect(acceptedEntry.data.quoteId).toBe('quote1');
    });
  });
});
