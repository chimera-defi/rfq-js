/**
 * RFQ System - Main Entry Point
 * A simple in-memory Request for Quote system
 */

const RFQ = require('./RFQ');
const Quote = require('./Quote');
const RFQQueue = require('./RFQQueue');
const RFQManager = require('./RFQManager');

module.exports = {
  RFQ,
  Quote,
  RFQQueue,
  RFQManager
};
