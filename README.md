# RFQ System (TypeScript/JavaScript)

A simple Request for Quote (RFQ) system built in TypeScript for learning purposes. Fully typed with comprehensive type definitions.

## Overview

This system allows:
- **Takers** to create RFQs (Request for Quotes) to buy or sell tokens
- **Makers** to respond with quotes offering prices
- **Takers** to select winning quotes
- **Queue** tracking of all RFQ and quote activities

## Features

- **TypeScript** - Fully typed with comprehensive type definitions
- In-memory storage (no database required)
- RFQ lifecycle management (create, expire, cancel)
- Quote management and acceptance
- Event queue tracking
- Comprehensive test suite with Jest (127 tests, 97%+ coverage)

## Project Structure

```
/workspace
├── src/              # TypeScript source code
│   ├── models/      # Data models (RFQ, Quote, QueueEntry)
│   ├── managers/    # Core managers (RFQManager, QuoteManager, QueueManager)
│   ├── utils/       # Utility functions (validators)
│   ├── RFQSystem.ts  # Main system orchestrator
│   └── index.ts     # Main entry point
├── dist/             # Compiled JavaScript output (generated)
├── docs/             # Documentation
│   ├── DESIGN.md    # System design and specifications
│   ├── ACTOR_MODEL.md # Actor model documentation
│   └── ...          # Additional documentation files
├── __tests__/        # Test files
├── tsconfig.json     # TypeScript configuration
└── package.json      # Dependencies and scripts
```

## Getting Started

### Installation

```bash
npm install
```

### Building

```bash
# Build TypeScript to JavaScript
npm run build

# Build in watch mode
npm run build:watch

# Type check without building
npm run type-check
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Usage

### Actor Model

The system has two types of actors:

- **Takers**: Create RFQs and accept quotes
- **Makers**: Add quotes to RFQs

See [docs/ACTOR_MODEL.md](./docs/ACTOR_MODEL.md) for detailed documentation.

### Standard Workflow

The standard workflow is a **3-step process** involving both actors:

1. **Taker** creates an RFQ (`createRFQ`)
2. **Makers** add quotes (`addQuote`)
3. **Taker** accepts a quote (`acceptQuote`)

### TypeScript/ES Modules

```typescript
import { RFQSystem, type RFQDirection } from './src';

const system = new RFQSystem();
const expiration = Date.now() + 3600000;

// Step 1: Taker creates an RFQ
const rfq = system.createRFQ('rfq-001', 'ETH/USD', 'buy', 100, expiration);

// Step 2: Makers add quotes (typically done by different makers)
system.addQuote('quote-001', 'rfq-001', 2500.50, 'maker1');
system.addQuote('quote-002', 'rfq-001', 2501.00, 'maker2');
system.addQuote('quote-003', 'rfq-001', 2499.75, 'maker3');

// Step 3: Taker accepts the best quote
const result = system.acceptQuote('quote-003'); // Accept the lowest price
console.log('Accepted quote:', result.quote);
console.log('RFQ status:', result.rfq.status); // 'filled'
```

### JavaScript/CommonJS

```javascript
const { RFQSystem } = require('./dist');
const system = new RFQSystem();
const expiration = Date.now() + 3600000;

// Step 1: Taker creates RFQ
const rfq = system.createRFQ('rfq-001', 'ETH/USD', 'buy', 100, expiration);

// Step 2: Makers add quotes
system.addQuote('quote-001', 'rfq-001', 2500.50, 'maker1');
system.addQuote('quote-002', 'rfq-001', 2501.00, 'maker2');

// Step 3: Taker accepts quote
const result = system.acceptQuote('quote-001');
```

### Advanced Usage

```javascript
// Get all open RFQs
const openRFQs = system.getAllRFQs({ status: 'open' });

// Filter RFQs by market
const ethRFQs = system.getAllRFQs({ market: 'ETH/USD' });

// Filter RFQs by direction
const buyRFQs = system.getAllRFQs({ direction: 'buy' });

// Get queue entries for a specific RFQ
const rfqActivity = system.getQueueEntries({ rfqId: 'rfq-001' });

// Check for expired RFQs
const expiredRFQs = system.checkExpirations();

// Cancel an RFQ
const cancelledRFQ = system.cancelRFQ('rfq-001');

// Get system statistics
const stats = system.getStats();
console.log(stats);
// Output: { totalRFQs: 5, totalQuotes: 12, openRFQs: 3, ... }
```

### Error Handling

```javascript
try {
  // This will throw an error if RFQ doesn't exist
  system.addQuote('quote-001', 'nonexistent-rfq', 100.0);
} catch (error) {
  console.error('Error:', error.message);
  // Output: Error: RFQ with ID "nonexistent-rfq" not found
}

try {
  // This will throw an error if RFQ is expired
  const pastExpiration = Date.now() - 1000;
  const rfq = system.createRFQ('rfq-001', 'ETH/USD', 'buy', 100, pastExpiration);
} catch (error) {
  console.error('Error:', error.message);
  // Output: Error: Expiration must be a future timestamp
}
```

## Documentation

- **[Design Document](./docs/DESIGN.md)** - System design and specifications
- **[Actor Model](./docs/ACTOR_MODEL.md)** - Detailed actor documentation (Takers vs Makers)
- **[TypeScript Integration](./docs/TYPESCRIPT_INTEGRATION.md)** - TypeScript setup and usage
- **[Code Review](./docs/CODE_REVIEW.md)** - Comprehensive code review
- **[PR Improvements](./docs/PR_IMPROVEMENTS.md)** - Improvements adopted from PR #3
- **[Tasks](./docs/TASKS.md)** - Implementation task list and progress

For reviews and summaries, see the [docs](./docs/) directory.
