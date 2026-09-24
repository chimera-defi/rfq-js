import { RFQ, RFQDirection, RFQStatus } from '../models/RFQ';
import { validateRFQ } from '../utils/validators';

export interface RFQFilters {
  status?: RFQStatus;
  market?: string;
  direction?: RFQDirection;
}

/**
 * RFQManager
 * Manages RFQ lifecycle: create, retrieve, cancel, and expiration handling
 */
export class RFQManager {
  private rfqs: Map<string, RFQ> = new Map();

  /**
   * Create a new RFQ
   * @param rfqId - Unique RFQ identifier
   * @param market - Market/token pair
   * @param direction - 'buy' or 'sell'
   * @param amount - Amount of tokens
   * @param expiration - Expiration timestamp (Unix timestamp)
   * @returns Created RFQ instance
   * @throws {Error} If validation fails or RFQ ID already exists
   */
  createRFQ(
    rfqId: string,
    market: string,
    direction: RFQDirection,
    amount: number,
    expiration: number
  ): RFQ {
    // Validate input
    validateRFQ(rfqId, market, direction, amount, expiration);

    // Check for duplicate RFQ ID
    if (this.rfqs.has(rfqId)) {
      throw new Error(`RFQ with ID "${rfqId}" already exists`);
    }

    // Create and store RFQ
    const rfq = new RFQ(rfqId, market, direction, amount, expiration);
    this.rfqs.set(rfqId, rfq);

    return rfq;
  }

  /**
   * Get an RFQ by ID
   * @param rfqId - RFQ identifier
   * @returns RFQ instance or null if not found
   */
  getRFQ(rfqId: string): RFQ | null {
    return this.rfqs.get(rfqId) || null;
  }

  /**
   * Get all RFQs with optional filters
   * @param filters - Filter options
   * @returns Array of RFQ instances
   */
  getAllRFQs(filters: RFQFilters = {}): RFQ[] {
    let rfqs = Array.from(this.rfqs.values());

    // Apply filters
    if (filters.status) {
      rfqs = rfqs.filter(rfq => rfq.status === filters.status);
    }

    if (filters.market) {
      rfqs = rfqs.filter(rfq => rfq.market === filters.market);
    }

    if (filters.direction) {
      rfqs = rfqs.filter(rfq => rfq.direction === filters.direction);
    }

    return rfqs;
  }

  /**
   * Cancel an RFQ
   * @param rfqId - RFQ identifier
   * @returns Cancelled RFQ instance
   * @throws {Error} If RFQ not found or cannot be cancelled
   */
  cancelRFQ(rfqId: string): RFQ {
    const rfq = this.getRFQ(rfqId);
    if (!rfq) {
      throw new Error(`RFQ with ID "${rfqId}" not found`);
    }

    if (rfq.status !== 'open') {
      throw new Error(`Cannot cancel RFQ with status "${rfq.status}"`);
    }

    rfq.markCancelled();
    return rfq;
  }

  /**
   * Check and update expired RFQs
   * @returns Array of RFQs that were expired
   */
  checkExpirations(): RFQ[] {
    const expiredRFQs: RFQ[] = [];
    
    for (const rfq of this.rfqs.values()) {
      if (rfq.isExpired() && rfq.status === 'open') {
        rfq.markExpired();
        expiredRFQs.push(rfq);
      }
    }

    return expiredRFQs;
  }

  /**
   * Check if an RFQ exists
   * @param rfqId - RFQ identifier
   * @returns True if RFQ exists
   */
  hasRFQ(rfqId: string): boolean {
    return this.rfqs.has(rfqId);
  }

  /**
   * Get count of RFQs
   * @returns Total number of RFQs
   */
  getCount(): number {
    return this.rfqs.size;
  }

  /**
   * Clear all RFQs (useful for testing)
   */
  clear(): void {
    this.rfqs.clear();
  }
}
