/**
 * ============================================
 * Services Index
 * ============================================
 * 
 * Central export point for all services.
 * This allows clean imports like:
 * 
 *   const { getRecyclingRules, searchGoogle } = require('./services');
 * 
 * Instead of:
 * 
 *   const { getRecyclingRules } = require('./services/recyclingService');
 *   const { searchGoogle } = require('./services/searchService');
 * 
 * ============================================
 */

const recyclingService = require('./recyclingService');
const searchService = require('./searchService');

module.exports = {
  // Recycling Service exports
  getRecyclingRules: recyclingService.getRecyclingRules,
  extractRules: recyclingService.extractRules,
  MATERIAL_DATABASE: recyclingService.MATERIAL_DATABASE,
  
  // Search Service exports
  searchGoogle: searchService.searchGoogle
};
