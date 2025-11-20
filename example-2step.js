/**
 * Example demonstrating both 3-step and 2-step RFQ workflows
 */

const { RFQManager } = require('./dist/index');

console.log('='.repeat(60));
console.log('RFQ System - 3-Step vs 2-Step Comparison');
console.log('='.repeat(60));

const manager = new RFQManager();

// ============================================================
// EXAMPLE 1: 3-Step Process (Traditional/Manual)
// ============================================================
console.log('\n📋 EXAMPLE 1: 3-Step Process (Manual Selection)\n');

console.log('Step 1: Create RFQ');
const rfq3step = manager.createRFQ('BTC/USD', 'buy', 10, 300000);
console.log(`  ✓ Created RFQ ${rfq3step.id}`);
console.log(`  ✓ Status: ${rfq3step.status}`);

console.log('\nStep 2: Makers submit quotes');
manager.submitQuote(rfq3step.id, 'maker_alice', 50100);
console.log(`  ✓ Alice quoted: $50,100`);
manager.submitQuote(rfq3step.id, 'maker_bob', 49900);
console.log(`  ✓ Bob quoted: $49,900`);
manager.submitQuote(rfq3step.id, 'maker_charlie', 50050);
console.log(`  ✓ Charlie quoted: $50,050`);

console.log('\nStep 3: Taker reviews and selects best quote');
const details3step = manager.getRFQDetails(rfq3step.id);
console.log(`  ✓ Reviewing ${details3step.quotes.length} quotes...`);

// Find best quote (lowest for buy)
const bestQuote = details3step.quotes.reduce((best, q) => 
  q.pricePerToken < best.pricePerToken ? q : best
);

console.log(`  ✓ Best quote: ${bestQuote.makerId} at $${bestQuote.pricePerToken.toLocaleString()}`);

manager.acceptQuote(rfq3step.id, bestQuote.id);
console.log(`  ✅ Filled at $${bestQuote.pricePerToken.toLocaleString()}`);
console.log(`  ✅ Total cost: $${(bestQuote.pricePerToken * 10).toLocaleString()}`);

// ============================================================
// EXAMPLE 2: 2-Step Process (Auto-Accept)
// ============================================================
console.log('\n\n⚡ EXAMPLE 2: 2-Step Process (Auto-Accept)\n');

console.log('Step 1: Create RFQ with auto-accept enabled');
const rfq2step = manager.createRFQ('ETH/USD', 'sell', 100, 300000, {
  enabled: true,
  minQuotes: 3
});
console.log(`  ✓ Created RFQ ${rfq2step.id}`);
console.log(`  ✓ Auto-accept: enabled (min 3 quotes)`);
console.log(`  ✓ Status: ${rfq2step.status}`);

console.log('\nStep 2: Makers submit quotes (auto-filled when condition met)');
manager.submitQuote(rfq2step.id, 'maker_alice', 3050);
console.log(`  ✓ Alice quoted: $3,050 - Status: ${rfq2step.status}`);

manager.submitQuote(rfq2step.id, 'maker_bob', 3100);
console.log(`  ✓ Bob quoted: $3,100 - Status: ${rfq2step.status}`);

manager.submitQuote(rfq2step.id, 'maker_charlie', 3075);
console.log(`  ✓ Charlie quoted: $3,075 - Status: ${rfq2step.status}`);

console.log('\n  ✅ Automatically filled!');
const details2step = manager.getRFQDetails(rfq2step.id);
const selectedQuote = details2step.quotes.find(q => q.id === rfq2step.selectedQuoteId);
console.log(`  ✅ Selected: ${selectedQuote.makerId} at $${selectedQuote.pricePerToken.toLocaleString()}`);
console.log(`  ✅ Total proceeds: $${(selectedQuote.pricePerToken * 100).toLocaleString()}`);
console.log('  💡 No manual selection needed!');

// ============================================================
// EXAMPLE 3: Fast Execution with Minimum Quotes
// ============================================================
console.log('\n\n🚀 EXAMPLE 3: Fast Execution (Auto-accept with 2 quotes)\n');

const rfqFast = manager.createRFQ('SOL/USD', 'buy', 1000, 300000, {
  enabled: true,
  minQuotes: 2  // Quick execution
});
console.log(`Created RFQ for 1,000 SOL (auto-accept after 2 quotes)`);

manager.submitQuote(rfqFast.id, 'maker_alice', 105.50);
console.log(`  Quote 1: $105.50 - Status: ${rfqFast.status}`);

manager.submitQuote(rfqFast.id, 'maker_bob', 104.75);
console.log(`  Quote 2: $104.75 - Status: ${rfqFast.status}`);

console.log(`  ✅ Instantly filled at $104.75!`);
console.log(`  ✅ Total cost: $${(104.75 * 1000).toLocaleString()}`);

// ============================================================
// Summary
// ============================================================
console.log('\n\n' + '='.repeat(60));
console.log('Summary');
console.log('='.repeat(60));

const stats = manager.getStats();
console.log(`\nTotal RFQs created: ${stats.totalRFQs}`);
console.log(`Total quotes received: ${stats.totalQuotes}`);
console.log(`Filled RFQs: ${stats.filledRFQs}`);
console.log(`Open RFQs: ${stats.openRFQs}`);

console.log('\n📊 Comparison:');
console.log('┌─────────────────┬────────────┬──────────────┐');
console.log('│ Feature         │ 3-Step     │ 2-Step       │');
console.log('├─────────────────┼────────────┼──────────────┤');
console.log('│ Steps required  │ 3          │ 2            │');
console.log('│ Manual review   │ Yes        │ No           │');
console.log('│ Speed           │ Slower     │ Faster ⚡    │');
console.log('│ Control         │ Full       │ Automated    │');
console.log('│ Best for        │ Complex    │ Quick trades │');
console.log('└─────────────────┴────────────┴──────────────┘');

console.log('\n✨ Both workflows available in the same system!');
console.log('   Choose based on your trading needs.\n');
