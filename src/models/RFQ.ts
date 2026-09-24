/**
 * RFQ (Request for Quote) Model
 * Represents a request from a taker to buy or sell tokens
 */

export type RFQStatus = 'open' | 'filled' | 'expired' | 'cancelled';
export type RFQDirection = 'buy' | 'sell';

export interface RFQData {
  rfqId: string;
  market: string;
  direction: RFQDirection;
  amount: number;
  expiration: number;
  createdAt: number;
  status: RFQStatus;
}

export class RFQ {
  public readonly rfqId: string;
  public readonly market: string;
  public readonly direction: RFQDirection;
  public readonly amount: number;
  public expiration: number;
  public readonly createdAt: number;
  public status: RFQStatus;

  constructor(
    rfqId: string,
    market: string,
    direction: RFQDirection,
    amount: number,
    expiration: number,
    createdAt: number = Date.now()
  ) {
    this.rfqId = rfqId;
    this.market = market;
    this.direction = direction;
    this.amount = amount;
    this.expiration = expiration;
    this.createdAt = createdAt;
    this.status = 'open';
  }

  /**
   * Check if the RFQ is expired
   * @returns {boolean} True if expired
   */
  isExpired(): boolean {
    return Date.now() >= this.expiration;
  }

  /**
   * Check if the RFQ is open (not filled, expired, or cancelled)
   * @returns {boolean} True if open
   */
  isOpen(): boolean {
    return this.status === 'open' && !this.isExpired();
  }

  /**
   * Mark the RFQ as expired
   */
  markExpired(): void {
    if (this.status === 'open') {
      this.status = 'expired';
    }
  }

  /**
   * Mark the RFQ as filled
   */
  markFilled(): void {
    this.status = 'filled';
  }

  /**
   * Mark the RFQ as cancelled
   */
  markCancelled(): void {
    if (this.status === 'open') {
      this.status = 'cancelled';
    }
  }

  /**
   * Convert RFQ to plain object
   * @returns {RFQData} Plain object representation
   */
  toJSON(): RFQData {
    return {
      rfqId: this.rfqId,
      market: this.market,
      direction: this.direction,
      amount: this.amount,
      expiration: this.expiration,
      createdAt: this.createdAt,
      status: this.status
    };
  }
}
