# RFQ System Design

## Goal
Build a simple in-memory RFQ (Request for Quote) system in JavaScript that:
- Lets takers submit RFQs.
- Lets makers respond with quotes referencing an RFQ.
- Lets takers select a quote to fill the RFQ.
- Tracks RFQ lifecycle events via a queue.
- Is fully covered by Jest unit tests.

## Personas & Flows
1. **Taker** submits an RFQ describing the desired trade.
2. **Maker** listens for RFQs and responds with quotes.
3. **Taker** reviews quotes and selects one to fill, producing a fill record.
4. **System** emits queue events for RFQ creation, quotes, and fills.

## Functional Requirements
- Create RFQ with fields: `rfqId`, `market`, `direction`, `amount`, `expiresAt`.
- Reject duplicate RFQ IDs or expired RFQs on creation.
- Store RFQs in memory until expiration or fill.
- Allow makers to submit quotes where:
  - RFQ exists and is not expired or already filled.
  - Quote includes `rfqId` and `pricePerToken`.
- Allow takers to select a quote:
  - Quote must reference an existing RFQ and still be valid.
  - Filling an RFQ marks it filled and prevents further fills.
- Provide read operations:
  - List active RFQs.
  - List quotes for an RFQ.
  - Inspect fills.
- Emit queue events for: `RFQ_CREATED`, `QUOTE_SUBMITTED`, `RFQ_FILLED`, `RFQ_EXPIRED`.
- Expose a clock abstraction so tests can control time.

## Non-Functional Requirements
- In-memory only; persistence is out of scope.
- Deterministic, side-effect free components wherever possible.
- Simple API surface that can later be wrapped by HTTP/WebSocket layers.
- Robust unit test coverage (happy paths + edge cases).

## Core Modules
| Module | Responsibility |
| --- | --- |
| `Clock` | Provides `now()` to centralize time; default uses `Date.now()`, tests can inject fakes. |
| `EventQueue` | Simple FIFO queue storing emitted events for inspection; supports `enqueue(event)` and `drain()`. |
| `RfqRepository` | Stores RFQs, quotes, and fills in maps keyed by IDs. Handles status transitions and validation. |
| `RfqService` | Primary façade combining repository + queue + clock. Contains business logic for RFQ creation, quote submission, fill selection, and expiration checks. |

## Data Structures
```ts
type Direction = 'buy' | 'sell';

type Rfq = {
  rfqId: string;
  market: string;
  direction: Direction;
  amount: number;
  expiresAt: number; // epoch millis
  status: 'open' | 'filled' | 'expired';
};

type Quote = {
  quoteId: string;
  rfqId: string;
  pricePerToken: number;
  makerId: string;
  submittedAt: number;
};

type Fill = {
  fillId: string;
  rfqId: string;
  quoteId: string;
  filledAt: number;
};

type QueueEvent =
  | { type: 'RFQ_CREATED'; payload: Rfq }
  | { type: 'QUOTE_SUBMITTED'; payload: Quote }
  | { type: 'RFQ_FILLED'; payload: Fill & { rfq: Rfq } }
  | { type: 'RFQ_EXPIRED'; payload: Rfq };
```

## Operations
### `createRfq(input)`
- Validate fields (non-empty IDs, supported direction, positive amount, future expiration).
- Store RFQ as `open`.
- Emit `RFQ_CREATED`.

### `submitQuote(input)`
- Ensure RFQ exists and is `open`.
- Auto-expire RFQs if `expiresAt < clock.now()`.
- Save quote and emit `QUOTE_SUBMITTED`.

### `selectQuote(rfqId, quoteId)`
- Confirm RFQ and quote relationship.
- Ensure RFQ still open.
- Mark RFQ `filled`, create fill record.
- Emit `RFQ_FILLED`.

### `expireRfq(rfqId)`
- Public helper/cron-style operation to mark RFQ expired if past `expiresAt`.
- Emits `RFQ_EXPIRED`.
- `RfqService` should lazily call this during any operation touching the RFQ.

### Queries
- `getOpenRfqs()` -> list of RFQs with `status === 'open'`.
- `getQuotes(rfqId)` -> all quotes per RFQ.
- `getFills()` -> all fill records.
- `queue.drain()` -> returns events FIFO for observers/tests.

## Error Handling
- Throw descriptive `Error` objects for invalid operations:
  - Duplicate RFQ IDs.
  - Invalid directions.
  - Expired RFQs on creation or quote submission.
  - Quotes referencing missing/closed RFQs.
  - Selecting non-existent quotes or on already filled RFQs.

## Testing Strategy
- Use Jest test suites per module.
- Mock clock to simulate expiration.
- Queue emissions asserted per operation.
- Edge cases:
  - Expiration pre-checks.
  - Duplicate IDs.
  - Quote submission after fill/expire.
  - Fill selection verifies proper RFQ status.

## Future Enhancements (Out of Scope)
- Persistence layer (database).
- Authentication and authorization.
- Network APIs (REST/WebSocket).
- Matching engine that auto-selects best quote.

