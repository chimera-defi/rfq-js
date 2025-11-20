const { RFQSystem } = require('../src/RFQSystem');

describe('Two-Step Workflow Options', () => {
  let system;

  beforeEach(() => {
    system = new RFQSystem();
  });

  describe('createRFQWithQuote', () => {
    it('should create RFQ and add quote in one step', () => {
      const expiration = Date.now() + 3600000;
      const result = system.createRFQWithQuote(
        'rfq1',
        'ETH/USD',
        'buy',
        100,
        expiration,
        'quote1',
        2500.50,
        'maker1'
      );

      expect(result.rfq).toBeDefined();
      expect(result.rfq.rfqId).toBe('rfq1');
      expect(result.quote).toBeDefined();
      expect(result.quote.quoteId).toBe('quote1');
      expect(result.quote.rfqId).toBe('rfq1');
      expect(result.quote.pricePerToken).toBe(2500.50);
    });

    it('should allow adding more quotes after createRFQWithQuote', () => {
      const expiration = Date.now() + 3600000;
      system.createRFQWithQuote('rfq1', 'ETH/USD', 'buy', 100, expiration, 'quote1', 2500.50);
      
      system.addQuote('quote2', 'rfq1', 2501.00);
      
      const quotes = system.getQuotesForRFQ('rfq1');
      expect(quotes.length).toBe(2);
    });

    it('should track queue entries correctly', () => {
      const expiration = Date.now() + 3600000;
      system.createRFQWithQuote('rfq1', 'ETH/USD', 'buy', 100, expiration, 'quote1', 2500.50);
      
      const entries = system.getQueueEntries({ rfqId: 'rfq1' });
      expect(entries.length).toBe(2); // rfq_created + quote_added
      expect(entries.some(e => e.action === 'rfq_created')).toBe(true);
      expect(entries.some(e => e.action === 'quote_added')).toBe(true);
    });
  });

  describe('createAndAcceptQuote', () => {
    it('should create RFQ, add quote, and accept it in one step', () => {
      const expiration = Date.now() + 3600000;
      const result = system.createAndAcceptQuote(
        'rfq1',
        'ETH/USD',
        'buy',
        100,
        expiration,
        'quote1',
        2500.50,
        'maker1'
      );

      expect(result.rfq).toBeDefined();
      expect(result.rfq.rfqId).toBe('rfq1');
      expect(result.rfq.status).toBe('filled');
      expect(result.quote).toBeDefined();
      expect(result.quote.quoteId).toBe('quote1');
      expect(result.quote.status).toBe('accepted');
    });

    it('should track all queue entries correctly', () => {
      const expiration = Date.now() + 3600000;
      system.createAndAcceptQuote('rfq1', 'ETH/USD', 'buy', 100, expiration, 'quote1', 2500.50);
      
      const entries = system.getQueueEntries({ rfqId: 'rfq1' });
      expect(entries.length).toBe(3); // rfq_created + quote_added + quote_accepted
      expect(entries.some(e => e.action === 'rfq_created')).toBe(true);
      expect(entries.some(e => e.action === 'quote_added')).toBe(true);
      expect(entries.some(e => e.action === 'quote_accepted')).toBe(true);
    });

    it('should work with multiple RFQs', () => {
      const expiration = Date.now() + 3600000;
      
      const result1 = system.createAndAcceptQuote('rfq1', 'ETH/USD', 'buy', 100, expiration, 'quote1', 2500.50);
      const result2 = system.createAndAcceptQuote('rfq2', 'BTC/USD', 'sell', 50, expiration, 'quote2', 45000.00);
      
      expect(result1.rfq.status).toBe('filled');
      expect(result2.rfq.status).toBe('filled');
      expect(system.getStats().filledRFQs).toBe(2);
    });
  });

  describe('Workflow Comparison', () => {
    it('3-step workflow should work as before', () => {
      const expiration = Date.now() + 3600000;
      
      // Step 1: Create RFQ
      const rfq = system.createRFQ('rfq1', 'ETH/USD', 'buy', 100, expiration);
      
      // Step 2: Add quotes
      system.addQuote('quote1', 'rfq1', 2500.50);
      system.addQuote('quote2', 'rfq1', 2501.00);
      
      // Step 3: Accept quote
      const result = system.acceptQuote('quote1');
      
      expect(result.rfq.status).toBe('filled');
      expect(result.quote.status).toBe('accepted');
    });

    it('2-step workflow (createRFQWithQuote + acceptQuote) should produce same result', () => {
      const expiration = Date.now() + 3600000;
      
      // Step 1: Create RFQ with quote
      const { rfq, quote } = system.createRFQWithQuote('rfq1', 'ETH/USD', 'buy', 100, expiration, 'quote1', 2500.50);
      
      // Step 2: Accept quote
      const result = system.acceptQuote('quote1');
      
      expect(result.rfq.status).toBe('filled');
      expect(result.quote.status).toBe('accepted');
    });

    it('1-step workflow (createAndAcceptQuote) should produce same result', () => {
      const expiration = Date.now() + 3600000;
      
      // Single step: Create, add quote, and accept
      const result = system.createAndAcceptQuote('rfq1', 'ETH/USD', 'buy', 100, expiration, 'quote1', 2500.50);
      
      expect(result.rfq.status).toBe('filled');
      expect(result.quote.status).toBe('accepted');
    });
  });
});
