import { IRFQ, IRFQData, Direction, RFQStatus, IAutoAcceptConfig } from './types';

/**
 * RFQ (Request for Quote) Class
 * Represents a request from a taker to get price quotes from makers
 */
export class RFQ implements IRFQ {
  public readonly id: string;
  public readonly market: string;
  public readonly direction: Direction;
  public readonly amount: number;
  public readonly expiration: number;
  public status: RFQStatus;
  public readonly createdAt: number;
  public selectedQuoteId: string | null;
  public autoAccept?: IAutoAcceptConfig;

  /**
   * Create an RFQ
   * @param id - Unique identifier
   * @param market - Trading pair (e.g., "BTC/USD")
   * @param direction - "buy" or "sell"
   * @param amount - Quantity to trade
   * @param expiration - Unix timestamp for expiration
   * @param autoAccept - Optional auto-accept configuration
   */
  constructor(
    id: string,
    market: string,
    direction: Direction,
    amount: number,
    expiration: number,
    autoAccept?: IAutoAcceptConfig
  ) {
    this.validate(id, market, direction, amount, expiration);
    
    this.id = id;
    this.market = market;
    this.direction = direction;
    this.amount = amount;
    this.expiration = expiration;
    this.status = RFQStatus.OPEN;
    this.createdAt = Date.now();
    this.selectedQuoteId = null;
    this.autoAccept = autoAccept;
  }

  /**
   * Validate RFQ parameters
   */
  private validate(
    id: string,
    market: string,
    direction: Direction,
    amount: number,
    expiration: number
  ): void {
    if (!id || typeof id !== 'string') {
      throw new Error('RFQ id must be a non-empty string');
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
   * Check if the RFQ is expired
   */
  public isExpired(): boolean {
    return Date.now() > this.expiration;
  }

  /**
   * Check if the RFQ is open for quotes
   */
  public isOpen(): boolean {
    return this.status === RFQStatus.OPEN && !this.isExpired();
  }

  /**
   * Mark the RFQ as filled with a selected quote
   * @param quoteId - The ID of the selected quote
   */
  public fill(quoteId: string): void {
    if (this.status !== RFQStatus.OPEN) {
      throw new Error(`Cannot fill RFQ with status: ${this.status}`);
    }
    if (this.isExpired()) {
      throw new Error('Cannot fill an expired RFQ');
    }
    this.status = RFQStatus.FILLED;
    this.selectedQuoteId = quoteId;
  }

  /**
   * Mark the RFQ as expired
   */
  public expire(): void {
    if (this.status === RFQStatus.OPEN) {
      this.status = RFQStatus.EXPIRED;
    }
  }

  /**
   * Cancel the RFQ
   */
  public cancel(): void {
    if (this.status === RFQStatus.OPEN) {
      this.status = RFQStatus.CANCELLED;
    } else {
      throw new Error(`Cannot cancel RFQ with status: ${this.status}`);
    }
  }

  /**
   * Check if this RFQ should auto-accept quotes
   * @param quoteCount - Current number of quotes received
   * @returns true if conditions met for auto-accept
   */
  public shouldAutoAccept(quoteCount: number): boolean {
    if (!this.autoAccept || !this.autoAccept.enabled) {
      return false;
    }
    
    // Check if we have minimum required quotes
    if (quoteCount < this.autoAccept.minQuotes) {
      return false;
    }
    
    // Check if wait time has elapsed (if specified)
    if (this.autoAccept.waitTimeMs) {
      const elapsed = Date.now() - this.createdAt;
      if (elapsed < this.autoAccept.waitTimeMs) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Get a plain object representation of the RFQ
   */
  public toJSON(): IRFQData {
    return {
      id: this.id,
      market: this.market,
      direction: this.direction,
      amount: this.amount,
      expiration: this.expiration,
      status: this.status,
      createdAt: this.createdAt,
      selectedQuoteId: this.selectedQuoteId,
      autoAccept: this.autoAccept
    };
  }
}
