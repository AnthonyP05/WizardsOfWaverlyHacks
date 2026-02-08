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
 * - GET  /api/ai/upc-lookup - UPCItemDB proxy (avoids CORS)
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

// Database pool for user ZIP lookup
const { pool } = require('../config/database');

// JWT for optional auth on analyze-image
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'recyclelocal-dev-secret-change-in-production';

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
// GET /api/ai/upc-lookup
// ============================================
//
// Proxies UPCItemDB lookup to avoid browser CORS restrictions.
//
// REQUEST:
//   Query: ?upc=016000170995
//
// RESPONSE (JSON):
//   Raw UPCItemDB response JSON
//
router.get('/upc-lookup', async (req, res) => {
  try {
    const upc = String(req.query.upc || '').trim();
    if (!upc) {
      return res.status(400).json({
        error: 'Missing or invalid upc parameter',
        example: '/api/ai/upc-lookup?upc=016000170995'
      });
    }

    const lookupUrl = `https://api.upcitemdb.com/prod/trial/lookup?upc=${encodeURIComponent(upc)}`;
    const response = await fetch(lookupUrl);

    if (!response.ok) {
      return res.status(response.status).json({
        error: 'UPC lookup failed',
        status: response.status
      });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error in UPC lookup proxy:', error);
    res.status(500).json({
      error: 'Failed to lookup UPC',
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
    const { image, zip, lat, lng } = req.body;

    // Validate image input
    if (!image || typeof image !== 'string') {
      return res.status(400).json({
        error: 'Missing or invalid image field',
        details: 'Request body must include an "image" field with base64-encoded image data'
      });
    }

    // Resolve ZIP: body > JWT user's saved zip > null
    let resolvedZip = zip || null;
    if (!resolvedZip) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
          const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
          const [rows] = await pool.execute(
            'SELECT zip_code FROM users WHERE id = ?',
            [decoded.id]
          );
          if (rows.length > 0 && rows[0].zip_code) {
            resolvedZip = rows[0].zip_code;
          }
        } catch (_) { /* token invalid or missing — continue without zip */ }
      }
    }

    // Call Ollama service with vision model
    const analysis = await analyzeRecyclingImage(image);

    res.json({
      analysis,
      zip: resolvedZip,
      lat: lat || null,
      lng: lng || null,
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
// Takes a list of items/materials and the user's location
// (lat/lng), resolves the ZIP internally, then checks against
// local recycling rules. If not recyclable, returns a Google
// Maps embed URL.
// 
// ITEM FORMAT:
//   Each item needs at minimum a "name" field. The "materials"
//   array is what gets matched against local rules. If "materials"
//   is missing, the "name" is used as a fallback.
//   { "name": "plastic bottle", "materials": ["plastic"], "confidence": "high" }
// 
// REQUEST:
//   Body: {
//     "items": [
//       { "name": "plastic bottle", "materials": ["plastic"] }
//     ],
//     "lat": 34.0901,
//     "lng": -118.4065
//   }
// 
// RESPONSE (JSON):
//   {
//     "comparison": { ... },
//     "zip": "90210",
//     "canRecycle": true/false,
//     "nearbyRecycling": { ... }   // only when canRecycle is false
//   }
// 
router.post('/check-recyclability', async (req, res) => {
  try {
    const { items, lat, lng } = req.body;

    // Validate items input
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        error: 'Missing or invalid items field',
        details: 'Request body must include an "items" array with at least one item. Each item should have "name" and optionally "materials" (array of strings).'
      });
    }

    // Validate location
    if (lat == null || lng == null) {
      return res.status(400).json({
        error: 'Missing location',
        details: 'Request body must include "lat" and "lng" numbers from browser geolocation.'
      });
    }

    // Resolve coordinates to ZIP code
    let resolvedZip = null;
    let locationInfo = null;
    try {
      locationInfo = await coordsToZip(lat, lng);
      resolvedZip = locationInfo.zip;
      console.log(`[GEO] Resolved (${lat}, ${lng}) -> ZIP ${resolvedZip}`);
    } catch (error) {
      console.error('Error converting coordinates to ZIP:', error.message);
      return res.status(500).json({
        error: 'Failed to resolve location',
        details: error.message
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
      location: locationInfo,
      canRecycle: comparison.summary?.notRecyclable === 0 && comparison.summary?.recyclable > 0,
      timestamp: new Date().toISOString()
    };

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
// GET /api/ai/nearby-recycling
// ============================================
//
// Find nearby recycling centers using Google Maps search.
//
// REQUEST:
//   Query: ?lat=34.0901&lng=-118.4065&material=plastic
//
// RESPONSE (JSON):
//   { "mapEmbedUrl": "...", "searchQuery": "..." }
//
router.get('/nearby-recycling', async (req, res) => {
  try {
    const { lat, lng, material, zip } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        error: 'Missing lat/lng parameters',
        example: '/api/ai/nearby-recycling?lat=34.0901&lng=-118.4065&material=plastic'
      });
    }

    const searchMaterial = material || 'recycling';
    const location = zip || `${lat},${lng}`;
    const query = encodeURIComponent(`${searchMaterial} recycling near ${location}`);
    const mapsKey = process.env.GOOGLE_MAPS_API_KEY;

    if (!mapsKey) {
      return res.status(500).json({
        error: 'Google Maps API key not configured',
        details: 'Set GOOGLE_MAPS_API_KEY in environment variables'
      });
    }

    res.json({
      searchQuery: `${searchMaterial} recycling near ${location}`,
      mapEmbedUrl: `https://www.google.com/maps/embed/v1/search?key=${mapsKey}&q=${query}`,
      center: { lat: parseFloat(lat), lng: parseFloat(lng) }
    });
  } catch (error) {
    console.error('Error in nearby-recycling endpoint:', error);
    res.status(500).json({
      error: 'Failed to generate map',
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
