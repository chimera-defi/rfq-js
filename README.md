# RFQ System (JavaScript)

A simple Request for Quote (RFQ) system built in JavaScript for learning purposes.

## Overview

This system allows:
- **Takers** to create RFQs (Request for Quotes) to buy or sell tokens
- **Makers** to respond with quotes offering prices
- **Takers** to select winning quotes
- **Queue** tracking of all RFQ and quote activities

## Features

- In-memory storage (no database required)
- RFQ lifecycle management (create, expire, cancel)
- Quote management and acceptance
- Event queue tracking
- Comprehensive test suite with Jest

## Project Structure

```
/workspace
├── src/              # Source code
│   ├── models/      # Data models (RFQ, Quote, QueueEntry)
│   ├── managers/    # Core managers (RFQManager, QuoteManager, QueueManager)
│   └── RFQSystem.js # Main system orchestrator
├── __tests__/        # Test files
├── DESIGN.md         # Design document and specifications
├── TASKS.md          # Implementation task list
└── package.json      # Dependencies and scripts
```

## Getting Started

### Installation

```bash
npm install
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

(To be updated as implementation progresses)

## Design

See [DESIGN.md](./DESIGN.md) for detailed system design and specifications.

## Tasks

See [TASKS.md](./TASKS.md) for the implementation task list and progress tracking.
