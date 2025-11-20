/**
 * Type definitions for the RFQ system
 */

/**
 * Status of an RFQ
 */
export enum RFQStatus {
  OPEN = 'open',
  FILLED = 'filled',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled'
}

/**
 * Direction of trade
 */
export type Direction = 'buy' | 'sell';

/**
 * Auto-accept configuration for RFQ
 */
export interface IAutoAcceptConfig {
  enabled: boolean;
  minQuotes: number; // Minimum quotes before auto-accepting
  waitTimeMs?: number; // Optional: wait this long before auto-accepting
}

/**
 * RFQ data structure (plain object)
 */
export interface IRFQData {
  id: string;
  market: string;
  direction: Direction;
  amount: number;
  expiration: number;
  status: RFQStatus;
  createdAt: number;
  selectedQuoteId: string | null;
  autoAccept?: IAutoAcceptConfig;
}

/**
 * Quote data structure (plain object)
 */
export interface IQuoteData {
  id: string;
  rfqId: string;
  makerId: string;
  pricePerToken: number;
  createdAt: number;
}

/**
 * Statistics for RFQ system
 */
export interface IRFQStats {
  totalRFQs: number;
  totalQuotes: number;
  rfqsByStatus: Record<RFQStatus, number>;
}

/**
 * RFQ details with quotes
 */
export interface IRFQDetails {
  rfq: IRFQData;
  quotes: IQuoteData[];
}

/**
 * Result of selecting a quote
 */
export interface ISelectQuoteResult {
  rfq: IRFQ;
  quote: IQuote;
}

/**
 * System event types
 */
export type EventType = 
  | 'rfq_created'
  | 'quote_added'
  | 'quote_accepted'
  | 'rfq_expired'
  | 'rfq_cancelled'
  | 'rfq_filled';

/**
 * System event for audit trail
 */
export interface ISystemEvent {
  eventId: string;
  eventType: EventType;
  timestamp: number;
  rfqId: string;
  quoteId?: string;
  makerId?: string;
  data?: any;
}

/**
 * Filters for querying system events
 */
export interface IEventFilters {
  rfqId?: string;
  eventType?: EventType;
  startTime?: number;
  endTime?: number;
  makerId?: string;
}

/**
 * RFQ interface (class methods)
 */
export interface IRFQ {
  readonly id: string;
  readonly market: string;
  readonly direction: Direction;
  readonly amount: number;
  readonly expiration: number;
  status: RFQStatus;
  readonly createdAt: number;
  selectedQuoteId: string | null;
  autoAccept?: IAutoAcceptConfig;
  
  isExpired(): boolean;
  isOpen(): boolean;
  fill(quoteId: string): void;
  expire(): void;
  cancel(): void;
  toJSON(): IRFQData;
  shouldAutoAccept(quoteCount: number): boolean;
}

/**
 * Quote interface (class methods)
 */
export interface IQuote {
  readonly id: string;
  readonly rfqId: string;
  readonly makerId: string;
  readonly pricePerToken: number;
  readonly createdAt: number;
  
  toJSON(): IQuoteData;
}
