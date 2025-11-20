const RFQManager = require('../src/managers/RFQManager');

describe('RFQManager', () => {
  let manager;

  beforeEach(() => {
    manager = new RFQManager();
  });

  describe('createRFQ', () => {
    it('should create a valid RFQ', () => {
      const expiration = Date.now() + 3600000; // 1 hour from now
      const rfq = manager.createRFQ('rfq1', 'ETH/USD', 'buy', 100, expiration);

      expect(rfq).toBeDefined();
      expect(rfq.rfqId).toBe('rfq1');
      expect(rfq.market).toBe('ETH/USD');
      expect(rfq.direction).toBe('buy');
      expect(rfq.amount).toBe(100);
      expect(rfq.status).toBe('open');
    });

    it('should throw error for duplicate RFQ ID', () => {
      const expiration = Date.now() + 3600000;
      manager.createRFQ('rfq1', 'ETH/USD', 'buy', 100, expiration);

      expect(() => {
        manager.createRFQ('rfq1', 'BTC/USD', 'sell', 50, expiration);
      }).toThrow('RFQ with ID "rfq1" already exists');
    });

    it('should throw error for invalid RFQ ID', () => {
      const expiration = Date.now() + 3600000;
      expect(() => {
        manager.createRFQ('', 'ETH/USD', 'buy', 100, expiration);
      }).toThrow('RFQ ID must be a non-empty string');
    });

    it('should throw error for invalid market', () => {
      const expiration = Date.now() + 3600000;
      expect(() => {
        manager.createRFQ('rfq1', '', 'buy', 100, expiration);
      }).toThrow('Market must be a non-empty string');
    });

    it('should throw error for invalid direction', () => {
      const expiration = Date.now() + 3600000;
      expect(() => {
        manager.createRFQ('rfq1', 'ETH/USD', 'invalid', 100, expiration);
      }).toThrow('Direction must be either "buy" or "sell"');
    });

    it('should throw error for invalid amount', () => {
      const expiration = Date.now() + 3600000;
      expect(() => {
        manager.createRFQ('rfq1', 'ETH/USD', 'buy', -100, expiration);
      }).toThrow('Amount must be a positive number');

      expect(() => {
        manager.createRFQ('rfq1', 'ETH/USD', 'buy', 0, expiration);
      }).toThrow('Amount must be a positive number');
    });

    it('should throw error for past expiration', () => {
      const pastExpiration = Date.now() - 1000;
      expect(() => {
        manager.createRFQ('rfq1', 'ETH/USD', 'buy', 100, pastExpiration);
      }).toThrow('Expiration must be a future timestamp');
    });
  });

  describe('getRFQ', () => {
    it('should return RFQ if it exists', () => {
      const expiration = Date.now() + 3600000;
      manager.createRFQ('rfq1', 'ETH/USD', 'buy', 100, expiration);

      const rfq = manager.getRFQ('rfq1');
      expect(rfq).toBeDefined();
      expect(rfq.rfqId).toBe('rfq1');
    });

    it('should return null if RFQ does not exist', () => {
      const rfq = manager.getRFQ('nonexistent');
      expect(rfq).toBeNull();
    });
  });

  describe('getAllRFQs', () => {
    beforeEach(() => {
      const expiration = Date.now() + 3600000;
      manager.createRFQ('rfq1', 'ETH/USD', 'buy', 100, expiration);
      manager.createRFQ('rfq2', 'ETH/USD', 'sell', 50, expiration);
      manager.createRFQ('rfq3', 'BTC/USD', 'buy', 200, expiration);
    });

    it('should return all RFQs when no filters applied', () => {
      const rfqs = manager.getAllRFQs();
      expect(rfqs.length).toBe(3);
    });

    it('should filter by market', () => {
      const rfqs = manager.getAllRFQs({ market: 'ETH/USD' });
      expect(rfqs.length).toBe(2);
      expect(rfqs.every(rfq => rfq.market === 'ETH/USD')).toBe(true);
    });

    it('should filter by direction', () => {
      const rfqs = manager.getAllRFQs({ direction: 'buy' });
      expect(rfqs.length).toBe(2);
      expect(rfqs.every(rfq => rfq.direction === 'buy')).toBe(true);
    });

    it('should filter by status', () => {
      const rfqs = manager.getAllRFQs({ status: 'open' });
      expect(rfqs.length).toBe(3);
    });

    it('should apply multiple filters', () => {
      const rfqs = manager.getAllRFQs({ market: 'ETH/USD', direction: 'buy' });
      expect(rfqs.length).toBe(1);
      expect(rfqs[0].rfqId).toBe('rfq1');
    });
  });

  describe('cancelRFQ', () => {
    it('should cancel an open RFQ', () => {
      const expiration = Date.now() + 3600000;
      manager.createRFQ('rfq1', 'ETH/USD', 'buy', 100, expiration);

      const cancelledRFQ = manager.cancelRFQ('rfq1');
      expect(cancelledRFQ.status).toBe('cancelled');
    });

    it('should throw error if RFQ not found', () => {
      expect(() => {
        manager.cancelRFQ('nonexistent');
      }).toThrow('RFQ with ID "nonexistent" not found');
    });

    it('should throw error if RFQ cannot be cancelled', () => {
      const expiration = Date.now() + 3600000;
      const rfq = manager.createRFQ('rfq1', 'ETH/USD', 'buy', 100, expiration);
      rfq.markFilled();

      expect(() => {
        manager.cancelRFQ('rfq1');
      }).toThrow('Cannot cancel RFQ with status "filled"');
    });
  });

  describe('checkExpirations', () => {
    it('should mark expired RFQs as expired', () => {
      const pastExpiration = Date.now() - 1000;
      const futureExpiration = Date.now() + 3600000;

      // Create RFQ with past expiration (manually set)
      const rfq1 = manager.createRFQ('rfq1', 'ETH/USD', 'buy', 100, futureExpiration);
      rfq1.expiration = pastExpiration; // Force expiration

      const rfq2 = manager.createRFQ('rfq2', 'BTC/USD', 'sell', 50, futureExpiration);

      const expiredRFQs = manager.checkExpirations();
      expect(expiredRFQs.length).toBe(1);
      expect(expiredRFQs[0].rfqId).toBe('rfq1');
      expect(expiredRFQs[0].status).toBe('expired');
      expect(rfq2.status).toBe('open');
    });

    it('should not expire already filled RFQs', () => {
      const pastExpiration = Date.now() - 1000;
      const rfq = manager.createRFQ('rfq1', 'ETH/USD', 'buy', 100, Date.now() + 3600000);
      rfq.markFilled();
      rfq.expiration = pastExpiration;

      const expiredRFQs = manager.checkExpirations();
      expect(expiredRFQs.length).toBe(0);
    });
  });

  describe('hasRFQ', () => {
    it('should return true if RFQ exists', () => {
      const expiration = Date.now() + 3600000;
      manager.createRFQ('rfq1', 'ETH/USD', 'buy', 100, expiration);
      expect(manager.hasRFQ('rfq1')).toBe(true);
    });

    it('should return false if RFQ does not exist', () => {
      expect(manager.hasRFQ('nonexistent')).toBe(false);
    });
  });

  describe('getCount', () => {
    it('should return correct count', () => {
      expect(manager.getCount()).toBe(0);
      
      const expiration = Date.now() + 3600000;
      manager.createRFQ('rfq1', 'ETH/USD', 'buy', 100, expiration);
      expect(manager.getCount()).toBe(1);
      
      manager.createRFQ('rfq2', 'BTC/USD', 'sell', 50, expiration);
      expect(manager.getCount()).toBe(2);
    });
  });
});
