# RFQ System - Design Document

## Overview
A simple in-memory Request for Quote (RFQ) system that allows takers to request quotes and makers to provide quotes for trades.

## Architecture

### Core Components

#### 1. RFQ (Request for Quote)
An RFQ represents a request from a taker to get price quotes from makers.

**Properties:**
- `id` (string): Unique identifier for the RFQ
- `market` (string): Trading pair/market (e.g., "BTC/USD", "ETH/USDT")
- `direction` (string): Either "buy" or "sell"
- `amount` (number): Quantity of asset to trade
- `expiration` (number): Unix timestamp when the RFQ expires
- `status` (string): Current state - "open", "filled", "expired", "cancelled"
- `createdAt` (number): Unix timestamp when RFQ was created
- `selectedQuoteId` (string|null): ID of the selected quote (if any)

#### 2. Quote
A quote represents a maker's response to an RFQ.

**Properties:**
- `id` (string): Unique identifier for the quote
- `rfqId` (string): Reference to the RFQ this quote responds to
- `pricePerToken` (number): Price offered by the maker
- `createdAt` (number): Unix timestamp when quote was created
- `makerId` (string): Identifier for the maker providing the quote

#### 3. RFQQueue
Manages the queue of incoming RFQs and tracks fills.

**Responsibilities:**
- Store RFQs in memory
- Store quotes in memory
- Track RFQ status transitions
- Handle expiration logic
- Maintain order of requests

**Methods:**
- `addRFQ(rfq)`: Add a new RFQ to the queue
- `getRFQ(id)`: Retrieve an RFQ by ID
- `addQuote(quote)`: Add a quote for an RFQ
- `getQuotes(rfqId)`: Get all quotes for a specific RFQ
- `selectQuote(rfqId, quoteId)`: Mark a quote as selected and fill the RFQ
- `expireRFQs()`: Check and expire any RFQs past their expiration time
- `getAllRFQs()`: Get all RFQs in the system

#### 4. RFQManager
High-level orchestrator for the RFQ system.

**Responsibilities:**
- Validate RFQ and quote data
- Generate unique IDs
- Coordinate between components
- Enforce business rules

**Methods:**
- `createRFQ(market, direction, amount, expirationMs)`: Create and submit a new RFQ
- `submitQuote(rfqId, makerId, pricePerToken)`: Submit a quote for an RFQ
- `acceptQuote(rfqId, quoteId)`: Accept a specific quote
- `getRFQDetails(rfqId)`: Get RFQ with all its quotes

## Data Flow

### 1. Creating an RFQ
```
Taker → RFQManager.createRFQ() → Validate → Generate ID → RFQQueue.addRFQ() → Return RFQ
```

### 2. Submitting a Quote
```
Maker → RFQManager.submitQuote() → Validate (RFQ exists, not expired) → Generate ID → RFQQueue.addQuote() → Return Quote
```

### 3. Accepting a Quote
```
Taker → RFQManager.acceptQuote() → Validate (RFQ & Quote exist) → RFQQueue.selectQuote() → Update RFQ status to "filled"
```

## Business Rules

1. **RFQ Creation:**
   - Expiration time must be in the future
   - Amount must be positive
   - Direction must be "buy" or "sell"
   - Market must be non-empty string

2. **Quote Submission:**
   - Can only quote on "open" RFQs
   - Cannot quote on expired RFQs
   - Price per token must be positive
   - Multiple makers can quote on the same RFQ

3. **Quote Selection:**
   - Only one quote can be selected per RFQ
   - Can only select quotes for "open" RFQs
   - Once a quote is selected, RFQ status becomes "filled"

4. **Expiration:**
   - RFQs automatically expire when current time exceeds expiration time
   - Expired RFQs cannot receive new quotes
   - Expired RFQs cannot have quotes selected

## Error Handling

The system should throw descriptive errors for:
- Invalid input data
- Attempts to quote on closed/expired RFQs
- Attempts to select non-existent quotes
- Attempts to select quotes for non-existent RFQs

## Storage

All data stored in-memory using JavaScript objects and arrays:
- Map of RFQ ID → RFQ object
- Map of Quote ID → Quote object
- Map of RFQ ID → Array of Quote IDs

## Testing Strategy

1. **Unit Tests:**
   - Test each component in isolation
   - Mock dependencies
   - Test edge cases and error conditions

2. **Integration Tests:**
   - Test complete workflows (create RFQ → add quotes → select quote)
   - Test expiration logic
   - Test validation rules

3. **Test Coverage:**
   - Aim for >90% code coverage
   - Test all public methods
   - Test all error conditions

## Future Enhancements (Out of Scope)

- Persistent storage (database)
- Real-time notifications
- Authentication and authorization
- Order matching algorithms
- Partial fills
- Quote amendments
- RFQ cancellation by taker
