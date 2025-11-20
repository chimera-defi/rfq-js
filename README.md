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
- Comprehensive test suite with Jest (123 tests, 97%+ coverage)

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
├── __tests__/        # Test files
├── tsconfig.json     # TypeScript configuration
├── DESIGN.md         # Design document and specifications
├── TASKS.md          # Implementation task list
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

### TypeScript/ES Modules

```typescript
import { RFQSystem, type RFQDirection } from './src';

// Create a new RFQ system instance
const system = new RFQSystem();

// Step 1: Taker creates an RFQ
const expiration = Date.now() + 3600000; // 1 hour from now
const rfq = system.createRFQ(
  'rfq-001',           // RFQ ID
  'ETH/USD',           // Market
  'buy' as RFQDirection, // Direction: 'buy' or 'sell'
  100,                 // Amount
  expiration           // Expiration timestamp
);
```

### JavaScript/CommonJS

```javascript
const { RFQSystem } = require('./dist');

// Create a new RFQ system instance
const system = new RFQSystem();

// Step 1: Taker creates an RFQ
const expiration = Date.now() + 3600000; // 1 hour from now
const rfq = system.createRFQ(
  'rfq-001',           // RFQ ID
  'ETH/USD',           // Market
  'buy',               // Direction: 'buy' or 'sell'
  100,                 // Amount
  expiration           // Expiration timestamp
);

console.log('Created RFQ:', rfq);
// Output: { rfqId: 'rfq-001', market: 'ETH/USD', direction: 'buy', ... }

// Step 2: Makers add quotes
const quote1 = system.addQuote('quote-001', 'rfq-001', 2500.50, 'maker1');
const quote2 = system.addQuote('quote-002', 'rfq-001', 2501.00, 'maker2');
const quote3 = system.addQuote('quote-003', 'rfq-001', 2499.75, 'maker3');

console.log('Quotes for RFQ:', system.getQuotesForRFQ('rfq-001'));
// Output: Array of 3 quotes

// Step 3: Taker accepts the best quote
const result = system.acceptQuote('quote-003'); // Accept the lowest price
console.log('Accepted quote:', result.quote);
console.log('RFQ status:', result.rfq.status); // 'filled'

// View queue activity
const activity = system.getRecentActivity(10);
console.log('Recent activity:', activity);
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

## Design

See [DESIGN.md](./DESIGN.md) for detailed system design and specifications.

## Tasks

See [TASKS.md](./TASKS.md) for the implementation task list and progress tracking.
