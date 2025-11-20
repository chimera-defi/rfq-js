const { RFQSystem } = require('../src/RFQSystem');

describe('RFQSystem', () => {
  let system;

  beforeEach(() => {
    system = new RFQSystem();
  });

  describe('createRFQ', () => {
    it('should create an RFQ and add to queue', () => {
      const expiration = Date.now() + 3600000;
      const rfq = system.createRFQ('rfq1', 'ETH/USD', 'buy', 100, expiration);

      expect(rfq).toBeDefined();
      expect(rfq.rfqId).toBe('rfq1');
      
      const queueEntries = system.getQueueEntries({ rfqId: 'rfq1' });
      expect(queueEntries.length).toBe(1);
      expect(queueEntries[0].action).toBe('rfq_created');
    });
  });

  describe('addQuote', () => {
    beforeEach(() => {
      const expiration = Date.now() + 3600000;
      system.createRFQ('rfq1', 'ETH/USD', 'buy', 100, expiration);
    });

    it('should add a quote and add to queue', () => {
      const quote = system.addQuote('quote1', 'rfq1', 100.5, 'maker1');

      expect(quote).toBeDefined();
      expect(quote.quoteId).toBe('quote1');
      expect(quote.rfqId).toBe('rfq1');
      
      const queueEntries = system.getQueueEntries({ rfqId: 'rfq1' });
      expect(queueEntries.some(e => e.action === 'quote_added')).toBe(true);
    });

    it('should throw error if RFQ not found', () => {
      expect(() => {
        system.addQuote('quote1', 'nonexistent', 100.5);
      }).toThrow('RFQ with ID "nonexistent" not found');
    });

    it('should throw error if RFQ is not open', () => {
      const expiration = Date.now() + 3600000;
      const rfq = system.createRFQ('rfq2', 'BTC/USD', 'sell', 50, expiration);
      rfq.markFilled();

      expect(() => {
        system.addQuote('quote1', 'rfq2', 100.5);
      }).toThrow('Cannot add quote to RFQ with status "filled"');
    });

    it('should throw error if RFQ is expired', () => {
      const pastExpiration = Date.now() - 1000;
      const rfq = system.createRFQ('rfq2', 'BTC/USD', 'sell', 50, Date.now() + 3600000);
      rfq.expiration = pastExpiration; // Force expiration

      expect(() => {
        system.addQuote('quote1', 'rfq2', 100.5);
      }).toThrow('Cannot add quote to RFQ with status "expired"');
    });
  });

  describe('acceptQuote', () => {
    beforeEach(() => {
      const expiration = Date.now() + 3600000;
      system.createRFQ('rfq1', 'ETH/USD', 'buy', 100, expiration);
      system.addQuote('quote1', 'rfq1', 100.5, 'maker1');
      system.addQuote('quote2', 'rfq1', 101.0, 'maker2');
    });

    it('should accept a quote and mark RFQ as filled', () => {
      const result = system.acceptQuote('quote1');

      expect(result.quote.status).toBe('accepted');
      expect(result.rfq.status).toBe('filled');
      
      const queueEntries = system.getQueueEntries({ rfqId: 'rfq1' });
      expect(queueEntries.some(e => e.action === 'quote_accepted')).toBe(true);
    });

    it('should reject other quotes for the same RFQ', () => {
      system.acceptQuote('quote1');

      const quote2 = system.getQuote('quote2');
      expect(quote2.status).toBe('rejected');
    });

    it('should throw error if quote not found', () => {
      expect(() => {
        system.acceptQuote('nonexistent');
      }).toThrow('Quote with ID "nonexistent" not found');
    });

    it('should throw error if RFQ is not open', () => {
      const expiration = Date.now() + 3600000;
      system.createRFQ('rfq2', 'BTC/USD', 'sell', 50, expiration);
      const quote = system.addQuote('quote3', 'rfq2', 200.0);
      
      const rfq = system.getRFQ('rfq2');
      rfq.markCancelled();

      expect(() => {
        system.acceptQuote('quote3');
      }).toThrow('Cannot accept quote for RFQ with status "cancelled"');
    });
  });

  describe('cancelRFQ', () => {
    it('should cancel RFQ and add to queue', () => {
      const expiration = Date.now() + 3600000;
      system.createRFQ('rfq1', 'ETH/USD', 'buy', 100, expiration);
      
      const cancelledRFQ = system.cancelRFQ('rfq1');
      expect(cancelledRFQ.status).toBe('cancelled');
      
      const queueEntries = system.getQueueEntries({ rfqId: 'rfq1' });
      expect(queueEntries.some(e => e.action === 'rfq_cancelled')).toBe(true);
    });
  });

  describe('checkExpirations', () => {
    it('should mark expired RFQs and add to queue', () => {
      const expiration = Date.now() + 3600000;
      const rfq1 = system.createRFQ('rfq1', 'ETH/USD', 'buy', 100, expiration);
      const rfq2 = system.createRFQ('rfq2', 'BTC/USD', 'sell', 50, expiration);
      
      // Force expiration
      rfq1.expiration = Date.now() - 1000;
      
      const expiredRFQs = system.checkExpirations();
      expect(expiredRFQs.length).toBe(1);
      expect(expiredRFQs[0].rfqId).toBe('rfq1');
      
      const queueEntries = system.getQueueEntries({ action: 'rfq_expired' });
      expect(queueEntries.length).toBe(1);
    });
  });

  describe('end-to-end flow', () => {
    it('should handle complete RFQ lifecycle', () => {
      const expiration = Date.now() + 3600000;
      
      // 1. Create RFQ
      const rfq = system.createRFQ('rfq1', 'ETH/USD', 'buy', 100, expiration);
      expect(rfq.status).toBe('open');
      
      // 2. Add multiple quotes
      const quote1 = system.addQuote('quote1', 'rfq1', 100.5, 'maker1');
      const quote2 = system.addQuote('quote2', 'rfq1', 101.0, 'maker2');
      const quote3 = system.addQuote('quote3', 'rfq1', 99.5, 'maker3');
      
      expect(system.getQuotesForRFQ('rfq1').length).toBe(3);
      
      // 3. Accept a quote
      const result = system.acceptQuote('quote2');
      expect(result.quote.status).toBe('accepted');
      expect(result.rfq.status).toBe('filled');
      
      // 4. Verify other quotes are rejected
      expect(system.getQuote('quote1').status).toBe('rejected');
      expect(system.getQuote('quote3').status).toBe('rejected');
      
      // 5. Verify queue entries
      const queueEntries = system.getQueueEntries({ rfqId: 'rfq1' });
      expect(queueEntries.length).toBe(5); // created + 3 quotes + 1 accepted
      expect(queueEntries.some(e => e.action === 'rfq_created')).toBe(true);
      expect(queueEntries.some(e => e.action === 'quote_added')).toBe(true);
      expect(queueEntries.some(e => e.action === 'quote_accepted')).toBe(true);
    });
  });

  describe('getStats', () => {
    it('should return system statistics', () => {
      const expiration = Date.now() + 3600000;
      
      system.createRFQ('rfq1', 'ETH/USD', 'buy', 100, expiration);
      system.createRFQ('rfq2', 'BTC/USD', 'sell', 50, expiration);
      system.addQuote('quote1', 'rfq1', 100.5);
      
      const stats = system.getStats();
      expect(stats.totalRFQs).toBe(2);
      expect(stats.totalQuotes).toBe(1);
      expect(stats.openRFQs).toBe(2);
      expect(stats.filledRFQs).toBe(0);
    });
  });

  describe('getQuotesForRFQ', () => {
    it('should return all quotes for an RFQ', () => {
      const expiration = Date.now() + 3600000;
      system.createRFQ('rfq1', 'ETH/USD', 'buy', 100, expiration);
      system.addQuote('quote1', 'rfq1', 100.5);
      system.addQuote('quote2', 'rfq1', 101.0);
      
      const quotes = system.getQuotesForRFQ('rfq1');
      expect(quotes.length).toBe(2);
    });
  });
});
