# RFQ System (TypeScript)

A simple, in-memory Request for Quote (RFQ) system built with TypeScript. This learning project demonstrates how trading systems handle quote requests, market maker responses, and order fills.

## 🎯 Overview

The RFQ system allows:
- **Takers** to create RFQs requesting quotes for trades
- **Makers** to respond with competitive price quotes
- **Takers** to select and accept the best quote (3-step) or auto-accept (2-step) ⭐ NEW
- Automatic expiration of old RFQs
- In-memory tracking of all RFQs and quotes

### Two Workflow Options:
1. **3-Step Process** (Manual) - Create RFQ → Receive Quotes → Manually Select Best
2. **2-Step Process** (Auto-Accept) ⭐ - Create RFQ with auto-accept → Automatically filled ⚡

### Event Logging:
- ✅ Full audit trail of all system events
- ✅ Query events by RFQ, type, maker, or time range
- ✅ Recent activity tracking

## 📦 Installation

```bash
npm install
```

## 🧪 Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 🚀 Usage

### 3-Step Example (Manual Selection)

```javascript
const { RFQManager } = require('./dist/index');

// Create RFQ manager
const manager = new RFQManager();

// Step 1: Taker creates an RFQ to buy 10 BTC (expires in 5 minutes)
const rfq = manager.createRFQ('BTC/USD', 'buy', 10, 300000);

// Step 2: Makers submit quotes
const quote1 = manager.submitQuote(rfq.id, 'maker_alice', 50000);
const quote2 = manager.submitQuote(rfq.id, 'maker_bob', 49500);

// Step 3: Taker reviews and manually selects best quote
const details = manager.getRFQDetails(rfq.id);
const result = manager.acceptQuote(rfq.id, quote2.id);
console.log(`Filled at $${result.quote.pricePerToken}`);
```

### 2-Step Example (Auto-Accept) ⭐ NEW

```javascript
// Step 1: Create RFQ with auto-accept enabled
const rfq = manager.createRFQ('BTC/USD', 'buy', 10, 300000, {
  enabled: true,
  minQuotes: 3  // Auto-accept when 3 quotes received
});

// Step 2: Makers submit quotes (auto-fills when condition met)
manager.submitQuote(rfq.id, 'maker_alice', 50000);
manager.submitQuote(rfq.id, 'maker_bob', 49500);
manager.submitQuote(rfq.id, 'maker_charlie', 50100);

// ✅ Automatically filled with best quote!
console.log(rfq.status); // "filled"
console.log(`Auto-filled at $${rfq.selectedQuoteId}`);
```

### Run the Examples

```bash
# Build TypeScript first
npm run build

# Run basic example
node example.js

# Run 2-step vs 3-step comparison
node example-2step.js
```

## 📚 Core Components

### RFQ (Request for Quote)
Represents a trade request with:
- `id` - Unique identifier
- `market` - Trading pair (e.g., "BTC/USD")
- `direction` - "buy" or "sell"
- `amount` - Quantity to trade
- `expiration` - Unix timestamp for expiration
- `status` - "open", "filled", "expired", or "cancelled"

### Quote
Represents a maker's price response with:
- `id` - Unique identifier
- `rfqId` - Reference to the RFQ
- `makerId` - Maker's identifier
- `pricePerToken` - Offered price

### RFQQueue
Manages in-memory storage of RFQs and quotes:
- Stores all RFQs and their associated quotes
- Validates quote submissions
- Handles RFQ fills and expirations

### RFQManager
High-level orchestrator that:
- Creates and validates RFQs
- Handles quote submissions
- Manages quote acceptance (manual or auto)
- Auto-expires old RFQs
- Provides system statistics
- Tracks all events for audit trail

### EventLog
Comprehensive event tracking system:
- Logs all system operations
- Provides audit trail
- Enables activity monitoring
- Supports filtering and querying

## 🎓 Key Features

- ✅ **Two workflows** - 3-step (manual) or 2-step (auto-accept) ⭐
- ✅ **Event logging** - Full audit trail of all operations ⭐
- ✅ **Full validation** - Input validation at all levels
- ✅ **Expiration handling** - Automatic RFQ expiration
- ✅ **Multiple quotes** - Multiple makers can quote same RFQ
- ✅ **Buy/Sell support** - Handles both directions
- ✅ **Status tracking** - Open, filled, expired, cancelled
- ✅ **TypeScript** - Full type safety with strict mode
- ✅ **Comprehensive tests** - 136 tests with 95%+ coverage

## 📖 Documentation

- **[DESIGN.md](./docs/DESIGN.md)** - System architecture and design decisions
- **[ACTOR_MODEL.md](./docs/ACTOR_MODEL.md)** - Taker/Maker workflows and patterns
- **[TWO_STEP_FEATURE.md](./docs/TWO_STEP_FEATURE.md)** - Auto-accept feature guide
- **[CODE_REVIEW.md](./docs/CODE_REVIEW.md)** - Comprehensive code review
- **[TYPESCRIPT_MIGRATION.md](./docs/TYPESCRIPT_MIGRATION.md)** - TypeScript migration guide
- **[MIGRATION_SUMMARY.md](./docs/MIGRATION_SUMMARY.md)** - Migration summary
- **[PR_COMPARISON.md](./docs/PR_COMPARISON.md)** - Comparison with other implementations
- **[IMPLEMENTATION_COMPLETE.md](./docs/IMPLEMENTATION_COMPLETE.md)** - Final implementation summary

## 🏗️ Project Structure

```
.
├── src/
│   ├── RFQ.ts              # RFQ model with validation
│   ├── Quote.ts            # Quote model with validation
│   ├── RFQQueue.ts         # Storage and relationships
│   ├── RFQManager.ts       # Main orchestrator
│   ├── EventLog.ts         # Event tracking system ⭐
│   ├── types.ts            # TypeScript type definitions
│   ├── index.ts            # Main entry point
│   └── __tests__/          # All test files
│       ├── RFQ.test.ts
│       ├── Quote.test.ts
│       ├── RFQQueue.test.ts
│       ├── RFQManager.test.ts
│       ├── EventLog.test.ts      ⭐
│       ├── integration.test.ts
│       └── autoAccept.test.ts    ⭐
├── dist/                   # Compiled JavaScript output
├── docs/
│   ├── DESIGN.md           # Architecture
│   ├── ACTOR_MODEL.md      # Workflows ⭐
│   ├── CODE_REVIEW.md      # Code review ⭐
│   └── ...
├── example.js              # Basic usage example
├── example-2step.js        # 2-step vs 3-step comparison ⭐
├── package.json
├── tsconfig.json           # TypeScript configuration
├── jest.config.js          # Jest configuration
└── README.md
```

## 🧠 Learning Points

This project demonstrates:
1. **TypeScript** - Strict typing, interfaces, enums, generics
2. **Object-oriented design** - Classes with clear responsibilities
3. **Data validation** - Input validation and error handling
4. **State management** - RFQ lifecycle and status transitions
5. **Testing strategies** - Unit, integration, and E2E tests (136 tests!)
6. **In-memory storage** - Using Maps and Sets effectively
7. **Business logic** - Trading workflow implementation
8. **Event sourcing** - Audit trail and activity tracking
9. **Actor model** - Taker/Maker pattern
10. **Flexible workflows** - 3-step manual and 2-step auto-accept

## 🔮 Future Enhancements

See [CODE_REVIEW.md](./CODE_REVIEW.md) for detailed production recommendations.

Potential additions for learning:
- Persistent storage (database integration)
- WebSocket for real-time updates
- Authentication and authorization
- REST API layer (Express/Fastify)
- GraphQL API
- Web UI (React/Vue)
- Partial fills support
- Quote cancellation
- Price limits on RFQs
- Event log retention policies

## 📝 License

MIT
