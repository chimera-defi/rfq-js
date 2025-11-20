# RFQ System Design Document

## Overview
A simple Request for Quote (RFQ) system built in TypeScript for learning purposes. The system operates with two distinct actor types: **Takers** (who create RFQs and accept quotes) and **Makers** (who provide quotes in response to RFQs).

## Actor Model

The system has two types of actors with distinct roles:

### Takers
- **Purpose**: Request quotes and make trading decisions
- **Actions**: Create RFQs, view RFQs, accept quotes, cancel RFQs
- **Workflow**: Create RFQ → Review quotes → Accept best quote

### Makers
- **Purpose**: Provide quotes in response to RFQs
- **Actions**: View RFQs, add quotes to RFQs
- **Workflow**: Discover RFQ → Evaluate → Add quote → Wait for acceptance

See [ACTOR_MODEL.md](./ACTOR_MODEL.md) for detailed actor documentation.

## Core Concepts

### RFQ (Request for Quote)
An RFQ represents a request from a taker to buy or sell a certain amount of tokens in a specific market.

**RFQ Structure:**
- `rfqId` (string): Unique identifier for the RFQ
- `market` (string): The market/token pair (e.g., "ETH/USD", "BTC/USD")
- `direction` (string): Either "buy" or "sell"
- `amount` (number): The quantity of tokens requested
- `expiration` (number): Unix timestamp when the RFQ expires
- `status` (string): "open", "filled", "expired", "cancelled"
- `createdAt` (number): Unix timestamp when RFQ was created

### Quote
A quote represents a maker's offer to fill an RFQ at a specific price.

**Quote Structure:**
- `quoteId` (string): Unique identifier for the quote
- `rfqId` (string): Reference to the RFQ this quote is for
- `pricePerToken` (number): The price per token offered by the maker
- `makerId` (string): Identifier for the maker (optional, for learning)
- `createdAt` (number): Unix timestamp when quote was created
- `status` (string): "pending", "accepted", "rejected"

### Queue
A queue tracks incoming RFQs and their fills. This helps monitor system activity.

**Queue Entry Structure:**
- `rfqId` (string): Reference to the RFQ
- `action` (string): "rfq_created", "quote_added", "quote_accepted", "rfq_expired"
- `timestamp` (number): When the action occurred
- `data` (object): Additional context (quoteId, makerId, etc.)

## System Architecture

### Core Classes/Modules

1. **RFQManager**
   - Manages RFQ lifecycle (create, expire, cancel)
   - Stores RFQs in memory
   - Validates RFQ data
   - Handles expiration logic

2. **QuoteManager**
   - Manages quote lifecycle (create, accept, reject)
   - Links quotes to RFQs
   - Validates quote data
   - Ensures quotes are only for open RFQs

3. **QueueManager**
   - Tracks all system events
   - Provides queue/event log functionality
   - Can filter by RFQ, action type, time range

4. **RFQSystem** (Main orchestrator)
   - Coordinates between RFQManager, QuoteManager, and QueueManager
   - Provides unified API for the system
   - Handles business logic (e.g., can't accept quote for expired RFQ)

## API Design

### RFQ Operations

```javascript
// Create an RFQ
createRFQ(market, direction, amount, expirationTime)

// Get an RFQ by ID
getRFQ(rfqId)

// Get all RFQs (with optional filters)
getAllRFQs(filters = { status, market, direction })

// Cancel an RFQ
cancelRFQ(rfqId)
```

### Quote Operations

```javascript
// Add a quote for an RFQ
addQuote(rfqId, pricePerToken, makerId)

// Get quotes for an RFQ
getQuotesForRFQ(rfqId)

// Get a quote by ID
getQuote(quoteId)

// Accept a quote (taker selects winning quote)
acceptQuote(quoteId)
```

### Queue Operations

```javascript
// Get queue entries (with optional filters)
getQueueEntries(filters = { rfqId, action, startTime, endTime })

// Get recent activity
getRecentActivity(limit = 100)
```

## Business Rules

1. **RFQ Creation:**
   - RFQ ID must be unique
   - Amount must be positive
   - Expiration must be in the future
   - Direction must be "buy" or "sell"
   - Market must be non-empty string

2. **Quote Creation:**
   - Quote can only be added to open RFQs
   - Price per token must be positive
   - Quote ID must be unique

3. **Quote Acceptance:**
   - Only open RFQs can have quotes accepted
   - Once a quote is accepted, the RFQ status becomes "filled"
   - Other quotes for the same RFQ should be marked as "rejected"
   - RFQ cannot be accepted if expired

4. **Expiration:**
   - RFQs should be checked for expiration
   - Expired RFQs cannot accept new quotes
   - Expired RFQs should have status "expired"

## Data Storage

All data stored in memory using JavaScript objects/Maps:
- `rfqs`: Map<rfqId, RFQ>
- `quotes`: Map<quoteId, Quote>
- `rfqQuotes`: Map<rfqId, Set<quoteId>> (index for quick lookup)
- `queue`: Array of queue entries

## Error Handling

The system should throw descriptive errors for:
- Invalid input data
- RFQ not found
- Quote not found
- Business rule violations (e.g., accepting quote for expired RFQ)
- Duplicate IDs

## Testing Strategy

1. **Unit Tests:**
   - RFQ creation and validation
   - Quote creation and validation
   - Quote acceptance logic
   - Expiration handling
   - Queue tracking

2. **Integration Tests:**
   - End-to-end RFQ flow (create → quote → accept)
   - Multiple quotes for same RFQ
   - Expiration scenarios
   - Error cases

## Future Enhancements (Out of Scope for Now)

- Persistence layer (database)
- Web API/REST endpoints
- Authentication/authorization
- Real-time notifications
- Price validation rules
- Partial fills
- Maker reputation system
