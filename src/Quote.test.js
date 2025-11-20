const Quote = require('./Quote');

describe('Quote', () => {
  describe('constructor and validation', () => {
    test('should create a valid quote', () => {
      const quote = new Quote('quote1', 'rfq1', 'maker1', 50000);
      
      expect(quote.id).toBe('quote1');
      expect(quote.rfqId).toBe('rfq1');
      expect(quote.makerId).toBe('maker1');
      expect(quote.pricePerToken).toBe(50000);
      expect(quote.createdAt).toBeLessThanOrEqual(Date.now());
    });

    test('should throw error for invalid id', () => {
      expect(() => new Quote('', 'rfq1', 'maker1', 50000))
        .toThrow('Quote id must be a non-empty string');
      expect(() => new Quote(null, 'rfq1', 'maker1', 50000))
        .toThrow('Quote id must be a non-empty string');
    });

    test('should throw error for invalid rfqId', () => {
      expect(() => new Quote('quote1', '', 'maker1', 50000))
        .toThrow('RFQ id must be a non-empty string');
      expect(() => new Quote('quote1', null, 'maker1', 50000))
        .toThrow('RFQ id must be a non-empty string');
    });

    test('should throw error for invalid makerId', () => {
      expect(() => new Quote('quote1', 'rfq1', '', 50000))
        .toThrow('Maker id must be a non-empty string');
      expect(() => new Quote('quote1', 'rfq1', null, 50000))
        .toThrow('Maker id must be a non-empty string');
    });

    test('should throw error for invalid pricePerToken', () => {
      expect(() => new Quote('quote1', 'rfq1', 'maker1', 0))
        .toThrow('Price per token must be a positive number');
      expect(() => new Quote('quote1', 'rfq1', 'maker1', -100))
        .toThrow('Price per token must be a positive number');
      expect(() => new Quote('quote1', 'rfq1', 'maker1', '50000'))
        .toThrow('Price per token must be a positive number');
    });

    test('should accept decimal prices', () => {
      const quote = new Quote('quote1', 'rfq1', 'maker1', 50000.5);
      expect(quote.pricePerToken).toBe(50000.5);
    });
  });

  describe('toJSON', () => {
    test('should return plain object representation', () => {
      const quote = new Quote('quote1', 'rfq1', 'maker1', 50000);
      const json = quote.toJSON();
      
      expect(json).toEqual({
        id: 'quote1',
        rfqId: 'rfq1',
        makerId: 'maker1',
        pricePerToken: 50000,
        createdAt: expect.any(Number)
      });
    });
  });
});
