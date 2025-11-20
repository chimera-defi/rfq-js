import { RFQManager } from '../RFQManager';

describe('RFQManager', () => {
  let manager: RFQManager;

  beforeEach(() => {
    manager = new RFQManager();
  });

  // Note: generateId is now private, tested indirectly through createRFQ and submitQuote

  describe('createRFQ', () => {
    test('should create and add an RFQ', () => {
      const rfq = manager.createRFQ('BTC/USD', 'buy', 100, 60000);
      
      expect(rfq).toBeDefined();
      expect(rfq.market).toBe('BTC/USD');
      expect(rfq.direction).toBe('buy');
      expect(rfq.amount).toBe(100);
      expect(rfq.status).toBe('open');
      expect(rfq.id).toContain('rfq_');
    });

    test('should create RFQ with correct expiration', () => {
      const beforeCreate = Date.now();
      const rfq = manager.createRFQ('BTC/USD', 'buy', 100, 60000);
      const afterCreate = Date.now();
      
      expect(rfq.expiration).toBeGreaterThanOrEqual(beforeCreate + 60000);
      expect(rfq.expiration).toBeLessThanOrEqual(afterCreate + 60000);
    });

    test('should validate RFQ parameters', () => {
      expect(() => manager.createRFQ('', 'buy', 100, 60000))
        .toThrow('Market must be a non-empty string');
      
      expect(() => manager.createRFQ('BTC/USD', 'hold' as any, 100, 60000))
        .toThrow('Direction must be either "buy" or "sell"');
      
      expect(() => manager.createRFQ('BTC/USD', 'buy', -10, 60000))
        .toThrow('Amount must be a positive finite number');
    });

    test('should retrieve created RFQ', () => {
      const rfq = manager.createRFQ('BTC/USD', 'buy', 100, 60000);
      const details = manager.getRFQDetails(rfq.id);
      
      expect(details).toBeDefined();
      expect(details!.rfq.id).toBe(rfq.id);
    });
  });

  describe('submitQuote', () => {
    test('should submit a quote for an RFQ', () => {
      const rfq = manager.createRFQ('BTC/USD', 'buy', 100, 60000);
      const quote = manager.submitQuote(rfq.id, 'maker1', 50000);
      
      expect(quote).toBeDefined();
      expect(quote.rfqId).toBe(rfq.id);
      expect(quote.makerId).toBe('maker1');
      expect(quote.pricePerToken).toBe(50000);
      expect(quote.id).toContain('quote_');
    });

    test('should allow multiple quotes for same RFQ', () => {
      const rfq = manager.createRFQ('BTC/USD', 'buy', 100, 60000);
      const quote1 = manager.submitQuote(rfq.id, 'maker1', 50000);
      const quote2 = manager.submitQuote(rfq.id, 'maker2', 49500);
      
      expect(quote1.id).not.toBe(quote2.id);
      
      const details = manager.getRFQDetails(rfq.id);
      expect(details!.quotes).toHaveLength(2);
    });

    test('should throw error for non-existent RFQ', () => {
      expect(() => manager.submitQuote('nonexistent', 'maker1', 50000))
        .toThrow('RFQ with id nonexistent not found');
    });

    test('should throw error for filled RFQ', () => {
      const rfq = manager.createRFQ('BTC/USD', 'buy', 100, 60000);
      const quote = manager.submitQuote(rfq.id, 'maker1', 50000);
      manager.acceptQuote(rfq.id, quote.id);
      
      expect(() => manager.submitQuote(rfq.id, 'maker2', 49500))
        .toThrow('Cannot add quote to RFQ with status: filled');
    });

    test('should validate quote parameters', () => {
      const rfq = manager.createRFQ('BTC/USD', 'buy', 100, 60000);
      
      expect(() => manager.submitQuote(rfq.id, '', 50000))
        .toThrow('Maker id must be a non-empty string');
      
      expect(() => manager.submitQuote(rfq.id, 'maker1', 0))
        .toThrow('Price per token must be a positive finite number');
    });
  });

  describe('acceptQuote', () => {
    test('should accept a quote and fill the RFQ', () => {
      const rfq = manager.createRFQ('BTC/USD', 'buy', 100, 60000);
      const quote = manager.submitQuote(rfq.id, 'maker1', 50000);
      
      const result = manager.acceptQuote(rfq.id, quote.id);
      
      expect(result.rfq.status).toBe('filled');
      expect(result.rfq.selectedQuoteId).toBe(quote.id);
      expect(result.quote.id).toBe(quote.id);
    });

    test('should throw error for non-existent RFQ', () => {
      expect(() => manager.acceptQuote('nonexistent', 'quote1'))
        .toThrow('RFQ with id nonexistent not found');
    });

    test('should throw error for non-existent quote', () => {
      const rfq = manager.createRFQ('BTC/USD', 'buy', 100, 60000);
      
      expect(() => manager.acceptQuote(rfq.id, 'nonexistent'))
        .toThrow('Quote with id nonexistent not found');
    });

    test('should throw error when quote does not belong to RFQ', () => {
      const rfq1 = manager.createRFQ('BTC/USD', 'buy', 100, 60000);
      const rfq2 = manager.createRFQ('ETH/USD', 'sell', 50, 60000);
      const quote = manager.submitQuote(rfq2.id, 'maker1', 3000);
      
      expect(() => manager.acceptQuote(rfq1.id, quote.id))
        .toThrow(`Quote ${quote.id} does not belong to RFQ ${rfq1.id}`);
    });

    test('should not allow accepting second quote', () => {
      const rfq = manager.createRFQ('BTC/USD', 'buy', 100, 60000);
      const quote1 = manager.submitQuote(rfq.id, 'maker1', 50000);
      const quote2 = manager.submitQuote(rfq.id, 'maker2', 49500);
      
      manager.acceptQuote(rfq.id, quote1.id);
      
      expect(() => manager.acceptQuote(rfq.id, quote2.id))
        .toThrow('Cannot fill RFQ with status: filled');
    });
  });

  describe('getRFQDetails', () => {
    test('should return RFQ with all quotes', () => {
      const rfq = manager.createRFQ('BTC/USD', 'buy', 100, 60000);
      manager.submitQuote(rfq.id, 'maker1', 50000);
      manager.submitQuote(rfq.id, 'maker2', 49500);
      
      const details = manager.getRFQDetails(rfq.id);
      
      expect(details).toBeDefined();
      expect(details!.rfq.id).toBe(rfq.id);
      expect(details!.quotes).toHaveLength(2);
    });

    test('should return null for non-existent RFQ', () => {
      expect(manager.getRFQDetails('nonexistent')).toBeNull();
    });

    test('should return RFQ with no quotes', () => {
      const rfq = manager.createRFQ('BTC/USD', 'buy', 100, 60000);
      const details = manager.getRFQDetails(rfq.id);
      
      expect(details).toBeDefined();
      expect(details!.rfq.id).toBe(rfq.id);
      expect(details!.quotes).toHaveLength(0);
    });
  });

  describe('getAllRFQDetails', () => {
    test('should return empty array when no RFQs', () => {
      expect(manager.getAllRFQDetails()).toEqual([]);
    });

    test('should return all RFQs with their quotes', () => {
      const rfq1 = manager.createRFQ('BTC/USD', 'buy', 100, 60000);
      const rfq2 = manager.createRFQ('ETH/USD', 'sell', 50, 60000);
      
      manager.submitQuote(rfq1.id, 'maker1', 50000);
      manager.submitQuote(rfq1.id, 'maker2', 49500);
      manager.submitQuote(rfq2.id, 'maker3', 3000);
      
      const allDetails = manager.getAllRFQDetails();
      
      expect(allDetails).toHaveLength(2);
      
      const rfq1Details = allDetails.find(d => d.rfq.id === rfq1.id);
      expect(rfq1Details).toBeDefined();
      expect(rfq1Details!.quotes).toHaveLength(2);
      
      const rfq2Details = allDetails.find(d => d.rfq.id === rfq2.id);
      expect(rfq2Details).toBeDefined();
      expect(rfq2Details!.quotes).toHaveLength(1);
    });
  });

  describe('getOpenRFQs', () => {
    test('should return only open RFQs', () => {
      const rfq1 = manager.createRFQ('BTC/USD', 'buy', 100, 60000);
      const rfq2 = manager.createRFQ('ETH/USD', 'sell', 50, 60000);
      
      const quote = manager.submitQuote(rfq1.id, 'maker1', 50000);
      manager.acceptQuote(rfq1.id, quote.id);
      
      const openRFQs = manager.getOpenRFQs();
      
      expect(openRFQs).toHaveLength(1);
      expect(openRFQs[0].rfq.id).toBe(rfq2.id);
    });

    test('should not return expired RFQs', async () => {
      manager.createRFQ('BTC/USD', 'buy', 100, 10);
      
      await new Promise(resolve => setTimeout(resolve, 20));
      
      const openRFQs = manager.getOpenRFQs();
      expect(openRFQs).toHaveLength(0);
    });
  });

  describe('expireOldRFQs', () => {
    test('should expire RFQs past their expiration', async () => {
      const rfq = manager.createRFQ('BTC/USD', 'buy', 100, 10);
      
      await new Promise(resolve => setTimeout(resolve, 20));
      
      const expired = manager.expireOldRFQs();
      
      expect(expired).toHaveLength(1);
      expect(expired[0].id).toBe(rfq.id);
      expect(expired[0].status).toBe('expired');
    });

    test('should not expire future RFQs', () => {
      manager.createRFQ('BTC/USD', 'buy', 100, 60000);
      
      const expired = manager.expireOldRFQs();
      
      expect(expired).toHaveLength(0);
    });
  });

  describe('getStats', () => {
    test('should return correct statistics', () => {
      const rfq1 = manager.createRFQ('BTC/USD', 'buy', 100, 60000);
      const rfq2 = manager.createRFQ('ETH/USD', 'sell', 50, 60000);
      
      manager.submitQuote(rfq1.id, 'maker1', 50000);
      manager.submitQuote(rfq1.id, 'maker2', 49500);
      
      const quote = manager.submitQuote(rfq2.id, 'maker3', 3000);
      manager.acceptQuote(rfq2.id, quote.id);
      
      const stats = manager.getStats();
      
      expect(stats.totalRFQs).toBe(2);
      expect(stats.totalQuotes).toBe(3);
      expect(stats.rfqsByStatus.open).toBe(1);
      expect(stats.rfqsByStatus.filled).toBe(1);
    });
  });

  describe('clear', () => {
    test('should clear all data', () => {
      manager.createRFQ('BTC/USD', 'buy', 100, 60000);
      manager.createRFQ('ETH/USD', 'sell', 50, 60000);
      
      manager.clear();
      
      expect(manager.getAllRFQDetails()).toHaveLength(0);
      expect(manager.getStats().totalRFQs).toBe(0);
    });
  });

  describe('integration - complete workflow', () => {
    test('should handle complete RFQ lifecycle', () => {
      // Taker creates an RFQ
      const rfq = manager.createRFQ('BTC/USD', 'buy', 100, 60000);
      expect(rfq.status).toBe('open');
      
      // Multiple makers submit quotes
      manager.submitQuote(rfq.id, 'maker1', 50000);
      const quote2 = manager.submitQuote(rfq.id, 'maker2', 49800);
      manager.submitQuote(rfq.id, 'maker3', 50200);
      
      // Verify all quotes are stored
      const details = manager.getRFQDetails(rfq.id);
      expect(details!.quotes).toHaveLength(3);
      
      // Taker selects the best quote (lowest price for buy)
      const result = manager.acceptQuote(rfq.id, quote2.id);
      
      // Verify RFQ is filled
      expect(result.rfq.status).toBe('filled');
      expect(result.rfq.selectedQuoteId).toBe(quote2.id);
      expect(result.quote.pricePerToken).toBe(49800);
      
      // Verify stats
      const stats = manager.getStats();
      expect(stats.totalRFQs).toBe(1);
      expect(stats.totalQuotes).toBe(3);
      expect(stats.rfqsByStatus.filled).toBe(1);
    });

    test('should handle multiple concurrent RFQs', () => {
      // Create multiple RFQs
      const rfq1 = manager.createRFQ('BTC/USD', 'buy', 100, 60000);
      const rfq2 = manager.createRFQ('ETH/USD', 'sell', 50, 60000);
      const rfq3 = manager.createRFQ('BTC/USD', 'sell', 200, 60000);
      
      // Submit quotes for different RFQs
      manager.submitQuote(rfq1.id, 'maker1', 50000);
      manager.submitQuote(rfq1.id, 'maker2', 49500);
      
      manager.submitQuote(rfq2.id, 'maker1', 3000);
      manager.submitQuote(rfq2.id, 'maker3', 3050);
      
      manager.submitQuote(rfq3.id, 'maker2', 51000);
      
      // Verify each RFQ has correct quotes
      const details1 = manager.getRFQDetails(rfq1.id);
      const details2 = manager.getRFQDetails(rfq2.id);
      const details3 = manager.getRFQDetails(rfq3.id);
      
      expect(details1).toBeDefined();
      expect(details2).toBeDefined();
      expect(details3).toBeDefined();
      expect(details1!.quotes).toHaveLength(2);
      expect(details2!.quotes).toHaveLength(2);
      expect(details3!.quotes).toHaveLength(1);
      
      // Accept quotes for some RFQs
      manager.acceptQuote(rfq1.id, details1!.quotes[0].id);
      manager.acceptQuote(rfq3.id, details3!.quotes[0].id);
      
      // Verify stats
      const stats = manager.getStats();
      expect(stats.totalRFQs).toBe(3);
      expect(stats.totalQuotes).toBe(5);
      expect(stats.rfqsByStatus.open).toBe(1);
      expect(stats.rfqsByStatus.filled).toBe(2);
    });
  });
});
