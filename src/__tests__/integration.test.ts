/**
 * Integration Tests
 * End-to-end tests for the complete RFQ system
 */

import { RFQManager } from '../RFQManager';

describe('RFQ System - Integration Tests', () => {
  let manager: RFQManager;

  beforeEach(() => {
    manager = new RFQManager();
  });

  describe('Basic RFQ Flow', () => {
    test('should handle a complete RFQ lifecycle from creation to fill', () => {
      // Step 1: Taker creates an RFQ
      const rfq = manager.createRFQ('BTC/USD', 'buy', 10, 60000);
      
      expect(rfq).toBeDefined();
      expect(rfq.status).toBe('open');
      expect(rfq.market).toBe('BTC/USD');
      expect(rfq.direction).toBe('buy');
      expect(rfq.amount).toBe(10);
      
      // Step 2: Multiple makers respond with quotes
      const quote1 = manager.submitQuote(rfq.id, 'maker_alice', 50000);
      const quote2 = manager.submitQuote(rfq.id, 'maker_bob', 49800);
      const quote3 = manager.submitQuote(rfq.id, 'maker_charlie', 50100);
      
      expect(quote1.pricePerToken).toBe(50000);
      expect(quote2.pricePerToken).toBe(49800);
      expect(quote3.pricePerToken).toBe(50100);
      
      // Step 3: Verify all quotes are visible
      const rfqDetails = manager.getRFQDetails(rfq.id);
      expect(rfqDetails).toBeDefined();
      expect(rfqDetails!.quotes).toHaveLength(3);
      
      // Step 4: Taker selects the best quote (lowest price for buy order)
      const result = manager.acceptQuote(rfq.id, quote2.id);
      
      expect(result.rfq.status).toBe('filled');
      expect(result.rfq.selectedQuoteId).toBe(quote2.id);
      expect(result.quote.makerId).toBe('maker_bob');
      expect(result.quote.pricePerToken).toBe(49800);
      
      // Step 5: Verify the RFQ is no longer open
      const openRFQs = manager.getOpenRFQs();
      expect(openRFQs).toHaveLength(0);
    });
  });

  describe('Multiple Concurrent RFQs', () => {
    test('should handle multiple RFQs for different markets', () => {
      // Create RFQs for different markets
      const btcRfq = manager.createRFQ('BTC/USD', 'buy', 10, 60000);
      const ethRfq = manager.createRFQ('ETH/USD', 'sell', 100, 60000);
      const solRfq = manager.createRFQ('SOL/USD', 'buy', 500, 60000);
      
      // Submit quotes for BTC RFQ
      manager.submitQuote(btcRfq.id, 'maker_alice', 50000);
      manager.submitQuote(btcRfq.id, 'maker_bob', 49900);
      
      // Submit quotes for ETH RFQ
      manager.submitQuote(ethRfq.id, 'maker_alice', 3000);
      manager.submitQuote(ethRfq.id, 'maker_charlie', 3010);
      manager.submitQuote(ethRfq.id, 'maker_bob', 2990);
      
      // Submit quote for SOL RFQ
      manager.submitQuote(solRfq.id, 'maker_charlie', 100);
      
      // Verify each RFQ has correct quotes
      expect(manager.getRFQDetails(btcRfq.id)!.quotes).toHaveLength(2);
      expect(manager.getRFQDetails(ethRfq.id)!.quotes).toHaveLength(3);
      expect(manager.getRFQDetails(solRfq.id)!.quotes).toHaveLength(1);
      
      // Fill some RFQs
      const btcQuote = manager.getRFQDetails(btcRfq.id)!.quotes[1];
      manager.acceptQuote(btcRfq.id, btcQuote.id);
      
      const ethQuote = manager.getRFQDetails(ethRfq.id)!.quotes[2];
      manager.acceptQuote(ethRfq.id, ethQuote.id);
      
      // Verify only SOL RFQ is still open
      const openRFQs = manager.getOpenRFQs();
      expect(openRFQs).toHaveLength(1);
      expect(openRFQs[0].rfq.market).toBe('SOL/USD');
      
      // Verify stats
      const stats = manager.getStats();
      expect(stats.totalRFQs).toBe(3);
      expect(stats.totalQuotes).toBe(6);
      expect(stats.rfqsByStatus.open).toBe(1);
      expect(stats.rfqsByStatus.filled).toBe(2);
    });
  });

  describe('Buy vs Sell Direction', () => {
    test('should handle both buy and sell RFQs correctly', () => {
      // Buy RFQ - taker wants to buy, makers quote selling price
      const buyRfq = manager.createRFQ('BTC/USD', 'buy', 5, 60000);
      manager.submitQuote(buyRfq.id, 'maker1', 50000); // Maker willing to sell at 50000
      manager.submitQuote(buyRfq.id, 'maker2', 49500); // Better price for buyer
      
      // Sell RFQ - taker wants to sell, makers quote buying price
      const sellRfq = manager.createRFQ('ETH/USD', 'sell', 50, 60000);
      manager.submitQuote(sellRfq.id, 'maker1', 3000); // Maker willing to buy at 3000
      manager.submitQuote(sellRfq.id, 'maker2', 3100); // Better price for seller
      
      // Verify directions are preserved
      const buyDetails = manager.getRFQDetails(buyRfq.id);
      expect(buyDetails).toBeDefined();
      expect(buyDetails!.rfq.direction).toBe('buy');
      expect(buyDetails!.quotes).toHaveLength(2);
      
      const sellDetails = manager.getRFQDetails(sellRfq.id);
      expect(sellDetails).toBeDefined();
      expect(sellDetails!.rfq.direction).toBe('sell');
      expect(sellDetails!.quotes).toHaveLength(2);
    });
  });

  describe('RFQ Expiration', () => {
    test('should prevent quoting on expired RFQs', async () => {
      // Create RFQ with short expiration
      const rfq = manager.createRFQ('BTC/USD', 'buy', 10, 20);
      
      // Quote before expiration should work
      const quote = manager.submitQuote(rfq.id, 'maker1', 50000);
      expect(quote).toBeDefined();
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 30));
      
      // Quote after expiration should fail
      expect(() => manager.submitQuote(rfq.id, 'maker2', 49000))
        .toThrow();
      
      // Verify RFQ is expired
      manager.expireOldRFQs();
      const details = manager.getRFQDetails(rfq.id);
      expect(details).toBeDefined();
      expect(details!.rfq.status).toBe('expired');
    });

    test('should prevent accepting quotes on expired RFQs', async () => {
      // Create RFQ with short expiration
      const rfq = manager.createRFQ('BTC/USD', 'buy', 10, 20);
      const quote = manager.submitQuote(rfq.id, 'maker1', 50000);
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 30));
      
      // Cannot accept quote after expiration
      expect(() => manager.acceptQuote(rfq.id, quote.id))
        .toThrow();
    });

    test('should automatically expire old RFQs when creating new ones', async () => {
      // Create RFQ with short expiration
      const oldRfq = manager.createRFQ('BTC/USD', 'buy', 10, 20);
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 30));
      
      // Create new RFQ (should trigger expiration check)
      manager.createRFQ('ETH/USD', 'sell', 50, 60000);
      
      // Verify old RFQ is expired
      const details = manager.getRFQDetails(oldRfq.id);
      expect(details).toBeDefined();
      expect(details!.rfq.status).toBe('expired');
    });
  });

  describe('Error Handling', () => {
    test('should prevent double-filling an RFQ', () => {
      const rfq = manager.createRFQ('BTC/USD', 'buy', 10, 60000);
      const quote1 = manager.submitQuote(rfq.id, 'maker1', 50000);
      const quote2 = manager.submitQuote(rfq.id, 'maker2', 49000);
      
      // First fill should work
      manager.acceptQuote(rfq.id, quote1.id);
      
      // Second fill should fail
      expect(() => manager.acceptQuote(rfq.id, quote2.id))
        .toThrow();
    });

    test('should prevent quoting on filled RFQ', () => {
      const rfq = manager.createRFQ('BTC/USD', 'buy', 10, 60000);
      const quote = manager.submitQuote(rfq.id, 'maker1', 50000);
      
      // Fill the RFQ
      manager.acceptQuote(rfq.id, quote.id);
      
      // New quote should fail
      expect(() => manager.submitQuote(rfq.id, 'maker2', 49000))
        .toThrow();
    });

    test('should handle non-existent RFQ gracefully', () => {
      expect(() => manager.submitQuote('nonexistent', 'maker1', 50000))
        .toThrow('RFQ with id nonexistent not found');
      
      expect(() => manager.acceptQuote('nonexistent', 'quote1'))
        .toThrow('RFQ with id nonexistent not found');
      
      expect(manager.getRFQDetails('nonexistent')).toBeNull();
    });

    test('should prevent accepting quote from different RFQ', () => {
      const rfq1 = manager.createRFQ('BTC/USD', 'buy', 10, 60000);
      const rfq2 = manager.createRFQ('ETH/USD', 'sell', 50, 60000);
      
      const quote = manager.submitQuote(rfq2.id, 'maker1', 3000);
      
      // Try to accept quote from rfq2 for rfq1
      expect(() => manager.acceptQuote(rfq1.id, quote.id))
        .toThrow();
    });
  });

  describe('Market Maker Competition', () => {
    test('should allow competitive pricing from multiple makers', () => {
      const rfq = manager.createRFQ('BTC/USD', 'buy', 10, 60000);
      
      // Makers compete with progressively better prices
      manager.submitQuote(rfq.id, 'maker_alice', 50000);
      manager.submitQuote(rfq.id, 'maker_bob', 49900);
      manager.submitQuote(rfq.id, 'maker_charlie', 49800);
      manager.submitQuote(rfq.id, 'maker_david', 49750);
      
      const details = manager.getRFQDetails(rfq.id);
      expect(details).toBeDefined();
      expect(details!.quotes).toHaveLength(4);
      
      // Find the best price (lowest for buy)
      const bestQuote = details!.quotes.reduce((best, current) => 
        current.pricePerToken < best.pricePerToken ? current : best
      );
      
      expect(bestQuote.pricePerToken).toBe(49750);
      expect(bestQuote.makerId).toBe('maker_david');
    });
  });

  describe('Large Volume Scenario', () => {
    test('should handle many RFQs and quotes efficiently', () => {
      const numRFQs = 50;
      const quotesPerRFQ = 5;
      
      // Create many RFQs
      const rfqs = [];
      for (let i = 0; i < numRFQs; i++) {
        const market = i % 2 === 0 ? 'BTC/USD' : 'ETH/USD';
        const direction = i % 3 === 0 ? 'buy' : 'sell';
        const rfq = manager.createRFQ(market, direction, 100, 60000);
        rfqs.push(rfq);
      }
      
      // Submit quotes for each RFQ
      rfqs.forEach((rfq, i) => {
        for (let j = 0; j < quotesPerRFQ; j++) {
          const makerId = `maker_${j}`;
          const price = 50000 + (i * 10) + j;
          manager.submitQuote(rfq.id, makerId, price);
        }
      });
      
      // Fill some RFQs (every 3rd one)
      rfqs.forEach((rfq, i) => {
        if (i % 3 === 0) {
          const details = manager.getRFQDetails(rfq.id);
          manager.acceptQuote(rfq.id, details!.quotes[0].id);
        }
      });
      
      // Verify stats
      const stats = manager.getStats();
      expect(stats.totalRFQs).toBe(numRFQs);
      expect(stats.totalQuotes).toBe(numRFQs * quotesPerRFQ);
      
      const expectedFilled = Math.ceil(numRFQs / 3);
      expect(stats.rfqsByStatus.filled).toBe(expectedFilled);
      
      const openRFQs = manager.getOpenRFQs();
      expect(openRFQs.length).toBe(numRFQs - expectedFilled);
    });
  });

  describe('Real-world Trading Scenario', () => {
    test('should simulate realistic trading workflow', () => {
      console.log('\n=== Simulating Real Trading Scenario ===\n');
      
      // Scenario: Multiple takers and makers trading different assets
      
      // Taker 1: Wants to buy 5 BTC
      console.log('Taker 1: Creating RFQ to buy 5 BTC');
      const btcBuyRfq = manager.createRFQ('BTC/USD', 'buy', 5, 120000);
      
      // Market makers respond
      console.log('Makers responding with quotes...');
      manager.submitQuote(btcBuyRfq.id, 'citadel_mm', 50100);
      manager.submitQuote(btcBuyRfq.id, 'jane_street_mm', 50050);
      manager.submitQuote(btcBuyRfq.id, 'jump_trading_mm', 50025);
      
      // Taker 2: Wants to sell 100 ETH
      console.log('Taker 2: Creating RFQ to sell 100 ETH');
      const ethSellRfq = manager.createRFQ('ETH/USD', 'sell', 100, 120000);
      
      // Market makers respond
      console.log('Makers responding with quotes...');
      manager.submitQuote(ethSellRfq.id, 'citadel_mm', 3050);
      manager.submitQuote(ethSellRfq.id, 'jane_street_mm', 3060);
      manager.submitQuote(ethSellRfq.id, 'tower_research_mm', 3055);
      
      // Taker 3: Wants to buy 1000 SOL
      console.log('Taker 3: Creating RFQ to buy 1000 SOL');
      const solBuyRfq = manager.createRFQ('SOL/USD', 'buy', 1000, 120000);
      
      manager.submitQuote(solBuyRfq.id, 'jump_trading_mm', 105.5);
      manager.submitQuote(solBuyRfq.id, 'tower_research_mm', 105.2);
      
      // Show all open RFQs
      console.log('\nAll open RFQs:');
      const openRFQs = manager.getOpenRFQs();
      openRFQs.forEach(details => {
        console.log(`  ${details.rfq.market} ${details.rfq.direction} ${details.rfq.amount} - ${details.quotes.length} quotes`);
      });
      
      // Takers select best quotes
      console.log('\nTakers selecting quotes...');
      
      const btcDetails = manager.getRFQDetails(btcBuyRfq.id);
      const bestBtcQuote = btcDetails!.quotes.reduce((best, q) => 
        q.pricePerToken < best.pricePerToken ? q : best
      );
      console.log(`Taker 1 selects ${bestBtcQuote.makerId} at ${bestBtcQuote.pricePerToken}`);
      manager.acceptQuote(btcBuyRfq.id, bestBtcQuote.id);
      
      const ethDetails = manager.getRFQDetails(ethSellRfq.id);
      const bestEthQuote = ethDetails!.quotes.reduce((best, q) => 
        q.pricePerToken > best.pricePerToken ? q : best
      );
      console.log(`Taker 2 selects ${bestEthQuote.makerId} at ${bestEthQuote.pricePerToken}`);
      manager.acceptQuote(ethSellRfq.id, bestEthQuote.id);
      
      // Verify final state
      const stats = manager.getStats();
      console.log('\nFinal Statistics:');
      console.log(`  Total RFQs: ${stats.totalRFQs}`);
      console.log(`  Total Quotes: ${stats.totalQuotes}`);
      console.log(`  Filled: ${stats.rfqsByStatus.filled}`);
      console.log(`  Open: ${stats.rfqsByStatus.open}`);
      
      expect(stats.totalRFQs).toBe(3);
      expect(stats.totalQuotes).toBe(8); // 3 BTC + 3 ETH + 2 SOL quotes
      expect(stats.rfqsByStatus.filled).toBe(2);
      expect(stats.rfqsByStatus.open).toBe(1);
      
      console.log('\n=== Simulation Complete ===\n');
    });
  });
});
