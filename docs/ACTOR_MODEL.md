# Actor Model Documentation

## Overview

The RFQ system operates with two distinct types of actors, each with specific roles and responsibilities.

## Actors

### Takers
**Role**: Request quotes and make trading decisions

**Actions**:
- ✅ Create RFQs (`createRFQ`)
- ✅ View RFQs (`getRFQ`, `getAllRFQs`)
- ✅ Accept quotes (`acceptQuote`)
- ✅ Cancel their RFQs (`cancelRFQ`)

**Workflow**:
1. Taker creates an RFQ to request quotes
2. Taker waits for makers to respond with quotes
3. Taker reviews available quotes
4. Taker accepts the best quote

### Makers
**Role**: Provide quotes in response to RFQs

**Actions**:
- ✅ View open RFQs (`getRFQ`, `getAllRFQs`)
- ✅ Add quotes to RFQs (`addQuote`)
- ✅ View quotes for RFQs (`getQuotesForRFQ`)

**Workflow**:
1. Maker discovers an open RFQ
2. Maker evaluates the RFQ (market, direction, amount)
3. Maker adds a quote with their price
4. Maker waits to see if their quote is accepted

## Typical Workflow

```
┌─────────┐                    ┌─────────┐
│  Taker  │                    │  Maker  │
└────┬────┘                    └────┬────┘
     │                               │
     │ 1. createRFQ()               │
     ├───────────────────────────────┤
     │                               │
     │                   2. addQuote()│
     │◄──────────────────────────────┤
     │                               │
     │                   3. addQuote()│
     │◄──────────────────────────────┤
     │                               │
     │ 4. acceptQuote()             │
     ├───────────────────────────────┤
     │                               │
     │         RFQ is filled         │
     │                               │
```

## Important Design Principles

1. **Separation of Concerns**: Takers and Makers have distinct roles
2. **Asynchronous Process**: Makers respond independently to RFQs
3. **Competition**: Multiple makers can compete with different quotes
4. **Taker Choice**: Taker selects the best quote from available options

## Why No 1-Step or 2-Step Workflows?

The system intentionally does NOT provide:
- ❌ `createRFQWithQuote()` - A taker wouldn't add their own quote
- ❌ `createAndAcceptQuote()` - This assumes the taker knows the quote before creating the RFQ

These workflows don't make sense because:
- RFQs are requests FOR quotes, not requests WITH quotes
- The taker doesn't know what quotes will be offered
- The system is designed for makers to compete with different prices
- A 1-step process would eliminate the competitive quote process

## API Methods by Actor

### Taker Methods
```typescript
// Create an RFQ
system.createRFQ(rfqId, market, direction, amount, expiration)

// View RFQs
system.getRFQ(rfqId)
system.getAllRFQs(filters)

// Accept a quote
system.acceptQuote(quoteId)

// Cancel an RFQ
system.cancelRFQ(rfqId)
```

### Maker Methods
```typescript
// View RFQs
system.getRFQ(rfqId)
system.getAllRFQs(filters)

// Add a quote
system.addQuote(quoteId, rfqId, pricePerToken, makerId)

// View quotes
system.getQuotesForRFQ(rfqId)
system.getQuote(quoteId)
```

### Shared Methods (Both Actors)
```typescript
// View system state
system.getQueueEntries(filters)
system.getRecentActivity(limit)
system.getStats()
```

## Example: Real-World Scenario

**Scenario**: Alice (Taker) wants to buy 100 ETH

1. **Alice (Taker)** creates RFQ:
   ```typescript
   const rfq = system.createRFQ('rfq-001', 'ETH/USD', 'buy', 100, expiration);
   ```

2. **Bob (Maker)** sees the RFQ and adds a quote:
   ```typescript
   system.addQuote('quote-001', 'rfq-001', 2500.00, 'bob');
   ```

3. **Charlie (Maker)** also adds a quote:
   ```typescript
   system.addQuote('quote-002', 'rfq-001', 2499.50, 'charlie');
   ```

4. **Alice (Taker)** reviews quotes and accepts the best one:
   ```typescript
   const result = system.acceptQuote('quote-002'); // Charlie's lower price
   ```

5. Result: RFQ is filled, Charlie's quote is accepted, Bob's quote is rejected

## Implementation Notes

- The system doesn't enforce actor authentication (for learning purposes)
- In production, you'd add authentication to ensure:
  - Takers can only cancel their own RFQs
  - Makers can only add quotes (not create RFQs)
  - Proper authorization checks
