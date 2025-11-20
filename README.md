# RFQ System (JavaScript)

A simple, in-memory Request for Quote (RFQ) system built in JavaScript. This learning project demonstrates how trading systems handle quote requests, market maker responses, and order fills.

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
const { RFQManager } = require('./src/index');

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

### Run the Example

```bash
node example.js
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
- Manages quote acceptance
- Auto-expires old RFQs
- Provides system statistics

## 🎓 Key Features

- ✅ **Two workflows** - 3-step (manual) or 2-step (auto-accept) ⭐ NEW
- ✅ **Full validation** - Input validation at all levels
- ✅ **Expiration handling** - Automatic RFQ expiration
- ✅ **Multiple quotes** - Multiple makers can quote same RFQ
- ✅ **Buy/Sell support** - Handles both directions
- ✅ **Status tracking** - Open, filled, expired, cancelled
- ✅ **TypeScript** - Full type safety with strict mode
- ✅ **Comprehensive tests** - 117 tests with 95%+ coverage

## 📖 Documentation

See [DESIGN.md](./DESIGN.md) for detailed architecture and design decisions.

## 🏗️ Project Structure

```
.
├── src/
│   ├── RFQ.js              # RFQ model
│   ├── RFQ.test.js         # RFQ tests
│   ├── Quote.js            # Quote model
│   ├── Quote.test.js       # Quote tests
│   ├── RFQQueue.js         # Queue manager
│   ├── RFQQueue.test.js    # Queue tests
│   ├── RFQManager.js       # Main orchestrator
│   ├── RFQManager.test.js  # Manager tests
│   ├── integration.test.js # E2E tests
│   └── index.js            # Main entry point
├── DESIGN.md               # Architecture documentation
├── example.js              # Usage examples
├── package.json
├── jest.config.js
└── README.md
```

## 🧠 Learning Points

This project demonstrates:
1. **Object-oriented design** - Classes with clear responsibilities
2. **Data validation** - Input validation and error handling
3. **State management** - RFQ lifecycle and status transitions
4. **Testing strategies** - Unit, integration, and E2E tests
5. **In-memory storage** - Using Maps and Sets effectively
6. **Business logic** - Trading workflow implementation

## 🔮 Future Enhancements

Potential additions for learning:
- Persistent storage (database integration)
- WebSocket for real-time updates
- Authentication and authorization
- Partial fills
- Quote amendments
- Order matching algorithms
- REST API layer
- Web UI

## 📝 License

MIT
