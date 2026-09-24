const { validateRFQ, validateQuote } = require('../src/utils/validators');

describe('Validators', () => {
  describe('validateRFQ', () => {
    const validRFQId = 'rfq-001';
    const validMarket = 'ETH/USD';
    const validDirection = 'buy';
    const validAmount = 100;
    const validExpiration = Date.now() + 3600000;

    it('should pass validation for valid RFQ data', () => {
      expect(() => {
        validateRFQ(validRFQId, validMarket, validDirection, validAmount, validExpiration);
      }).not.toThrow();
    });

    it('should throw error for empty RFQ ID', () => {
      expect(() => {
        validateRFQ('', validMarket, validDirection, validAmount, validExpiration);
      }).toThrow('RFQ ID must be a non-empty string');

      expect(() => {
        validateRFQ('   ', validMarket, validDirection, validAmount, validExpiration);
      }).toThrow('RFQ ID must be a non-empty string');
    });

    it('should throw error for non-string RFQ ID', () => {
      expect(() => {
        validateRFQ(null, validMarket, validDirection, validAmount, validExpiration);
      }).toThrow('RFQ ID must be a non-empty string');

      expect(() => {
        validateRFQ(123, validMarket, validDirection, validAmount, validExpiration);
      }).toThrow('RFQ ID must be a non-empty string');
    });

    it('should throw error for empty market', () => {
      expect(() => {
        validateRFQ(validRFQId, '', validDirection, validAmount, validExpiration);
      }).toThrow('Market must be a non-empty string');
    });

    it('should throw error for invalid direction', () => {
      expect(() => {
        validateRFQ(validRFQId, validMarket, 'invalid', validAmount, validExpiration);
      }).toThrow('Direction must be either "buy" or "sell"');

      expect(() => {
        validateRFQ(validRFQId, validMarket, 'BUY', validAmount, validExpiration);
      }).toThrow('Direction must be either "buy" or "sell"');
    });

    it('should accept both buy and sell directions', () => {
      expect(() => {
        validateRFQ(validRFQId, validMarket, 'buy', validAmount, validExpiration);
      }).not.toThrow();

      expect(() => {
        validateRFQ(validRFQId, validMarket, 'sell', validAmount, validExpiration);
      }).not.toThrow();
    });

    it('should throw error for invalid amount', () => {
      expect(() => {
        validateRFQ(validRFQId, validMarket, validDirection, -100, validExpiration);
      }).toThrow('Amount must be a positive finite number');

      expect(() => {
        validateRFQ(validRFQId, validMarket, validDirection, 0, validExpiration);
      }).toThrow('Amount must be a positive finite number');

      expect(() => {
        validateRFQ(validRFQId, validMarket, validDirection, NaN, validExpiration);
      }).toThrow('Amount must be a positive finite number');

      expect(() => {
        validateRFQ(validRFQId, validMarket, validDirection, Infinity, validExpiration);
      }).toThrow('Amount must be a positive finite number');
    });

    it('should throw error for Infinity expiration', () => {
      expect(() => {
        validateRFQ(validRFQId, validMarket, validDirection, validAmount, Infinity);
      }).toThrow('Expiration must be a future timestamp');
    });

    it('should throw error for whitespace-only strings', () => {
      expect(() => {
        validateRFQ('   ', validMarket, validDirection, validAmount, validExpiration);
      }).toThrow('RFQ ID must be a non-empty string');

      expect(() => {
        validateRFQ(validRFQId, '   ', validDirection, validAmount, validExpiration);
      }).toThrow('Market must be a non-empty string');
    });

    it('should accept valid amounts', () => {
      expect(() => {
        validateRFQ(validRFQId, validMarket, validDirection, 0.001, validExpiration);
      }).not.toThrow();

      expect(() => {
        validateRFQ(validRFQId, validMarket, validDirection, 1000000, validExpiration);
      }).not.toThrow();
    });

    it('should throw error for past expiration', () => {
      const pastExpiration = Date.now() - 1000;
      expect(() => {
        validateRFQ(validRFQId, validMarket, validDirection, validAmount, pastExpiration);
      }).toThrow('Expiration must be a future timestamp');
    });

    it('should throw error for current time expiration', () => {
      const currentTime = Date.now();
      expect(() => {
        validateRFQ(validRFQId, validMarket, validDirection, validAmount, currentTime);
      }).toThrow('Expiration must be a future timestamp');
    });

    it('should throw error for invalid expiration type', () => {
      expect(() => {
        validateRFQ(validRFQId, validMarket, validDirection, validAmount, 'invalid');
      }).toThrow('Expiration must be a future timestamp');

      expect(() => {
        validateRFQ(validRFQId, validMarket, validDirection, validAmount, NaN);
      }).toThrow('Expiration must be a future timestamp');
    });
  });

  describe('validateQuote', () => {
    const validQuoteId = 'quote-001';
    const validRFQId = 'rfq-001';
    const validPrice = 100.5;

    it('should pass validation for valid quote data', () => {
      expect(() => {
        validateQuote(validQuoteId, validRFQId, validPrice);
      }).not.toThrow();
    });

    it('should throw error for empty quote ID', () => {
      expect(() => {
        validateQuote('', validRFQId, validPrice);
      }).toThrow('Quote ID must be a non-empty string');
    });

    it('should throw error for non-string quote ID', () => {
      expect(() => {
        validateQuote(null, validRFQId, validPrice);
      }).toThrow('Quote ID must be a non-empty string');
    });

    it('should throw error for empty RFQ ID', () => {
      expect(() => {
        validateQuote(validQuoteId, '', validPrice);
      }).toThrow('RFQ ID must be a non-empty string');
    });

    it('should throw error for invalid price', () => {
      expect(() => {
        validateQuote(validQuoteId, validRFQId, -100);
      }).toThrow('Price per token must be a positive finite number');

      expect(() => {
        validateQuote(validQuoteId, validRFQId, 0);
      }).toThrow('Price per token must be a positive finite number');

      expect(() => {
        validateQuote(validQuoteId, validRFQId, NaN);
      }).toThrow('Price per token must be a positive finite number');

      expect(() => {
        validateQuote(validQuoteId, validRFQId, Infinity);
      }).toThrow('Price per token must be a positive finite number');
    });

    it('should throw error for whitespace-only quote ID', () => {
      expect(() => {
        validateQuote('   ', validRFQId, validPrice);
      }).toThrow('Quote ID must be a non-empty string');

      expect(() => {
        validateQuote(validQuoteId, '   ', validPrice);
      }).toThrow('RFQ ID must be a non-empty string');

      expect(() => {
        validateQuote(validQuoteId, validRFQId, NaN);
      }).toThrow('Price per token must be a positive finite number');

      expect(() => {
        validateQuote(validQuoteId, validRFQId, Infinity);
      }).toThrow('Price per token must be a positive finite number');
    });

    it('should accept valid prices', () => {
      expect(() => {
        validateQuote(validQuoteId, validRFQId, 0.0001);
      }).not.toThrow();

      expect(() => {
        validateQuote(validQuoteId, validRFQId, 999999.99);
      }).not.toThrow();
    });
  });
});
