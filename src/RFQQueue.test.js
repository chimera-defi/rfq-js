const RFQ = require('./RFQ');
const Quote = require('./Quote');
const RFQQueue = require('./RFQQueue');

describe('RFQQueue', () => {
  let queue;
  const futureTime = Date.now() + 60000;

  beforeEach(() => {
    queue = new RFQQueue();
  });

  describe('addRFQ', () => {
    test('should add an RFQ to the queue', () => {
      const rfq = new RFQ('rfq1', 'BTC/USD', 'buy', 100, futureTime);
      const result = queue.addRFQ(rfq);
      
      expect(result).toBe(rfq);
      expect(queue.getRFQ('rfq1')).toBe(rfq);
    });

    test('should throw error for invalid RFQ', () => {
      expect(() => queue.addRFQ(null))
        .toThrow('Invalid RFQ object');
      expect(() => queue.addRFQ({}))
        .toThrow('Invalid RFQ object');
    });

    test('should throw error for duplicate RFQ id', () => {
      const rfq1 = new RFQ('rfq1', 'BTC/USD', 'buy', 100, futureTime);
      const rfq2 = new RFQ('rfq1', 'ETH/USD', 'sell', 50, futureTime);
      
      queue.addRFQ(rfq1);
      expect(() => queue.addRFQ(rfq2))
        .toThrow('RFQ with id rfq1 already exists');
    });
  });

  describe('getRFQ', () => {
    test('should retrieve an RFQ by id', () => {
      const rfq = new RFQ('rfq1', 'BTC/USD', 'buy', 100, futureTime);
      queue.addRFQ(rfq);
      
      expect(queue.getRFQ('rfq1')).toBe(rfq);
    });

    test('should return null for non-existent RFQ', () => {
      expect(queue.getRFQ('nonexistent')).toBeNull();
    });
  });

  describe('getAllRFQs', () => {
    test('should return empty array when no RFQs', () => {
      expect(queue.getAllRFQs()).toEqual([]);
    });

    test('should return all RFQs', () => {
      const rfq1 = new RFQ('rfq1', 'BTC/USD', 'buy', 100, futureTime);
      const rfq2 = new RFQ('rfq2', 'ETH/USD', 'sell', 50, futureTime);
      
      queue.addRFQ(rfq1);
      queue.addRFQ(rfq2);
      
      const allRfqs = queue.getAllRFQs();
      expect(allRfqs).toHaveLength(2);
      expect(allRfqs).toContain(rfq1);
      expect(allRfqs).toContain(rfq2);
    });
  });

  describe('addQuote', () => {
    test('should add a quote to an open RFQ', () => {
      const rfq = new RFQ('rfq1', 'BTC/USD', 'buy', 100, futureTime);
      queue.addRFQ(rfq);
      
      const quote = new Quote('quote1', 'rfq1', 'maker1', 50000);
      const result = queue.addQuote(quote);
      
      expect(result).toBe(quote);
      expect(queue.getQuote('quote1')).toBe(quote);
    });

    test('should throw error for invalid quote', () => {
      expect(() => queue.addQuote(null))
        .toThrow('Invalid Quote object');
      expect(() => queue.addQuote({}))
        .toThrow('Invalid Quote object');
    });

    test('should throw error when RFQ does not exist', () => {
      const quote = new Quote('quote1', 'nonexistent', 'maker1', 50000);
      
      expect(() => queue.addQuote(quote))
        .toThrow('RFQ with id nonexistent not found');
    });

    test('should throw error when RFQ is not open', () => {
      const rfq = new RFQ('rfq1', 'BTC/USD', 'buy', 100, futureTime);
      queue.addRFQ(rfq);
      rfq.fill('someQuote');
      
      const quote = new Quote('quote1', 'rfq1', 'maker1', 50000);
      
      expect(() => queue.addQuote(quote))
        .toThrow('Cannot add quote to RFQ with status: filled');
    });

    test('should throw error for duplicate quote id', () => {
      const rfq = new RFQ('rfq1', 'BTC/USD', 'buy', 100, futureTime);
      queue.addRFQ(rfq);
      
      const quote1 = new Quote('quote1', 'rfq1', 'maker1', 50000);
      const quote2 = new Quote('quote1', 'rfq1', 'maker2', 51000);
      
      queue.addQuote(quote1);
      expect(() => queue.addQuote(quote2))
        .toThrow('Quote with id quote1 already exists');
    });
  });

  describe('getQuote', () => {
    test('should retrieve a quote by id', () => {
      const rfq = new RFQ('rfq1', 'BTC/USD', 'buy', 100, futureTime);
      queue.addRFQ(rfq);
      
      const quote = new Quote('quote1', 'rfq1', 'maker1', 50000);
      queue.addQuote(quote);
      
      expect(queue.getQuote('quote1')).toBe(quote);
    });

    test('should return null for non-existent quote', () => {
      expect(queue.getQuote('nonexistent')).toBeNull();
    });
  });

  describe('getQuotes', () => {
    test('should return empty array for RFQ with no quotes', () => {
      const rfq = new RFQ('rfq1', 'BTC/USD', 'buy', 100, futureTime);
      queue.addRFQ(rfq);
      
      expect(queue.getQuotes('rfq1')).toEqual([]);
    });

    test('should return all quotes for an RFQ', () => {
      const rfq = new RFQ('rfq1', 'BTC/USD', 'buy', 100, futureTime);
      queue.addRFQ(rfq);
      
      const quote1 = new Quote('quote1', 'rfq1', 'maker1', 50000);
      const quote2 = new Quote('quote2', 'rfq1', 'maker2', 51000);
      
      queue.addQuote(quote1);
      queue.addQuote(quote2);
      
      const quotes = queue.getQuotes('rfq1');
      expect(quotes).toHaveLength(2);
      expect(quotes).toContain(quote1);
      expect(quotes).toContain(quote2);
    });

    test('should return empty array for non-existent RFQ', () => {
      expect(queue.getQuotes('nonexistent')).toEqual([]);
    });
  });

  describe('selectQuote', () => {
    test('should select a quote and fill the RFQ', () => {
      const rfq = new RFQ('rfq1', 'BTC/USD', 'buy', 100, futureTime);
      queue.addRFQ(rfq);
      
      const quote = new Quote('quote1', 'rfq1', 'maker1', 50000);
      queue.addQuote(quote);
      
      const result = queue.selectQuote('rfq1', 'quote1');
      
      expect(result.rfq).toBe(rfq);
      expect(result.quote).toBe(quote);
      expect(rfq.status).toBe('filled');
      expect(rfq.selectedQuoteId).toBe('quote1');
    });

    test('should throw error when RFQ not found', () => {
      expect(() => queue.selectQuote('nonexistent', 'quote1'))
        .toThrow('RFQ with id nonexistent not found');
    });

    test('should throw error when quote not found', () => {
      const rfq = new RFQ('rfq1', 'BTC/USD', 'buy', 100, futureTime);
      queue.addRFQ(rfq);
      
      expect(() => queue.selectQuote('rfq1', 'nonexistent'))
        .toThrow('Quote with id nonexistent not found');
    });

    test('should throw error when quote does not belong to RFQ', () => {
      const rfq1 = new RFQ('rfq1', 'BTC/USD', 'buy', 100, futureTime);
      const rfq2 = new RFQ('rfq2', 'ETH/USD', 'sell', 50, futureTime);
      queue.addRFQ(rfq1);
      queue.addRFQ(rfq2);
      
      const quote = new Quote('quote1', 'rfq2', 'maker1', 50000);
      queue.addQuote(quote);
      
      expect(() => queue.selectQuote('rfq1', 'quote1'))
        .toThrow('Quote quote1 does not belong to RFQ rfq1');
    });
  });

  describe('expireRFQs', () => {
    test('should expire RFQs past their expiration time', async () => {
      const shortFuture = Date.now() + 10;
      const rfq = new RFQ('rfq1', 'BTC/USD', 'buy', 100, shortFuture);
      queue.addRFQ(rfq);
      
      await new Promise(resolve => setTimeout(resolve, 20));
      
      const expired = queue.expireRFQs();
      
      expect(expired).toHaveLength(1);
      expect(expired[0]).toBe(rfq);
      expect(rfq.status).toBe('expired');
    });

    test('should not expire future RFQs', () => {
      const rfq = new RFQ('rfq1', 'BTC/USD', 'buy', 100, futureTime);
      queue.addRFQ(rfq);
      
      const expired = queue.expireRFQs();
      
      expect(expired).toHaveLength(0);
      expect(rfq.status).toBe('open');
    });

    test('should not change status of filled RFQs', async () => {
      const shortFuture = Date.now() + 10;
      const rfq = new RFQ('rfq1', 'BTC/USD', 'buy', 100, shortFuture);
      queue.addRFQ(rfq);
      
      const quote = new Quote('quote1', 'rfq1', 'maker1', 50000);
      queue.addQuote(quote);
      queue.selectQuote('rfq1', 'quote1');
      
      await new Promise(resolve => setTimeout(resolve, 20));
      
      const expired = queue.expireRFQs();
      
      expect(expired).toHaveLength(0);
      expect(rfq.status).toBe('filled');
    });
  });

  describe('getStats', () => {
    test('should return stats with no data', () => {
      const stats = queue.getStats();
      
      expect(stats).toEqual({
        totalRFQs: 0,
        totalQuotes: 0,
        rfqsByStatus: {
          open: 0,
          filled: 0,
          expired: 0,
          cancelled: 0
        }
      });
    });

    test('should return correct stats', () => {
      const rfq1 = new RFQ('rfq1', 'BTC/USD', 'buy', 100, futureTime);
      const rfq2 = new RFQ('rfq2', 'ETH/USD', 'sell', 50, futureTime);
      queue.addRFQ(rfq1);
      queue.addRFQ(rfq2);
      
      const quote1 = new Quote('quote1', 'rfq1', 'maker1', 50000);
      const quote2 = new Quote('quote2', 'rfq1', 'maker2', 51000);
      queue.addQuote(quote1);
      queue.addQuote(quote2);
      
      queue.selectQuote('rfq1', 'quote1');
      
      const stats = queue.getStats();
      
      expect(stats.totalRFQs).toBe(2);
      expect(stats.totalQuotes).toBe(2);
      expect(stats.rfqsByStatus.open).toBe(1);
      expect(stats.rfqsByStatus.filled).toBe(1);
    });
  });

  describe('clear', () => {
    test('should clear all data', () => {
      const rfq = new RFQ('rfq1', 'BTC/USD', 'buy', 100, futureTime);
      queue.addRFQ(rfq);
      
      const quote = new Quote('quote1', 'rfq1', 'maker1', 50000);
      queue.addQuote(quote);
      
      queue.clear();
      
      expect(queue.getAllRFQs()).toHaveLength(0);
      expect(queue.getRFQ('rfq1')).toBeNull();
      expect(queue.getQuote('quote1')).toBeNull();
    });
  });
});
