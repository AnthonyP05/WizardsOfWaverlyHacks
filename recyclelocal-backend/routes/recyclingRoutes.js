/**
 * ============================================
 * Recycling Routes
 * ============================================
 * 
 * Express route handlers for the recycling API.
 * Routes are thin — they handle HTTP concerns only.
 * Business logic lives in the services layer.
 * 
 * AVAILABLE ENDPOINTS:
 * - POST /api/recycling - Get recycling rules for a ZIP code
 * 
 * FRONTEND INTEGRATION:
 * All endpoints accept and return JSON by default.
 * Use ?format=text for plain text output.
 * Use ?format=html for HTML output.
 * Use ?format=md for Markdown output.
 * 
 * ============================================
 */

const express = require('express');
const router = express.Router();

// Import services and utilities
const { getRecyclingRules } = require('../services/recyclingService');
const { formatAsText, formatAsHtml, formatAsMarkdown } = require('../utils/formatters');

// ============================================
// POST /api/recycling
// ============================================
// 
// Main endpoint for getting recycling rules.
// 
// REQUEST:
//   Body: { "zip": "90210" }
//   Query params:
//     - format: "json" (default) | "text" | "html" | "md"
// 
// RESPONSE (JSON):
//   {
//     "location": "Beverly Hills, CA",
//     "accepted": [
//       { "material": "Cardboard", "notes": "Flatten", "confidence": "high" }
//     ],
//     "not_accepted": [...],
//     "tips": ["Rinse containers before recycling"],
//     "sources": [{ "title": "...", "url": "..." }],
//     "meta": { "sourcesAnalyzed": 5, "materialsFound": 12 }
//   }
// 
// ERRORS:
//   400: { "error": "Please provide a valid 5-digit ZIP code" }
//   500: { "error": "Failed to fetch recycling rules", "details": "..." }
// 
// ============================================
router.post('/recycling', async (req, res) => {
  // ----------------------------------------------------------------
  // Extract and validate the ZIP code
  // ----------------------------------------------------------------
  const { zip } = req.body;

  // Validate: must be exactly 5 digits
  if (!zip || !/^\d{5}$/.test(zip)) {
    return res.status(400).json({ 
      error: 'Please provide a valid 5-digit ZIP code',
      example: { zip: '90210' }
    });
  }

  try {
    // ----------------------------------------------------------------
    // Get recycling rules from the service layer
    // ----------------------------------------------------------------
    const rules = await getRecyclingRules(zip);

    // ----------------------------------------------------------------
    // Format the response based on the requested format
    // ----------------------------------------------------------------
    const format = req.query.format || 'json';

    switch (format.toLowerCase()) {
      case 'text':
        // Plain text format (for terminals, emails, etc.)
        res.type('text/plain');
        return res.send(formatAsText(rules));

      case 'html':
        // HTML format (for embedding in web pages)
        res.type('text/html');
        return res.send(formatAsHtml(rules));

      case 'md':
      case 'markdown':
        // Markdown format (for docs, Notion, Slack, etc.)
        res.type('text/markdown');
        return res.send(formatAsMarkdown(rules));

      case 'json':
      default:
        // JSON format (default - for frontend apps)
        return res.json(rules);
    }

  } catch (err) {
    // ----------------------------------------------------------------
    // Handle errors
    // ----------------------------------------------------------------
    console.error('Error fetching recycling rules:', err);
    
    return res.status(500).json({ 
      error: 'Failed to fetch recycling rules',
      details: err.message
    });
  }
});

// ============================================
// GET /api/recycling/health
// ============================================
// 
// Health check endpoint for monitoring.
// Returns { status: "ok" } if the server is running.
// 
// ============================================
router.get('/recycling/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// ============================================
// GET /api/recycling/materials
// ============================================
// 
// Returns the list of materials the system can detect.
// Useful for frontend to show what's supported.
// 
// ============================================
router.get('/recycling/materials', (req, res) => {
  const { MATERIAL_DATABASE } = require('../services/recyclingService');
  
  res.json({
    accepted: Object.keys(MATERIAL_DATABASE.accepted),
    not_accepted: Object.keys(MATERIAL_DATABASE.notAccepted),
    total: Object.keys(MATERIAL_DATABASE.accepted).length + 
           Object.keys(MATERIAL_DATABASE.notAccepted).length
  });
});

// ============================================
// Export the router
// ============================================
module.exports = router;
