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
// POST /api/chat
// ============================================
// 
// Chat endpoint for the Igris floating chat assistant.
// 
// REQUEST:
//   Body: { "message": "user message" }
// 
// RESPONSE:
//   { "reply": "assistant reply" }
// 
// ============================================
router.post('/chat', async (req, res) => {
  const { message } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ 
      error: 'Please provide a message'
    });
  }

  // Simple chat logic based on message content
  const lowerMessage = message.toLowerCase();
  let reply = '';

  if (lowerMessage.includes('recycle') || lowerMessage.includes('waste') || lowerMessage.includes('material')) {
    // Recycling-related question
    const responses = [
      'Ah, seeked you knowledge of the sacred art of recycling. Remember, the key is proper sorting and cleanliness. Rinse all containers before they journey to their new life.',
      'The spirits of sustainability guide you well. Always check your local rules - what can be recycled varies by region. Would you like to know your specific area\'s rules?',
      'Wise question, traveler. Not all materials are welcome in every realm. Plastics 1 and 2 are most universally accepted, while others require specific facilities.',
      'The path to proper recycling is paved with knowledge. Flatten your cardboard, separate your metals, and never put hazardous materials in the bin.',
      'Hmm, the question echoes through the halls of sustainability. Different municipalities have different rules. Provide a ZIP code and I shall reveal the secrets of your local recycling protocols.'
    ];
    reply = responses[Math.floor(Math.random() * responses.length)];
  } else if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('greetings')) {
    // Greeting
    const responses = [
      'Greetings, wanderer. I am Igris, keeper of recycling wisdom. What knowledge do you seek?',
      'Welcome, seeker. The whispers of sustainability guide us. How may I aid your noble journey?',
      'Hail, noble one. I sense your presence at the threshold of ecological enlightenment.',
      'Salutations. The spirits of the green earth welcome you. What brings you to this mystical chat?'
    ];
    reply = responses[Math.floor(Math.random() * responses.length)];
  } else if (lowerMessage.includes('help') || lowerMessage.includes('how')) {
    // Help request
    const responses = [
      'I am at your service, seeker. You may ask me about recycling practices, suggest a ZIP code to learn your local rules, or simply engage in philosophical discourse about sustainability.',
      'The path is simple: ask me about what can be recycled, inquire about your local recycling practices, or seek wisdom on the proper disposal of waste.',
      'Many questions welcome my attention. Speak of recycling, waste, materials, or share your ZIP code and I shall unveil your local secrets.'
    ];
    reply = responses[Math.floor(Math.random() * responses.length)];
  } else {
    // General response
    const responses = [
      'An intriguing query, but it ventures beyond the realm of recycling wisdom. Is there perhaps some matter of waste and sustainability that troubles you?',
      'The spirits whisper, but this topic dwells outside my domain of knowledge. Might you ask of recycling or waste instead?',
      'Your curiosity is admirable, yet this path diverges from the recycling mysteries I am bound to illuminate. What of sustainability may I help with?',
      'While I appreciate your question, my essence is tied to the teachings of recycling. Perhaps rephrase your inquiry in terms of materials and waste?'
    ];
    reply = responses[Math.floor(Math.random() * responses.length)];
  }

  res.json({ reply });
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
