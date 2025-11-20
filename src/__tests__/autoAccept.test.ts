import { RFQManager } from '../RFQManager';
import { RFQ } from '../RFQ';

describe('Auto-Accept (2-Step Process)', () => {
  let manager: RFQManager;

  beforeEach(() => {
    manager = new RFQManager();
  });

  describe('Basic Auto-Accept', () => {
    test('should auto-accept best quote when minimum quotes reached', () => {
      // Create RFQ with auto-accept after 2 quotes
      const rfq = manager.createRFQ('BTC/USD', 'buy', 10, 60000, {
        enabled: true,
        minQuotes: 2
      });

      expect(rfq.autoAccept).toBeDefined();
      expect(rfq.autoAccept!.enabled).toBe(true);
      expect(rfq.autoAccept!.minQuotes).toBe(2);

      // Submit first quote - should not auto-accept yet
      manager.submitQuote(rfq.id, 'maker1', 50000);
      expect(rfq.status).toBe('open');

      // Submit second quote - should auto-accept best (lowest for buy)
      manager.submitQuote(rfq.id, 'maker2', 49500);
      
      // RFQ should now be filled with the best quote
      expect(rfq.status).toBe('filled');
      expect(rfq.selectedQuoteId).toBeDefined();
      
      // Verify it selected the best quote (lowest price for buy)
      const details = manager.getRFQDetails(rfq.id);
      const selectedQuote = details!.quotes.find(q => q.id === rfq.selectedQuoteId);
      expect(selectedQuote!.pricePerToken).toBe(49500);
    });

    test('should auto-accept highest price for sell orders', () => {
      // Create sell RFQ with auto-accept
      const rfq = manager.createRFQ('ETH/USD', 'sell', 50, 60000, {
        enabled: true,
        minQuotes: 2
      });

      // Submit quotes
      manager.submitQuote(rfq.id, 'maker1', 3000);
      manager.submitQuote(rfq.id, 'maker2', 3100); // Higher is better for sell

      // Should auto-accept highest price
      expect(rfq.status).toBe('filled');
      const details = manager.getRFQDetails(rfq.id);
      const selectedQuote = details!.quotes.find(q => q.id === rfq.selectedQuoteId);
      expect(selectedQuote!.pricePerToken).toBe(3100);
    });

    test('should not auto-accept if disabled', () => {
      const rfq = manager.createRFQ('BTC/USD', 'buy', 10, 60000, {
        enabled: false,
        minQuotes: 2
      });

      manager.submitQuote(rfq.id, 'maker1', 50000);
      manager.submitQuote(rfq.id, 'maker2', 49500);

      // Should still be open
      expect(rfq.status).toBe('open');
      expect(rfq.selectedQuoteId).toBeNull();
    });

    test('should not auto-accept if minimum quotes not reached', () => {
      const rfq = manager.createRFQ('BTC/USD', 'buy', 10, 60000, {
        enabled: true,
        minQuotes: 3
      });

      manager.submitQuote(rfq.id, 'maker1', 50000);
      manager.submitQuote(rfq.id, 'maker2', 49500);

      // Should still be open (need 3 quotes)
      expect(rfq.status).toBe('open');
      expect(rfq.selectedQuoteId).toBeNull();

      // Add third quote
      manager.submitQuote(rfq.id, 'maker3', 49800);

      // Now should be filled
      expect(rfq.status).toBe('filled');
    });
  });

  describe('Wait Time', () => {
    test('should respect wait time before auto-accepting', async () => {
      const rfq = manager.createRFQ('BTC/USD', 'buy', 10, 60000, {
        enabled: true,
        minQuotes: 2,
        waitTimeMs: 100 // Wait 100ms
      });

      // Submit 2 quotes immediately
      manager.submitQuote(rfq.id, 'maker1', 50000);
      manager.submitQuote(rfq.id, 'maker2', 49500);

      // Should not auto-accept yet (wait time not elapsed)
      expect(rfq.status).toBe('open');

      // Wait for the wait time to elapse
      await new Promise(resolve => setTimeout(resolve, 120));

      // Submit another quote to trigger check
      manager.submitQuote(rfq.id, 'maker3', 49800);

      // Now should be filled
      expect(rfq.status).toBe('filled');
    });
  });

  describe('shouldAutoAccept method', () => {
    test('should return false when auto-accept not configured', () => {
      const rfq = new RFQ('rfq1', 'BTC/USD', 'buy', 10, Date.now() + 60000);
      expect(rfq.shouldAutoAccept(5)).toBe(false);
    });

    test('should return false when disabled', () => {
      const rfq = new RFQ('rfq1', 'BTC/USD', 'buy', 10, Date.now() + 60000, {
        enabled: false,
        minQuotes: 2
      });
      expect(rfq.shouldAutoAccept(5)).toBe(false);
    });

    test('should return false when not enough quotes', () => {
      const rfq = new RFQ('rfq1', 'BTC/USD', 'buy', 10, Date.now() + 60000, {
        enabled: true,
        minQuotes: 3
      });
      expect(rfq.shouldAutoAccept(2)).toBe(false);
    });

    test('should return true when conditions met', () => {
      const rfq = new RFQ('rfq1', 'BTC/USD', 'buy', 10, Date.now() + 60000, {
        enabled: true,
        minQuotes: 2
      });
      expect(rfq.shouldAutoAccept(2)).toBe(true);
      expect(rfq.shouldAutoAccept(3)).toBe(true);
    });
  });

  describe('Real-world Scenarios', () => {
    test('2-step process: immediate execution at best price', () => {
      console.log('\n=== 2-Step Process: Auto-Accept Best Price ===');
      
      // Step 1: Taker creates RFQ with auto-accept (2-step)
      console.log('Step 1: Taker creates RFQ with auto-accept (min 3 quotes)');
      const rfq = manager.createRFQ('BTC/USD', 'buy', 5, 60000, {
        enabled: true,
        minQuotes: 3
      });

      // Step 2: Makers submit quotes (automatically filled when 3rd quote arrives)
      console.log('Step 2: Makers submit quotes...');
      manager.submitQuote(rfq.id, 'maker_alice', 50100);
      console.log('  Quote 1: Alice at $50,100 (status: open)');
      expect(rfq.status).toBe('open');

      manager.submitQuote(rfq.id, 'maker_bob', 49900);
      console.log('  Quote 2: Bob at $49,900 (status: open)');
      expect(rfq.status).toBe('open');

      manager.submitQuote(rfq.id, 'maker_charlie', 50050);
      console.log('  Quote 3: Charlie at $50,050');
      
      // Automatically filled!
      console.log('\n✅ Automatically filled with best quote!');
      expect(rfq.status).toBe('filled');
      
      const details = manager.getRFQDetails(rfq.id);
      const selectedQuote = details!.quotes.find(q => q.id === rfq.selectedQuoteId);
      console.log(`   Selected: ${selectedQuote!.makerId} at $${selectedQuote!.pricePerToken}`);
      console.log('   (Lowest price for buy order)');
      
      expect(selectedQuote!.makerId).toBe('maker_bob');
      expect(selectedQuote!.pricePerToken).toBe(49900);

      console.log('\n=== 2-Step Process Complete ===\n');
    });

    test('3-step process: manual selection (traditional)', () => {
      console.log('\n=== 3-Step Process: Manual Selection ===');
      
      // Step 1: Create RFQ without auto-accept
      console.log('Step 1: Taker creates RFQ (manual selection)');
      const rfq = manager.createRFQ('ETH/USD', 'sell', 100, 60000);

      // Step 2: Collect quotes
      console.log('Step 2: Makers submit quotes...');
      manager.submitQuote(rfq.id, 'maker1', 3050);
      manager.submitQuote(rfq.id, 'maker2', 3100);
      manager.submitQuote(rfq.id, 'maker3', 3075);
      console.log('  Received 3 quotes (status: open)');
      expect(rfq.status).toBe('open');

      // Step 3: Manual selection
      console.log('Step 3: Taker reviews and selects best quote...');
      const details = manager.getRFQDetails(rfq.id);
      const bestQuote = details!.quotes.reduce((best, q) => 
        q.pricePerToken > best.pricePerToken ? q : best
      );
      
      manager.acceptQuote(rfq.id, bestQuote.id);
      console.log(`   Selected: ${bestQuote.makerId} at $${bestQuote.pricePerToken}`);
      
      expect(rfq.status).toBe('filled');
      console.log('\n=== 3-Step Process Complete ===\n');
    });

    test('comparison: 2-step vs 3-step timing', () => {
      const start2step = Date.now();
      
      // 2-step: auto-accept
      const rfq2step = manager.createRFQ('BTC/USD', 'buy', 10, 60000, {
        enabled: true,
        minQuotes: 2
      });
      manager.submitQuote(rfq2step.id, 'maker1', 50000);
      manager.submitQuote(rfq2step.id, 'maker2', 49500);
      const time2step = Date.now() - start2step;
      
      expect(rfq2step.status).toBe('filled');

      const start3step = Date.now();
      
      // 3-step: manual selection
      const rfq3step = manager.createRFQ('BTC/USD', 'buy', 10, 60000);
      manager.submitQuote(rfq3step.id, 'maker1', 50000);
      manager.submitQuote(rfq3step.id, 'maker2', 49500);
      const details = manager.getRFQDetails(rfq3step.id);
      manager.acceptQuote(rfq3step.id, details!.quotes[1].id);
      const time3step = Date.now() - start3step;
      
      expect(rfq3step.status).toBe('filled');

      console.log(`\n2-Step Process: ~${time2step}ms (automatic)`);
      console.log(`3-Step Process: ~${time3step}ms (manual)\n`);
    });
  });
});
