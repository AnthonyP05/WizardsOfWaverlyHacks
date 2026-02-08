/**
 * ============================================
 * AI Routes
 * ============================================
 * 
 * Express route handlers for AI-powered features using Ollama.
 * 
 * AVAILABLE ENDPOINTS:
 * - POST /api/ai/chat - Chat with recycling assistant
 * - POST /api/ai/analyze-image - Identify items/materials in an image
 * - POST /api/ai/check-recyclability - Check materials against local rules + map
 * - POST /api/ai/geocode - Convert coordinates to ZIP code
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
// Image analysis ONLY — identifies items and materials.
// Does NOT check local recycling rules (use /check-recyclability for that).
// 
// REQUEST:
//   Body: { "image": "base64-encoded-image-data" }
// 
// RESPONSE (JSON):
//   {
//     "analysis": {
//       "items": [{ "name": "plastic bottle", "materials": ["plastic"], "confidence": "high" }],
//       "summary": "..."
//     }
//   }
// 
router.post('/analyze-image', async (req, res) => {
  try {
    const { image } = req.body;

    // Validate image input
    if (!image || typeof image !== 'string') {
      return res.status(400).json({
        error: 'Missing or invalid image field',
        details: 'Request body must include an "image" field with base64-encoded image data'
      });
    }

    // Call Ollama service with vision model
    const analysis = await analyzeRecyclingImage(image);

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
// POST /api/ai/check-recyclability
// ============================================
// 
// Takes a list of items/materials and checks them against
// local recycling rules. If not recyclable, returns a
// Google Maps embed URL to find nearby recycling locations.
// 
// This endpoint can receive items from analyze-image OR
// from any other source (manual input, barcode scan, etc.)
// 
// REQUEST:
//   Body: {
//     "items": [
//       { "name": "plastic bottle", "materials": ["plastic"], "confidence": "high" }
//     ],
//     "zip": "90210",           (optional)
//     "lat": 34.0901,           (optional - alternative to zip)
//     "lng": -118.4065          (optional - alternative to zip)
//   }
//   Note: Provide either "zip" OR "lat"/"lng". If both are given, zip takes priority.
// 
// RESPONSE (JSON):
//   {
//     "comparison": { ... },
//     "canRecycle": true/false,
//     "nearbyRecycling": { ... }   // only when canRecycle is false
//   }
// 
router.post('/check-recyclability', async (req, res) => {
  try {
    const { items, zip, lat, lng } = req.body;

    // Validate items input
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        error: 'Missing or invalid items field',
        details: 'Request body must include an "items" array with at least one item'
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

    if (!resolvedZip) {
      return res.status(400).json({
        error: 'Missing location',
        details: 'Provide a "zip" code or "lat"/"lng" coordinates'
      });
    }

    // Compare against local recycling rules
    let comparison = null;
    try {
      const recyclingRules = await getRecyclingRules(resolvedZip);
      comparison = compareMaterials(items, recyclingRules);
    } catch (error) {
      console.error('Error fetching recycling rules for comparison:', error);
      return res.status(500).json({
        error: 'Failed to fetch local recycling rules',
        details: error.message
      });
    }

    // Build response
    const response = {
      comparison,
      zip: resolvedZip,
      canRecycle: comparison.summary?.notRecyclable === 0 && comparison.summary?.recyclable > 0,
      timestamp: new Date().toISOString()
    };

    // Add location info if we resolved from coordinates
    if (locationInfo) {
      response.location = locationInfo;
    }

    // If NOT recyclable locally, provide Google Maps embed
    if (!response.canRecycle) {
      const materials = items
        .flatMap(item => item.materials || [item.name])
        .filter(Boolean);
      const searchMaterial = materials[0] || 'recycling';
      const query = encodeURIComponent(`${searchMaterial} recycling near ${resolvedZip}`);
      const mapsKey = process.env.GOOGLE_MAPS_API_KEY;

      if (mapsKey) {
        response.nearbyRecycling = {
          searchQuery: `${searchMaterial} recycling near ${resolvedZip}`,
          mapEmbedUrl: `https://www.google.com/maps/embed/v1/search?key=${mapsKey}&q=${query}`
        };
      }
    }

    res.json(response);

  } catch (error) {
    console.error('Error in check-recyclability endpoint:', error);
    res.status(500).json({
      error: 'Failed to check recyclability',
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
        'POST /api/ai/analyze-image': 'Identify items/materials in an image (AI only)',
        'POST /api/ai/check-recyclability': 'Check materials against local rules + map',
        'POST /api/ai/geocode': 'Convert coordinates to ZIP code'
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
