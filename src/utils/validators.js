/**
 * Validation utilities for RFQ system
 */

/**
 * Validate RFQ creation parameters
 * @param {string} rfqId - Unique RFQ identifier
 * @param {string} market - Market/token pair
 * @param {string} direction - 'buy' or 'sell'
 * @param {number} amount - Amount of tokens
 * @param {number} expiration - Expiration timestamp
 * @throws {Error} If validation fails
 */
function validateRFQ(rfqId, market, direction, amount, expiration) {
  if (!rfqId || typeof rfqId !== 'string' || rfqId.trim() === '') {
    throw new Error('RFQ ID must be a non-empty string');
  }

  if (!market || typeof market !== 'string' || market.trim() === '') {
    throw new Error('Market must be a non-empty string');
  }

  if (direction !== 'buy' && direction !== 'sell') {
    throw new Error('Direction must be either "buy" or "sell"');
  }

  if (typeof amount !== 'number' || amount <= 0 || !isFinite(amount)) {
    throw new Error('Amount must be a positive number');
  }

  if (typeof expiration !== 'number' || expiration <= Date.now() || !isFinite(expiration)) {
    throw new Error('Expiration must be a future timestamp');
  }
}

/**
 * Validate quote creation parameters
 * @param {string} quoteId - Unique quote identifier
 * @param {string} rfqId - RFQ identifier
 * @param {number} pricePerToken - Price per token
 * @throws {Error} If validation fails
 */
function validateQuote(quoteId, rfqId, pricePerToken) {
  if (!quoteId || typeof quoteId !== 'string' || quoteId.trim() === '') {
    throw new Error('Quote ID must be a non-empty string');
  }

  if (!rfqId || typeof rfqId !== 'string' || rfqId.trim() === '') {
    throw new Error('RFQ ID must be a non-empty string');
  }

  if (typeof pricePerToken !== 'number' || pricePerToken <= 0 || !isFinite(pricePerToken)) {
    throw new Error('Price per token must be a positive number');
  }
}

module.exports = {
  validateRFQ,
  validateQuote
};
