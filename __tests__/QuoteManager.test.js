const { QuoteManager } = require('../src/managers/QuoteManager');

describe('QuoteManager', () => {
  let manager;

  beforeEach(() => {
    manager = new QuoteManager();
  });

  describe('addQuote', () => {
    it('should create a valid quote', () => {
      const quote = manager.addQuote('quote1', 'rfq1', 100.5, 'maker1');

      expect(quote).toBeDefined();
      expect(quote.quoteId).toBe('quote1');
      expect(quote.rfqId).toBe('rfq1');
      expect(quote.pricePerToken).toBe(100.5);
      expect(quote.makerId).toBe('maker1');
      expect(quote.status).toBe('pending');
    });

    it('should create quote without makerId', () => {
      const quote = manager.addQuote('quote1', 'rfq1', 100.5);
      expect(quote.makerId).toBeNull();
    });

    it('should throw error for duplicate quote ID', () => {
      manager.addQuote('quote1', 'rfq1', 100.5);
      expect(() => {
        manager.addQuote('quote1', 'rfq2', 200.5);
      }).toThrow('Quote with ID "quote1" already exists');
    });

    it('should throw error for invalid quote ID', () => {
      expect(() => {
        manager.addQuote('', 'rfq1', 100.5);
      }).toThrow('Quote ID must be a non-empty string');
    });

    it('should throw error for invalid RFQ ID', () => {
      expect(() => {
        manager.addQuote('quote1', '', 100.5);
      }).toThrow('RFQ ID must be a non-empty string');
    });

    it('should throw error for invalid price', () => {
      expect(() => {
        manager.addQuote('quote1', 'rfq1', -100.5);
      }).toThrow('Price per token must be a positive finite number');

      expect(() => {
        manager.addQuote('quote1', 'rfq1', 0);
      }).toThrow('Price per token must be a positive finite number');
    });
  });

  describe('getQuote', () => {
    it('should return quote if it exists', () => {
      manager.addQuote('quote1', 'rfq1', 100.5);
      const quote = manager.getQuote('quote1');
      expect(quote).toBeDefined();
      expect(quote.quoteId).toBe('quote1');
    });

    it('should return null if quote does not exist', () => {
      const quote = manager.getQuote('nonexistent');
      expect(quote).toBeNull();
    });
  });

  describe('getQuotesForRFQ', () => {
    it('should return empty array if no quotes exist for RFQ', () => {
      const quotes = manager.getQuotesForRFQ('rfq1');
      expect(quotes).toEqual([]);
    });

    it('should return all quotes for an RFQ', () => {
      manager.addQuote('quote1', 'rfq1', 100.5);
      manager.addQuote('quote2', 'rfq1', 101.0);
      manager.addQuote('quote3', 'rfq2', 200.0);

      const quotes = manager.getQuotesForRFQ('rfq1');
      expect(quotes.length).toBe(2);
      expect(quotes.map(q => q.quoteId).sort()).toEqual(['quote1', 'quote2']);
    });
  });

  describe('getPendingQuotesForRFQ', () => {
    it('should return only pending quotes', () => {
      manager.addQuote('quote1', 'rfq1', 100.5);
      manager.addQuote('quote2', 'rfq1', 101.0);
      manager.addQuote('quote3', 'rfq1', 102.0);

      // Accept one quote
      manager.acceptQuote('quote2');

      const pendingQuotes = manager.getPendingQuotesForRFQ('rfq1');
      expect(pendingQuotes.length).toBe(0); // All should be rejected or accepted
    });
  });

  describe('acceptQuote', () => {
    it('should accept a quote', () => {
      manager.addQuote('quote1', 'rfq1', 100.5);
      const acceptedQuote = manager.acceptQuote('quote1');
      expect(acceptedQuote.status).toBe('accepted');
    });

    it('should reject other pending quotes for the same RFQ when accepting one', () => {
      manager.addQuote('quote1', 'rfq1', 100.5);
      manager.addQuote('quote2', 'rfq1', 101.0);
      manager.addQuote('quote3', 'rfq1', 102.0);
      manager.addQuote('quote4', 'rfq2', 200.0); // Different RFQ

      manager.acceptQuote('quote2');

      expect(manager.getQuote('quote1').status).toBe('rejected');
      expect(manager.getQuote('quote2').status).toBe('accepted');
      expect(manager.getQuote('quote3').status).toBe('rejected');
      expect(manager.getQuote('quote4').status).toBe('pending'); // Different RFQ, still pending
    });

    it('should throw error if quote not found', () => {
      expect(() => {
        manager.acceptQuote('nonexistent');
      }).toThrow('Quote with ID "nonexistent" not found');
    });

    it('should throw error if quote already processed', () => {
      manager.addQuote('quote1', 'rfq1', 100.5);
      manager.acceptQuote('quote1');

      expect(() => {
        manager.acceptQuote('quote1');
      }).toThrow('Quote with ID "quote1" is already accepted');
    });
  });

  describe('hasQuote', () => {
    it('should return true if quote exists', () => {
      manager.addQuote('quote1', 'rfq1', 100.5);
      expect(manager.hasQuote('quote1')).toBe(true);
    });

    it('should return false if quote does not exist', () => {
      expect(manager.hasQuote('nonexistent')).toBe(false);
    });
  });

  describe('getCount', () => {
    it('should return correct count', () => {
      expect(manager.getCount()).toBe(0);
      manager.addQuote('quote1', 'rfq1', 100.5);
      expect(manager.getCount()).toBe(1);
      manager.addQuote('quote2', 'rfq1', 101.0);
      expect(manager.getCount()).toBe(2);
    });
  });

  describe('getCountForRFQ', () => {
    it('should return correct count for RFQ', () => {
      expect(manager.getCountForRFQ('rfq1')).toBe(0);
      manager.addQuote('quote1', 'rfq1', 100.5);
      expect(manager.getCountForRFQ('rfq1')).toBe(1);
      manager.addQuote('quote2', 'rfq1', 101.0);
      expect(manager.getCountForRFQ('rfq1')).toBe(2);
      manager.addQuote('quote3', 'rfq2', 200.0);
      expect(manager.getCountForRFQ('rfq1')).toBe(2);
      expect(manager.getCountForRFQ('rfq2')).toBe(1);
    });
  });
});
