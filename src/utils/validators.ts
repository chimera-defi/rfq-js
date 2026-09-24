/**
 * Validation utilities for RFQ system
 */

import { RFQDirection } from '../models/RFQ';

/**
 * Validate RFQ creation parameters
 * @param rfqId - Unique RFQ identifier
 * @param market - Market/token pair
 * @param direction - 'buy' or 'sell'
 * @param amount - Amount of tokens
 * @param expiration - Expiration timestamp
 * @throws {Error} If validation fails
 */
export function validateRFQ(
  rfqId: string,
  market: string,
  direction: string,
  amount: number,
  expiration: number
): asserts direction is RFQDirection {
  if (!rfqId || typeof rfqId !== 'string' || rfqId.trim().length === 0) {
    throw new Error('RFQ ID must be a non-empty string');
  }

  if (!market || typeof market !== 'string' || market.trim().length === 0) {
    throw new Error('Market must be a non-empty string');
  }

  if (direction !== 'buy' && direction !== 'sell') {
    throw new Error('Direction must be either "buy" or "sell"');
  }

  if (typeof amount !== 'number' || amount <= 0 || !Number.isFinite(amount)) {
    throw new Error('Amount must be a positive finite number');
  }

  if (typeof expiration !== 'number' || !Number.isFinite(expiration) || expiration <= Date.now()) {
    throw new Error('Expiration must be a future timestamp');
  }
}

/**
 * Validate quote creation parameters
 * @param quoteId - Unique quote identifier
 * @param rfqId - RFQ identifier
 * @param pricePerToken - Price per token
 * @throws {Error} If validation fails
 */
export function validateQuote(
  quoteId: string,
  rfqId: string,
  pricePerToken: number
): void {
  if (!quoteId || typeof quoteId !== 'string' || quoteId.trim().length === 0) {
    throw new Error('Quote ID must be a non-empty string');
  }

  if (!rfqId || typeof rfqId !== 'string' || rfqId.trim().length === 0) {
    throw new Error('RFQ ID must be a non-empty string');
  }

  if (typeof pricePerToken !== 'number' || pricePerToken <= 0 || !Number.isFinite(pricePerToken)) {
    throw new Error('Price per token must be a positive finite number');
  }
}
