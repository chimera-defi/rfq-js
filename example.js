/**
 * RFQ System - Example Usage
 * 
 * This example demonstrates how to use the RFQ system
 */

const { RFQManager } = require('./src/index');

// Create a new RFQ manager
const manager = new RFQManager();

console.log('=== RFQ System Example ===\n');

// Step 1: Taker creates an RFQ to buy Bitcoin
console.log('Step 1: Taker wants to buy 10 BTC');
const btcRfq = manager.createRFQ(
  'BTC/USD',    // market
  'buy',        // direction
  10,           // amount
  300000        // expires in 5 minutes (300,000 ms)
);
console.log(`Created RFQ: ${btcRfq.id}`);
console.log(`  Market: ${btcRfq.market}`);
console.log(`  Direction: ${btcRfq.direction}`);
console.log(`  Amount: ${btcRfq.amount}`);
console.log(`  Status: ${btcRfq.status}\n`);

// Step 2: Market makers submit quotes
console.log('Step 2: Market makers submit competitive quotes');

const quote1 = manager.submitQuote(btcRfq.id, 'maker_alice', 50100);
console.log(`  Alice quotes: $${quote1.pricePerToken} per BTC`);

const quote2 = manager.submitQuote(btcRfq.id, 'maker_bob', 49950);
console.log(`  Bob quotes: $${quote2.pricePerToken} per BTC`);

const quote3 = manager.submitQuote(btcRfq.id, 'maker_charlie', 50025);
console.log(`  Charlie quotes: $${quote3.pricePerToken} per BTC\n`);

// Step 3: Taker reviews quotes
console.log('Step 3: Taker reviews all quotes');
const rfqDetails = manager.getRFQDetails(btcRfq.id);
console.log(`  RFQ has ${rfqDetails.quotes.length} quotes:`);
rfqDetails.quotes.forEach(q => {
  console.log(`    - ${q.makerId}: $${q.pricePerToken}`);
});

// Find best quote (lowest price for buy order)
const bestQuote = rfqDetails.quotes.reduce((best, current) => 
  current.pricePerToken < best.pricePerToken ? current : best
);
console.log(`  Best quote: ${bestQuote.makerId} at $${bestQuote.pricePerToken}\n`);

// Step 4: Taker accepts the best quote
console.log('Step 4: Taker accepts the best quote');
const result = manager.acceptQuote(btcRfq.id, bestQuote.id);
console.log(`  RFQ filled!`);
console.log(`  Selected maker: ${result.quote.makerId}`);
console.log(`  Final price: $${result.quote.pricePerToken}`);
console.log(`  Total cost: $${result.quote.pricePerToken * btcRfq.amount}\n`);

// Show system statistics
console.log('System Statistics:');
const stats = manager.getStats();
console.log(`  Total RFQs: ${stats.totalRFQs}`);
console.log(`  Total Quotes: ${stats.totalQuotes}`);
console.log(`  Open RFQs: ${stats.rfqsByStatus.open}`);
console.log(`  Filled RFQs: ${stats.rfqsByStatus.filled}`);
console.log(`  Expired RFQs: ${stats.rfqsByStatus.expired}\n`);

// Example 2: Multiple concurrent RFQs
console.log('=== Example 2: Multiple Markets ===\n');

const ethRfq = manager.createRFQ('ETH/USD', 'sell', 100, 300000);
console.log(`Created ETH RFQ: ${ethRfq.market} ${ethRfq.direction} ${ethRfq.amount}`);

manager.submitQuote(ethRfq.id, 'maker_alice', 3050);
manager.submitQuote(ethRfq.id, 'maker_bob', 3060);

const solRfq = manager.createRFQ('SOL/USD', 'buy', 1000, 300000);
console.log(`Created SOL RFQ: ${solRfq.market} ${solRfq.direction} ${solRfq.amount}\n`);

manager.submitQuote(solRfq.id, 'maker_charlie', 105.5);

// Show all open RFQs
console.log('All Open RFQs:');
const openRFQs = manager.getOpenRFQs();
openRFQs.forEach(details => {
  console.log(`  ${details.rfq.market} ${details.rfq.direction} ${details.rfq.amount}`);
  console.log(`    ${details.quotes.length} quote(s) available`);
});

console.log('\n=== Example Complete ===');
