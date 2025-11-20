# RFQ System (JavaScript)

A simple, in-memory Request for Quote (RFQ) system built in JavaScript. This learning project demonstrates how trading systems handle quote requests, market maker responses, and order fills.

## 🎯 Overview

The RFQ system allows:
- **Takers** to create RFQs requesting quotes for trades
- **Makers** to respond with competitive price quotes
- **Takers** to select and accept the best quote
- Automatic expiration of old RFQs
- In-memory tracking of all RFQs and quotes

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

### Basic Example

```javascript
const { RFQManager } = require('./src/index');

// Create RFQ manager
const manager = new RFQManager();

// Taker creates an RFQ to buy 10 BTC (expires in 5 minutes)
const rfq = manager.createRFQ('BTC/USD', 'buy', 10, 300000);

// Makers submit quotes
const quote1 = manager.submitQuote(rfq.id, 'maker_alice', 50000);
const quote2 = manager.submitQuote(rfq.id, 'maker_bob', 49500);

// Taker reviews quotes
const details = manager.getRFQDetails(rfq.id);
console.log(`Received ${details.quotes.length} quotes`);

// Taker accepts best quote
const result = manager.acceptQuote(rfq.id, quote2.id);
console.log(`Filled at $${result.quote.pricePerToken}`);
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

- ✅ **Full validation** - Input validation at all levels
- ✅ **Expiration handling** - Automatic RFQ expiration
- ✅ **Multiple quotes** - Multiple makers can quote same RFQ
- ✅ **Buy/Sell support** - Handles both directions
- ✅ **Status tracking** - Open, filled, expired, cancelled
- ✅ **Comprehensive tests** - 95+ tests with full coverage

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
