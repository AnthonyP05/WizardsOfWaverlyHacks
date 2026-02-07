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

// Import recycling services for material comparison
const { 
  getRecyclingRules, 
  compareMaterials 
} = require('../services/recyclingService');

// Import geocoding service for coordinate-to-ZIP conversion
const { coordsToZip } = require('../services/geocodingService');

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
// Image analysis endpoint for identifying recyclable items
// and comparing against local recycling rules.
// Accepts images as base64-encoded strings.
// 
// REQUEST:
//   Body: { 
//     "image": "base64-encoded-image-data",
//     "zip": "90210",        (optional - enables local rule comparison)
//     "lat": 34.0901,          (optional - alternative to zip)
//     "lng": -118.4065          (optional - alternative to zip)
//   }
//   Note: Provide either "zip" OR "lat"/"lng". If both are given, zip takes priority.
// 
// RESPONSE (JSON):
//   {
//     "analysis": {
//       "items": [...],
//       "summary": "..."
//     },
//     "comparison": {
//       "items": [...with recyclability status...],
//       "summary": { recyclable: 2, notRecyclable: 1, unknown: 0 }
//     },
//     "timestamp": "2026-02-07T..."
//   }
// 
router.post('/analyze-image', async (req, res) => {
  try {
    const { image, zip, lat, lng } = req.body;

    // Validate image input
    if (!image || typeof image !== 'string') {
      return res.status(400).json({
        error: 'Missing or invalid image field',
        details: 'Request body must include an "image" field with base64-encoded image data'
      });
    }

    // Resolve ZIP code: use provided zip, or convert coordinates
    let resolvedZip = null;
    let locationInfo = null;

    if (zip && /^\d{5}$/.test(zip)) {
      resolvedZip = zip;
    } else if (lat != null && lng != null) {
      try {
        locationInfo = await coordsToZip(lat, lng);
        resolvedZip = locationInfo.zip;
        console.log(`[GEO] Resolved (${lat}, ${lng}) -> ZIP ${resolvedZip}`);
      } catch (error) {
        console.error('Error converting coordinates to ZIP:', error.message);
      }
    }

    // Call Ollama service with vision model
    const analysis = await analyzeRecyclingImage(image);

    // If we have a ZIP code, compare against local recycling rules
    let comparison = null;
    if (resolvedZip) {
      try {
        const recyclingRules = await getRecyclingRules(resolvedZip);
        comparison = compareMaterials(analysis.items || [], recyclingRules);
      } catch (error) {
        console.error('Error fetching recycling rules for comparison:', error);
        comparison = { error: 'Failed to fetch local recycling rules' };
      }
    }

    // Build response
    const response = {
      analysis,
      zip: resolvedZip || null,
      timestamp: new Date().toISOString()
    };

    // Add location info if we resolved from coordinates
    if (locationInfo) {
      response.location = locationInfo;
    }

    // Add comparison if we had a ZIP
    if (comparison) {
      response.comparison = comparison;
      response.canRecycle = comparison.summary?.notRecyclable === 0 && comparison.summary?.recyclable > 0;
    }

    // Return analysis with optional comparison
    res.json(response);

  } catch (error) {
    console.error('Error in image analysis endpoint:', error);
    res.status(500).json({
      error: 'Failed to analyze image',
      details: error.message
    });
  }
});

// ============================================
// POST /api/ai/geocode
// ============================================
// 
// Convert browser geolocation coordinates to a ZIP code.
// The frontend calls navigator.geolocation.getCurrentPosition()
// and sends the coordinates here.
// 
// REQUEST:
//   Body: { "lat": 34.0901, "lng": -118.4065 }
// 
// RESPONSE:
//   { "zip": "90210", "city": "Beverly Hills", "state": "California" }
// 
router.post('/geocode', async (req, res) => {
  try {
    const { lat, lng } = req.body;

    if (lat == null || lng == null) {
      return res.status(400).json({
        error: 'Missing lat/lng',
        details: 'Request body must include "lat" and "lng" numbers'
      });
    }

    const location = await coordsToZip(lat, lng);

    res.json({
      ...location,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in geocode endpoint:', error);
    res.status(500).json({
      error: 'Failed to convert coordinates to ZIP code',
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
