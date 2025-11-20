import { IQuote, IQuoteData } from './types';

/**
 * Quote Class
 * Represents a maker's response to an RFQ
 */
export class Quote implements IQuote {
  public readonly id: string;
  public readonly rfqId: string;
  public readonly makerId: string;
  public readonly pricePerToken: number;
  public readonly createdAt: number;

  /**
   * Create a Quote
   * @param id - Unique identifier
   * @param rfqId - Reference to the RFQ
   * @param makerId - Identifier for the maker
   * @param pricePerToken - Price offered by the maker
   */
  constructor(
    id: string,
    rfqId: string,
    makerId: string,
    pricePerToken: number
  ) {
    this.validate(id, rfqId, makerId, pricePerToken);
    
    this.id = id;
    this.rfqId = rfqId;
    this.makerId = makerId;
    this.pricePerToken = pricePerToken;
    this.createdAt = Date.now();
  }

  /**
   * Validate Quote parameters
   */
  private validate(
    id: string,
    rfqId: string,
    makerId: string,
    pricePerToken: number
  ): void {
    if (!id || typeof id !== 'string') {
      throw new Error('Quote id must be a non-empty string');
    }

    if (!rfqId || typeof rfqId !== 'string' || rfqId.trim().length === 0) {
      throw new Error('RFQ id must be a non-empty string');
    }

    if (!makerId || typeof makerId !== 'string' || makerId.trim().length === 0) {
      throw new Error('Maker id must be a non-empty string');
    }

    if (typeof pricePerToken !== 'number' || pricePerToken <= 0 || !Number.isFinite(pricePerToken)) {
      throw new Error('Price per token must be a positive finite number');
    }
  }

  /**
   * Get a plain object representation of the Quote
   */
  public toJSON(): IQuoteData {
    return {
      id: this.id,
      rfqId: this.rfqId,
      makerId: this.makerId,
      pricePerToken: this.pricePerToken,
      createdAt: this.createdAt
    };
  }
}
