# Actor Model Documentation

## Overview

The RFQ system operates with two distinct types of actors, each with specific roles and responsibilities. This document explains the actor model, workflows, and why certain design decisions were made.

---

## Actors

### Takers
**Role**: Request quotes and make trading decisions

**Responsibilities**:
- Create RFQs to request quotes from the market
- Review quotes from multiple makers
- Select and accept the best quote (or use auto-accept)
- Cancel their own RFQs if needed

**Actions**:
- ✅ Create RFQs (`createRFQ`)
- ✅ View RFQs (`getRFQDetails`, `getAllRFQDetails`, `getOpenRFQs`)
- ✅ Accept quotes (`acceptQuote`)
- ✅ Cancel their RFQs (`cancelRFQ`)

**Workflow**:
1. Taker creates an RFQ to request quotes
2. Taker waits for makers to respond with quotes
3. Taker reviews available quotes
4. Taker accepts the best quote (manual or automatic)

---

### Makers
**Role**: Provide competitive quotes in response to RFQs

**Responsibilities**:
- Monitor open RFQs
- Evaluate RFQs (market, direction, amount)
- Submit competitive price quotes
- Compete with other makers for best price

**Actions**:
- ✅ View open RFQs (`getOpenRFQs`, `getRFQDetails`)
- ✅ Add quotes to RFQs (`submitQuote`)
- ✅ View quotes for RFQs (`getRFQDetails`)

**Workflow**:
1. Maker discovers an open RFQ
2. Maker evaluates the RFQ (market, direction, amount)
3. Maker adds a quote with their price
4. Maker waits to see if their quote is accepted

---

## Workflow Diagrams

### 3-Step Process (Manual Selection)

```
┌─────────┐                    ┌─────────┐
│  Taker  │                    │  Maker  │
└────┬────┘                    └────┬────┘
     │                               │
     │ 1. createRFQ()               │
     ├───────────────────────────────┤
     │                               │
     │                   2. submitQuote()│
     │◄──────────────────────────────┤
     │                               │
     │                   2. submitQuote()│
     │◄──────────────────────────────┤
     │                               │
     │ 3. acceptQuote()             │
     ├───────────────────────────────┤
     │                               │
     │         RFQ is filled         │
     │                               │
```

**Example:**
```typescript
// Step 1: Taker creates RFQ
const rfq = manager.createRFQ('BTC/USD', 'buy', 10, 300000);

// Step 2: Makers submit quotes
manager.submitQuote(rfq.id, 'maker_alice', 50000);
manager.submitQuote(rfq.id, 'maker_bob', 49500);

// Step 3: Taker manually selects best quote
manager.acceptQuote(rfq.id, bestQuoteId);
```

---

### 2-Step Process (Auto-Accept) ⭐ NEW

```
┌─────────┐                    ┌─────────┐
│  Taker  │                    │  Maker  │
└────┬────┘                    └────┬────┘
     │                               │
     │ 1. createRFQ(autoAccept)    │
     ├───────────────────────────────┤
     │                               │
     │                   2. submitQuote()│
     │◄──────────────────────────────┤
     │                               │
     │                   2. submitQuote()│
     │◄──────────────────────────────┤
     │                               │
     │    ✅ Auto-filled!            │
     │         (no step 3)           │
     │                               │
```

**Example:**
```typescript
// Step 1: Taker creates RFQ with auto-accept
const rfq = manager.createRFQ('BTC/USD', 'buy', 10, 300000, {
  enabled: true,
  minQuotes: 2
});

// Step 2: Makers submit quotes (auto-fills when condition met)
manager.submitQuote(rfq.id, 'maker_alice', 50000);
manager.submitQuote(rfq.id, 'maker_bob', 49500); // ✅ Auto-filled!
```

---

## Important Design Principles

### 1. Separation of Concerns
Takers and Makers have distinct, non-overlapping roles:
- **Takers** request and select
- **Makers** provide and compete

### 2. Asynchronous Process
The RFQ process is inherently asynchronous:
- Makers respond independently
- Multiple makers can respond
- Timing of responses varies

### 3. Competition
Multiple makers compete for the same RFQ:
- Each maker provides their best price
- Competition leads to better prices
- Taker benefits from multiple options

### 4. Taker Choice
The taker has ultimate control:
- Reviews all available quotes
- Selects based on any criteria (price, maker reputation, etc.)
- Can enable auto-accept for speed

---

## Why No 1-Step Workflow?

**Invalid Pattern:**
```typescript
// ❌ This doesn't make sense:
manager.createRFQAndAccept('BTC/USD', 'buy', 10, price);
```

**Why it doesn't make sense:**
- An RFQ is a *request* FOR quotes, not a request WITH a quote
- The taker doesn't know what price they'll get before creating the RFQ
- The entire point is to get competitive quotes from makers
- A 1-step process would eliminate the competitive quote process

**Real-world analogy:**
You don't go to multiple car dealerships saying "I want to buy a car for exactly $20,000." Instead, you say "I want to buy this car, what's your best price?" and then choose the best offer.

---

## Why 2-Step Auto-Accept Makes Sense

The 2-step auto-accept workflow is valid because:

✅ **Still maintains competition**: Multiple makers submit quotes
✅ **Respects the RFQ process**: Taker requests, makers respond
✅ **Adds automation**: System automatically selects best price
✅ **Configurable**: Taker sets criteria (min quotes, wait time)
✅ **Transparent**: Best price logic is clear (lowest for buy, highest for sell)

**Use case**: When speed is more important than manual review.

---

## API Methods by Actor

### Taker Methods

```typescript
// Create RFQs
manager.createRFQ(market, direction, amount, expirationMs, autoAccept?)

// View RFQs
manager.getRFQDetails(rfqId)
manager.getAllRFQDetails()
manager.getOpenRFQs()

// Accept quotes (3-step manual)
manager.acceptQuote(rfqId, quoteId)

// Cancel RFQs
manager.cancelRFQ(rfqId)

// View activity
manager.getEventsForRFQ(rfqId)
manager.getRecentEvents(limit)
```

---

### Maker Methods

```typescript
// View RFQs
manager.getOpenRFQs()           // See what's available
manager.getRFQDetails(rfqId)    // Get details of specific RFQ

// Submit quotes
manager.submitQuote(rfqId, makerId, pricePerToken)

// View activity (to see if quote was accepted)
manager.getEventsForRFQ(rfqId)
manager.getRecentEvents(limit)
```

---

### Shared Methods (Both Actors)

```typescript
// System state
manager.getStats()
manager.getEvents(filters?)
manager.getEventStats()
```

---

## Example: Real-World Scenario

### Scenario 1: Buy 100 ETH (3-Step Manual)

**Cast:**
- **Alice** (Taker) - Wants to buy 100 ETH
- **Bob** (Maker) - Market maker from Firm A
- **Charlie** (Maker) - Market maker from Firm B
- **Diana** (Maker) - Market maker from Firm C

**Flow:**

1. **Alice creates RFQ:**
   ```typescript
   const rfq = manager.createRFQ('ETH/USD', 'buy', 100, 300000);
   // Event: rfq_created
   ```

2. **Makers respond with quotes:**
   ```typescript
   manager.submitQuote(rfq.id, 'bob', 3050.00);
   // Event: quote_added (bob)
   
   manager.submitQuote(rfq.id, 'charlie', 3048.50);
   // Event: quote_added (charlie)
   
   manager.submitQuote(rfq.id, 'diana', 3052.00);
   // Event: quote_added (diana)
   ```

3. **Alice reviews and selects best quote:**
   ```typescript
   const details = manager.getRFQDetails(rfq.id);
   console.log(details.quotes);
   // Bob: $3,050.00
   // Charlie: $3,048.50 ← Best price!
   // Diana: $3,052.00
   
   manager.acceptQuote(rfq.id, charlieQuoteId);
   // Event: quote_accepted (charlie)
   // Event: rfq_filled
   ```

4. **Result:**
   - RFQ filled at $3,048.50 per ETH
   - Total cost: $304,850
   - Charlie's quote accepted
   - Bob's and Diana's quotes rejected

---

### Scenario 2: Sell 50 BTC (2-Step Auto)

**Cast:**
- **Eve** (Taker) - Wants to sell 50 BTC quickly
- **Frank**, **Grace**, **Henry** (Makers) - Competing buyers

**Flow:**

1. **Eve creates RFQ with auto-accept:**
   ```typescript
   const rfq = manager.createRFQ('BTC/USD', 'sell', 50, 300000, {
     enabled: true,
     minQuotes: 3  // Wait for 3 competitive quotes
   });
   // Event: rfq_created
   ```

2. **Makers submit quotes (system auto-accepts when 3rd arrives):**
   ```typescript
   manager.submitQuote(rfq.id, 'frank', 49800.00);
   // Event: quote_added (frank)
   // Status: open (need 2 more quotes)
   
   manager.submitQuote(rfq.id, 'grace', 49850.00);
   // Event: quote_added (grace)
   // Status: open (need 1 more quote)
   
   manager.submitQuote(rfq.id, 'henry', 49825.00);
   // Event: quote_added (henry)
   // ✅ Auto-accept triggered!
   // Event: quote_accepted (grace - highest price for sell)
   // Event: rfq_filled
   ```

3. **Result:**
   - Automatically filled at $49,850 per BTC (Grace's quote)
   - Total proceeds: $2,492,500
   - Best price selected (highest for sell order)
   - No manual step required

---

## Event Audit Trail

Every action in the system generates events for full auditability:

```typescript
// Get all events for an RFQ
const events = manager.getEventsForRFQ(rfqId);

// Example output:
[
  { eventType: 'rfq_created', timestamp: ..., rfqId: 'rfq1', ... },
  { eventType: 'quote_added', timestamp: ..., rfqId: 'rfq1', quoteId: 'q1', makerId: 'bob' },
  { eventType: 'quote_added', timestamp: ..., rfqId: 'rfq1', quoteId: 'q2', makerId: 'charlie' },
  { eventType: 'quote_accepted', timestamp: ..., rfqId: 'rfq1', quoteId: 'q2', makerId: 'charlie' },
  { eventType: 'rfq_filled', timestamp: ..., rfqId: 'rfq1', quoteId: 'q2', makerId: 'charlie' }
]

// Get recent system activity
const recent = manager.getRecentEvents(10);

// Get maker-specific activity
const makerEvents = manager.getEvents({ makerId: 'bob' });
```

---

## Best Practices

### For Takers

1. **Set reasonable expiration times**
   - Too short: Makers may not have time to respond
   - Too long: Prices may become stale
   - Recommended: 5-10 minutes for most markets

2. **Use auto-accept for speed**
   - When you trust market price discovery
   - When speed is critical
   - Set `minQuotes` to ensure competition

3. **Use manual selection for control**
   - When making large trades
   - When you want to verify maker reputation
   - When price isn't the only criterion

4. **Monitor the event log**
   - Track your RFQ's progress
   - See when quotes arrive
   - Understand timing patterns

---

### For Makers

1. **Monitor open RFQs actively**
   ```typescript
   const openRFQs = manager.getOpenRFQs();
   ```

2. **Respond quickly**
   - RFQs may have auto-accept enabled
   - Early quotes have advantage in auto-accept scenarios
   - Late quotes may arrive after RFQ is filled

3. **Price competitively**
   - Auto-accept selects best price
   - Other makers are competing
   - Balance competitiveness with profit

4. **Check event history**
   - Learn from accepted quotes
   - Understand taker preferences
   - Adjust pricing strategy

---

## Implementation Notes

### Authentication (Production Consideration)

This learning implementation doesn't enforce actor authentication. In production:

```typescript
// ❌ Current: Anyone can do anything
manager.createRFQ(...);     // No auth check
manager.submitQuote(...);   // No auth check
manager.cancelRFQ(...);     // No auth check

// ✅ Production: Add authentication
class AuthenticatedRFQManager {
  createRFQ(takerId: string, authToken: string, ...) {
    if (!this.verifyTaker(takerId, authToken)) {
      throw new Error('Unauthorized');
    }
    // ...
  }
  
  submitQuote(makerId: string, authToken: string, ...) {
    if (!this.verifyMaker(makerId, authToken)) {
      throw new Error('Unauthorized');
    }
    // ...
  }
  
  cancelRFQ(takerId: string, rfqId: string, authToken: string) {
    const rfq = this.getRFQ(rfqId);
    if (rfq.takerId !== takerId || !this.verifyTaker(takerId, authToken)) {
      throw new Error('Unauthorized');
    }
    // ...
  }
}
```

---

## Comparison: 2-Step vs 3-Step

| Aspect | 3-Step (Manual) | 2-Step (Auto-Accept) |
|--------|----------------|---------------------|
| **Steps** | Create → Receive → Select | Create → Auto-fill |
| **Control** | Full manual control | Automated selection |
| **Speed** | Slower (manual review) | Faster (instant) |
| **Competition** | ✅ Yes | ✅ Yes |
| **Best For** | Large trades, complex decisions | Quick trades, trusted markets |
| **Maker View** | Same (submit quotes) | Same (submit quotes) |
| **Price Selection** | Manual | Automatic (best price) |
| **Flexibility** | Choose any quote | Must set criteria upfront |

**Key Insight:** Both workflows respect the actor model and maintain competition. The 2-step process is just an optimization that automates the selection step.

---

## Summary

The RFQ system follows a clear actor model:
- **Takers** request and select
- **Makers** compete and provide

Both 3-step (manual) and 2-step (auto-accept) workflows are valid and respect this model. The system provides full event auditing, transparent price selection, and flexibility for both actors to operate effectively.

The design promotes:
- ✅ Competition between makers
- ✅ Best price discovery
- ✅ Taker control (manual or automated)
- ✅ Full transparency through event logs
- ✅ Flexible workflows for different use cases
