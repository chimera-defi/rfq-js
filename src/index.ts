/**
 * RFQ System - Main Entry Point
 * A simple Request for Quote system for learning purposes
 */

export { RFQSystem, type AcceptQuoteResult, type SystemStats } from './RFQSystem';

// Export managers for advanced usage
export { RFQManager, type RFQFilters } from './managers/RFQManager';
export { QuoteManager } from './managers/QuoteManager';
export { QueueManager, type QueueFilters } from './managers/QueueManager';

// Export models
export { RFQ, type RFQStatus, type RFQDirection, type RFQData } from './models/RFQ';
export { Quote, type QuoteStatus, type QuoteData } from './models/Quote';
export { QueueEntry, type QueueAction, type QueueEntryData } from './models/QueueEntry';

// Export validators
export { validateRFQ, validateQuote } from './utils/validators';
