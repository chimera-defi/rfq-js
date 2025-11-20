const { RFQ } = require('../src/models/RFQ');
const { Quote } = require('../src/models/Quote');
const { QueueEntry } = require('../src/models/QueueEntry');

describe('Model Classes', () => {
  describe('RFQ Model', () => {
    it('should create RFQ with all properties', () => {
      const expiration = Date.now() + 3600000;
      const rfq = new RFQ('rfq1', 'ETH/USD', 'buy', 100, expiration);

      expect(rfq.rfqId).toBe('rfq1');
      expect(rfq.market).toBe('ETH/USD');
      expect(rfq.direction).toBe('buy');
      expect(rfq.amount).toBe(100);
      expect(rfq.expiration).toBe(expiration);
      expect(rfq.status).toBe('open');
      expect(rfq.createdAt).toBeDefined();
    });

    it('should check if RFQ is expired', () => {
      const pastExpiration = Date.now() - 1000;
      const futureExpiration = Date.now() + 3600000;

      const expiredRFQ = new RFQ('rfq1', 'ETH/USD', 'buy', 100, pastExpiration);
      expiredRFQ.expiration = pastExpiration;
      expect(expiredRFQ.isExpired()).toBe(true);

      const activeRFQ = new RFQ('rfq2', 'ETH/USD', 'buy', 100, futureExpiration);
      expect(activeRFQ.isExpired()).toBe(false);
    });

    it('should check if RFQ is open', () => {
      const expiration = Date.now() + 3600000;
      const rfq = new RFQ('rfq1', 'ETH/USD', 'buy', 100, expiration);

      expect(rfq.isOpen()).toBe(true);

      rfq.markFilled();
      expect(rfq.isOpen()).toBe(false);

      const expiredRFQ = new RFQ('rfq2', 'ETH/USD', 'buy', 100, expiration);
      expiredRFQ.expiration = Date.now() - 1000;
      expect(expiredRFQ.isOpen()).toBe(false);
    });

    it('should mark RFQ as expired', () => {
      const expiration = Date.now() + 3600000;
      const rfq = new RFQ('rfq1', 'ETH/USD', 'buy', 100, expiration);

      rfq.markExpired();
      expect(rfq.status).toBe('expired');
    });

    it('should mark RFQ as filled', () => {
      const expiration = Date.now() + 3600000;
      const rfq = new RFQ('rfq1', 'ETH/USD', 'buy', 100, expiration);

      rfq.markFilled();
      expect(rfq.status).toBe('filled');
    });

    it('should mark RFQ as cancelled', () => {
      const expiration = Date.now() + 3600000;
      const rfq = new RFQ('rfq1', 'ETH/USD', 'buy', 100, expiration);

      rfq.markCancelled();
      expect(rfq.status).toBe('cancelled');
    });

    it('should not cancel already filled RFQ', () => {
      const expiration = Date.now() + 3600000;
      const rfq = new RFQ('rfq1', 'ETH/USD', 'buy', 100, expiration);
      rfq.markFilled();

      rfq.markCancelled();
      expect(rfq.status).toBe('filled'); // Should remain filled
    });

    it('should convert to JSON', () => {
      const expiration = Date.now() + 3600000;
      const rfq = new RFQ('rfq1', 'ETH/USD', 'buy', 100, expiration);

      const json = rfq.toJSON();
      expect(json).toEqual({
        rfqId: 'rfq1',
        market: 'ETH/USD',
        direction: 'buy',
        amount: 100,
        expiration: expiration,
        createdAt: rfq.createdAt,
        status: 'open'
      });
    });
  });

  describe('Quote Model', () => {
    it('should create Quote with all properties', () => {
      const quote = new Quote('quote1', 'rfq1', 100.5, 'maker1');

      expect(quote.quoteId).toBe('quote1');
      expect(quote.rfqId).toBe('rfq1');
      expect(quote.pricePerToken).toBe(100.5);
      expect(quote.makerId).toBe('maker1');
      expect(quote.status).toBe('pending');
      expect(quote.createdAt).toBeDefined();
    });

    it('should create Quote without makerId', () => {
      const quote = new Quote('quote1', 'rfq1', 100.5);
      expect(quote.makerId).toBeNull();
    });

    it('should mark quote as accepted', () => {
      const quote = new Quote('quote1', 'rfq1', 100.5);
      quote.markAccepted();
      expect(quote.status).toBe('accepted');
    });

    it('should mark quote as rejected', () => {
      const quote = new Quote('quote1', 'rfq1', 100.5);
      quote.markRejected();
      expect(quote.status).toBe('rejected');
    });

    it('should not reject already accepted quote', () => {
      const quote = new Quote('quote1', 'rfq1', 100.5);
      quote.markAccepted();
      quote.markRejected();
      expect(quote.status).toBe('accepted'); // Should remain accepted
    });

    it('should check if quote is pending', () => {
      const quote = new Quote('quote1', 'rfq1', 100.5);
      expect(quote.isPending()).toBe(true);

      quote.markAccepted();
      expect(quote.isPending()).toBe(false);

      const quote2 = new Quote('quote2', 'rfq1', 101.0);
      quote2.markRejected();
      expect(quote2.isPending()).toBe(false);
    });

    it('should convert to JSON', () => {
      const quote = new Quote('quote1', 'rfq1', 100.5, 'maker1');

      const json = quote.toJSON();
      expect(json).toEqual({
        quoteId: 'quote1',
        rfqId: 'rfq1',
        pricePerToken: 100.5,
        makerId: 'maker1',
        createdAt: quote.createdAt,
        status: 'pending'
      });
    });
  });

  describe('QueueEntry Model', () => {
    it('should create QueueEntry with all properties', () => {
      const data = { quoteId: 'quote1', makerId: 'maker1' };
      const entry = new QueueEntry('rfq1', 'quote_added', Date.now(), data);

      expect(entry.rfqId).toBe('rfq1');
      expect(entry.action).toBe('quote_added');
      expect(entry.timestamp).toBeDefined();
      expect(entry.data).toEqual(data);
    });

    it('should create QueueEntry with default timestamp', () => {
      const entry = new QueueEntry('rfq1', 'rfq_created');
      expect(entry.timestamp).toBeDefined();
      expect(typeof entry.timestamp).toBe('number');
    });

    it('should create QueueEntry with default data', () => {
      const entry = new QueueEntry('rfq1', 'rfq_created');
      expect(entry.data).toEqual({});
    });

    it('should convert to JSON', () => {
      const data = { quoteId: 'quote1' };
      const timestamp = Date.now();
      const entry = new QueueEntry('rfq1', 'quote_added', timestamp, data);

      const json = entry.toJSON();
      expect(json).toEqual({
        rfqId: 'rfq1',
        action: 'quote_added',
        timestamp: timestamp,
        data: data
      });
    });
  });
});
