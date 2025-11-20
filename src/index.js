/**
 * RFQ System - Main Entry Point
 * A simple Request for Quote system for learning purposes
 */

const RFQSystem = require('./RFQSystem');

module.exports = {
  RFQSystem,
  // Export managers for advanced usage
  RFQManager: require('./managers/RFQManager'),
  QuoteManager: require('./managers/QuoteManager'),
  QueueManager: require('./managers/QueueManager'),
  // Export models
  RFQ: require('./models/RFQ'),
  Quote: require('./models/Quote'),
  QueueEntry: require('./models/QueueEntry')
};
