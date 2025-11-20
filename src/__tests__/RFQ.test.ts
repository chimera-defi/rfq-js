import { RFQ } from '../RFQ';

describe('RFQ', () => {
  const futureTime = Date.now() + 60000; // 1 minute from now
  
  describe('constructor and validation', () => {
    test('should create a valid RFQ', () => {
      const rfq = new RFQ('rfq1', 'BTC/USD', 'buy', 100, futureTime);
      
      expect(rfq.id).toBe('rfq1');
      expect(rfq.market).toBe('BTC/USD');
      expect(rfq.direction).toBe('buy');
      expect(rfq.amount).toBe(100);
      expect(rfq.expiration).toBe(futureTime);
      expect(rfq.status).toBe('open');
      expect(rfq.selectedQuoteId).toBeNull();
      expect(rfq.createdAt).toBeLessThanOrEqual(Date.now());
    });

    test('should throw error for invalid id', () => {
      expect(() => new RFQ('', 'BTC/USD', 'buy', 100, futureTime))
        .toThrow('RFQ id must be a non-empty string');
      expect(() => new RFQ(null as any, 'BTC/USD', 'buy', 100, futureTime))
        .toThrow('RFQ id must be a non-empty string');
    });

    test('should throw error for invalid market', () => {
      expect(() => new RFQ('rfq1', '', 'buy', 100, futureTime))
        .toThrow('Market must be a non-empty string');
      expect(() => new RFQ('rfq1', null as any, 'buy', 100, futureTime))
        .toThrow('Market must be a non-empty string');
    });

    test('should throw error for invalid direction', () => {
      expect(() => new RFQ('rfq1', 'BTC/USD', 'hold' as any, 100, futureTime))
        .toThrow('Direction must be either "buy" or "sell"');
      expect(() => new RFQ('rfq1', 'BTC/USD', 'BUY' as any, 100, futureTime))
        .toThrow('Direction must be either "buy" or "sell"');
    });

    test('should throw error for invalid amount', () => {
      expect(() => new RFQ('rfq1', 'BTC/USD', 'buy', 0, futureTime))
        .toThrow('Amount must be a positive finite number');
      expect(() => new RFQ('rfq1', 'BTC/USD', 'buy', -10, futureTime))
        .toThrow('Amount must be a positive finite number');
      expect(() => new RFQ('rfq1', 'BTC/USD', 'buy', '100' as any, futureTime))
        .toThrow('Amount must be a positive finite number');
    });

    test('should throw error for past expiration', () => {
      const pastTime = Date.now() - 1000;
      expect(() => new RFQ('rfq1', 'BTC/USD', 'buy', 100, pastTime))
        .toThrow('Expiration must be a future timestamp');
    });

    test('should accept both buy and sell directions', () => {
      const buyRfq = new RFQ('rfq1', 'BTC/USD', 'buy', 100, futureTime);
      expect(buyRfq.direction).toBe('buy');
      
      const sellRfq = new RFQ('rfq2', 'BTC/USD', 'sell', 100, futureTime);
      expect(sellRfq.direction).toBe('sell');
    });

    test('should throw error for Infinity amount', () => {
      expect(() => new RFQ('rfq1', 'BTC/USD', 'buy', Infinity, futureTime))
        .toThrow('Amount must be a positive finite number');
    });

    test('should throw error for NaN amount', () => {
      expect(() => new RFQ('rfq1', 'BTC/USD', 'buy', NaN, futureTime))
        .toThrow('Amount must be a positive finite number');
    });

    test('should throw error for whitespace-only market', () => {
      expect(() => new RFQ('rfq1', '   ', 'buy', 100, futureTime))
        .toThrow('Market must be a non-empty string');
      expect(() => new RFQ('rfq1', '\t\n', 'buy', 100, futureTime))
        .toThrow('Market must be a non-empty string');
    });

    test('should throw error for Infinity expiration', () => {
      expect(() => new RFQ('rfq1', 'BTC/USD', 'buy', 100, Infinity))
        .toThrow('Expiration must be a future timestamp');
    });

    test('should accept decimal amounts', () => {
      const rfq = new RFQ('rfq1', 'BTC/USD', 'buy', 0.0001, futureTime);
      expect(rfq.amount).toBe(0.0001);
    });

    test('should accept very small positive amounts', () => {
      const rfq = new RFQ('rfq1', 'BTC/USD', 'buy', 0.00000001, futureTime);
      expect(rfq.amount).toBe(0.00000001);
    });
  });

  describe('isExpired', () => {
    test('should return false for non-expired RFQ', () => {
      const rfq = new RFQ('rfq1', 'BTC/USD', 'buy', 100, futureTime);
      expect(rfq.isExpired()).toBe(false);
    });

    test('should return true for expired RFQ', async () => {
      const shortFuture = Date.now() + 10; // 10ms from now
      const rfq = new RFQ('rfq1', 'BTC/USD', 'buy', 100, shortFuture);
      
      await new Promise(resolve => setTimeout(resolve, 20));
      expect(rfq.isExpired()).toBe(true);
    });
  });

  describe('isOpen', () => {
    test('should return true for open and non-expired RFQ', () => {
      const rfq = new RFQ('rfq1', 'BTC/USD', 'buy', 100, futureTime);
      expect(rfq.isOpen()).toBe(true);
    });

    test('should return false for filled RFQ', () => {
      const rfq = new RFQ('rfq1', 'BTC/USD', 'buy', 100, futureTime);
      rfq.fill('quote1');
      expect(rfq.isOpen()).toBe(false);
    });

    test('should return false for expired RFQ', async () => {
      const shortFuture = Date.now() + 10;
      const rfq = new RFQ('rfq1', 'BTC/USD', 'buy', 100, shortFuture);
      
      await new Promise(resolve => setTimeout(resolve, 20));
      expect(rfq.isOpen()).toBe(false);
    });
  });

  describe('fill', () => {
    test('should fill an open RFQ', () => {
      const rfq = new RFQ('rfq1', 'BTC/USD', 'buy', 100, futureTime);
      rfq.fill('quote1');
      
      expect(rfq.status).toBe('filled');
      expect(rfq.selectedQuoteId).toBe('quote1');
    });

    test('should throw error when filling already filled RFQ', () => {
      const rfq = new RFQ('rfq1', 'BTC/USD', 'buy', 100, futureTime);
      rfq.fill('quote1');
      
      expect(() => rfq.fill('quote2'))
        .toThrow('Cannot fill RFQ with status: filled');
    });

    test('should throw error when filling expired RFQ', async () => {
      const shortFuture = Date.now() + 10;
      const rfq = new RFQ('rfq1', 'BTC/USD', 'buy', 100, shortFuture);
      
      await new Promise(resolve => setTimeout(resolve, 20));
      expect(() => rfq.fill('quote1'))
        .toThrow('Cannot fill an expired RFQ');
    });
  });

  describe('expire', () => {
    test('should expire an open RFQ', () => {
      const rfq = new RFQ('rfq1', 'BTC/USD', 'buy', 100, futureTime);
      rfq.expire();
      
      expect(rfq.status).toBe('expired');
    });

    test('should not change status of already filled RFQ', () => {
      const rfq = new RFQ('rfq1', 'BTC/USD', 'buy', 100, futureTime);
      rfq.fill('quote1');
      rfq.expire();
      
      expect(rfq.status).toBe('filled');
    });
  });

  describe('cancel', () => {
    test('should cancel an open RFQ', () => {
      const rfq = new RFQ('rfq1', 'BTC/USD', 'buy', 100, futureTime);
      rfq.cancel();
      
      expect(rfq.status).toBe('cancelled');
    });

    test('should throw error when cancelling filled RFQ', () => {
      const rfq = new RFQ('rfq1', 'BTC/USD', 'buy', 100, futureTime);
      rfq.fill('quote1');
      
      expect(() => rfq.cancel())
        .toThrow('Cannot cancel RFQ with status: filled');
    });
  });

  describe('toJSON', () => {
    test('should return plain object representation', () => {
      const rfq = new RFQ('rfq1', 'BTC/USD', 'buy', 100, futureTime);
      const json = rfq.toJSON();
      
      expect(json).toEqual({
        id: 'rfq1',
        market: 'BTC/USD',
        direction: 'buy',
        amount: 100,
        expiration: futureTime,
        status: 'open',
        createdAt: expect.any(Number),
        selectedQuoteId: null
      });
    });
  });
});
