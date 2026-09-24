/**
 * Quote Model
 * Represents a maker's offer to fill an RFQ at a specific price
 */

export type QuoteStatus = 'pending' | 'accepted' | 'rejected';

export interface QuoteData {
  quoteId: string;
  rfqId: string;
  pricePerToken: number;
  makerId: string | null;
  createdAt: number;
  status: QuoteStatus;
}

export class Quote {
  public readonly quoteId: string;
  public readonly rfqId: string;
  public readonly pricePerToken: number;
  public readonly makerId: string | null;
  public readonly createdAt: number;
  public status: QuoteStatus;

  constructor(
    quoteId: string,
    rfqId: string,
    pricePerToken: number,
    makerId: string | null = null,
    createdAt: number = Date.now()
  ) {
    this.quoteId = quoteId;
    this.rfqId = rfqId;
    this.pricePerToken = pricePerToken;
    this.makerId = makerId;
    this.createdAt = createdAt;
    this.status = 'pending';
  }

  /**
   * Mark the quote as accepted
   */
  markAccepted(): void {
    this.status = 'accepted';
  }

  /**
   * Mark the quote as rejected
   */
  markRejected(): void {
    if (this.status === 'pending') {
      this.status = 'rejected';
    }
  }

  /**
   * Check if the quote is pending
   * @returns {boolean} True if pending
   */
  isPending(): boolean {
    return this.status === 'pending';
  }

  /**
   * Convert Quote to plain object
   * @returns {QuoteData} Plain object representation
   */
  toJSON(): QuoteData {
    return {
      quoteId: this.quoteId,
      rfqId: this.rfqId,
      pricePerToken: this.pricePerToken,
      makerId: this.makerId,
      createdAt: this.createdAt,
      status: this.status
    };
  }
}
