/**
 * ============================================
 * AI Routes
 * ============================================
 * 
 * Express route handlers for AI-powered features using Ollama.
 * 
 * AVAILABLE ENDPOINTS:
 * - POST /api/ai/chat - Chat with recycling assistant
 * - POST /api/ai/analyze-image - Analyze recycling items in image
 * 
 * ============================================
 */

const express = require('express');
const router = express.Router();

// Import AI services
const { 
  chatWithRecyclingAssistant, 
  analyzeRecyclingImage 
} = require('../services/ollamaService');

// ============================================
// POST /api/ai/chat
// ============================================
// 
// Chat endpoint with predetermined recycling assistant behavior.
// 
// REQUEST:
//   Body: { "message": "Can I recycle pizza boxes?" }
// 
// RESPONSE (JSON):
//   {
//     "response": "Pizza boxes can be recycled if they're clean...",
//     "timestamp": "2026-02-07T..."
//   }
// 
router.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;

    // Validate input
    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        error: 'Missing or invalid message field',
        details: 'Request body must include a "message" string'
      });
    }

    // Call Ollama service
    const response = await chatWithRecyclingAssistant(message);

    // Return response
    res.json({
      response,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in AI chat endpoint:', error);
    res.status(500).json({
      error: 'Failed to process chat request',
      details: error.message
    });
  }
});

// ============================================
// POST /api/ai/analyze-image
// ============================================
// 
// Image analysis endpoint for identifying recyclable items.
// Accepts images as base64-encoded strings.
// 
// REQUEST:
//   Body: { "image": "base64-encoded-image-data" }
// 
// RESPONSE (JSON):
//   {
//     "analysis": "I can see several items in this image...",
//     "timestamp": "2026-02-07T..."
//   }
// 
router.post('/analyze-image', async (req, res) => {
  try {
    const { image } = req.body;

    // Validate input
    if (!image || typeof image !== 'string') {
      return res.status(400).json({
        error: 'Missing or invalid image field',
        details: 'Request body must include an "image" field with base64-encoded image data'
      });
    }

    // Call Ollama service with vision model
    const analysis = await analyzeRecyclingImage(image);

    // Return analysis
    res.json({
      analysis,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in image analysis endpoint:', error);
    res.status(500).json({
      error: 'Failed to analyze image',
      details: error.message
    });
  }
});

// ============================================
// GET /api/ai/health
// ============================================
// 
// Health check for AI services
// 
router.get('/health', async (req, res) => {
  try {
    const { getOllamaUrl } = require('../services/ollamaService');
    const url = await getOllamaUrl();
    
    res.json({
      status: 'healthy',
      ollamaUrl: url,
      endpoints: {
        'POST /api/ai/chat': 'Chat with recycling assistant',
        'POST /api/ai/analyze-image': 'Analyze recycling items in images'
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

module.exports = router;
