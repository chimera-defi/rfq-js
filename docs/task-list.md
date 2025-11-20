# RFQ System Implementation Plan

## 1. Scaffolding & Utilities
1. Create `src/clock.js` with interface + default implementation and exportable factory for fake clocks in tests.
2. Create `src/eventQueue.js` implementing a FIFO queue with `enqueue`, `peek`, `drain`, and `size`.

## 2. Data Stores
1. Implement `src/rfqRepository.js` to manage RFQs, quotes, and fills using in-memory maps.
   - Methods: `saveRfq`, `getRfq`, `listOpenRfqs`, `saveQuote`, `listQuotes`, `saveFill`, `listFills`, `setStatus`.
2. Include lightweight validation helpers within repository (e.g., check duplicates).

## 3. Business Logic Service
1. Implement `src/rfqService.js` that composes the clock, repository, and queue.
2. Expose operations outlined in the design doc:
   - `createRfq`
   - `submitQuote`
   - `selectQuote`
   - `expireRfq`
   - `getOpenRfqs`, `getQuotes`, `getFills`
3. Add helper `ensureRfqCurrent` that lazily expires RFQs before actions.

## 4. Testing
1. Configure Jest setup (if necessary) and create `__tests__` directory.
2. Write unit tests per module:
   - `clock.test.js` (fake clock behavior).
   - `eventQueue.test.js`.
   - `rfqRepository.test.js`.
   - `rfqService.test.js` covering happy paths and edge cases (duplicates, expiration, fill flow, queue events).
3. Provide shared test fixtures (e.g., `test/utils.js`) for deterministic IDs and timestamps.

## 5. Example Usage
1. Add `examples/demo.js` that wires modules together, simulates a basic flow, and logs queue events.
2. Document how to run the demo in `README.md`.

## 6. CI / Scripts
1. Update `package.json` scripts with `lint` placeholder (optional) and ensure `npm test` passes without warnings.
2. Consider adding `npm run demo` for the usage example.

## 7. Documentation
1. Update `README.md` with overview, architecture summary, and instructions for running tests and the demo.
2. Link to the design doc and task list for future contributors.

