/**
 * ============================================
 * RecycleLocal Backend
 * ============================================
 * 
 * A hackathon project that helps users find recycling 
 * rules for their local area based on ZIP code.
 * 
 * HOW IT WORKS:
 * 1. User submits a ZIP code from the frontend
 * 2. Backend searches Google (via SerpAPI) for real municipal recycling pages
 * 3. Backend parses those search results to extract structured rules
 * 4. Returns clean JSON with accepted materials, restrictions, tips, and sources
 * 
 * PROJECT STRUCTURE:
 * ├── server.js           ← You are here (entry point)
 * ├── routes/
 * │   └── recyclingRoutes.js   ← HTTP route handlers
 * ├── services/
 * │   ├── recyclingService.js  ← Business logic (parsing, extraction)
 * │   └── searchService.js     ← SerpAPI integration
 * └── utils/
 *     └── formatters.js        ← Output formatters (text, HTML, etc.)
 * 
 * API ENDPOINTS:
 * - POST /api/recycling          Get recycling rules for a ZIP code
 * - GET  /api/recycling/health   Health check
 * - GET  /api/recycling/materials   List detectable materials
 * 
 * ENVIRONMENT VARIABLES:
 * - SERP_API_KEY: Your SerpAPI key (https://serpapi.com)
 * - PORT: Server port (default: 3000)
 * - DEBUG: Set to "true" for verbose logging
 * 
 * ============================================
 */

// ============================================
// Load environment variables
// ============================================
// dotenv loads variables from .env file into process.env
// This keeps API keys out of the code and out of git
// ============================================
require('dotenv').config();

// ============================================
// Import dependencies
// ============================================
const express = require('express');

// Import route handlers
const recyclingRoutes = require('./routes/recyclingRoutes');
const aiRoutes = require('./routes/aiRoutes');

// ============================================
// Create Express app
// ============================================
const app = express();

// ============================================
// Middleware
// ============================================

/**
 * JSON Body Parser
 * 
 * Automatically parses incoming JSON request bodies
 * and makes them available as req.body
 */
app.use(express.json());

/**
 * CORS Middleware
 * 
 * Enables Cross-Origin Resource Sharing so that
 * frontends on different domains/ports can call this API.
 * 
 * Without this, browsers would block requests from
 * a frontend running on localhost:5173 (Vite) or
 * localhost:3001 to this backend on localhost:3000.
 * 
 * SECURITY NOTE: In production, you'd want to restrict
 * this to specific origins instead of using '*'.
 */
app.use((req, res, next) => {
  // Allow requests from any origin
  res.header('Access-Control-Allow-Origin', '*');
  
  // Allow these headers in requests
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Allow these HTTP methods
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

/**
 * Request Logger (development only)
 * 
 * Logs incoming requests for debugging.
 * Shows method, URL, and timestamp.
 */
if (process.env.DEBUG === 'true') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });
}

// ============================================
// Routes
// ============================================

/**
 * API Routes
 * 
 * All recycling-related endpoints are prefixed with /api
 * This makes it easy to add versioning later (/api/v1, /api/v2)
 */
app.use('/api', recyclingRoutes);
app.use('/api/ai', aiRoutes);

/**
 * Root Route
 * 
 * Simple welcome message and API documentation
 */
app.get('/', (req, res) => {
  res.json({
    name: 'RecycleLocal API',
    version: '1.0.0',
    description: 'Get local recycling rules by ZIP code',
    endpoints: {
      'POST /api/recycling': {
        description: 'Get recycling rules for a ZIP code',
        body: { zip: '90210' },
        queryParams: {
          format: 'json | text | html | md (default: json)'
        }
      },
      'GET /api/recycling/health': {
        description: 'Health check endpoint'
      },
      'GET /api/recycling/materials': {
        description: 'List all detectable materials'
      },
      'POST /api/ai/chat': {
        description: 'Chat with AI recycling assistant',
        body: { message: 'Can I recycle pizza boxes?' }
      },
      'POST /api/ai/analyze-image': {
        description: 'Analyze recyclable items in an image',
        body: { image: 'base64-encoded-image-data' }
      },
      'GET /api/ai/health': {
        description: 'AI services health check'
      }
    },
    example: 'curl -X POST http://localhost:3000/api/recycling -H "Content-Type: application/json" -d \'{"zip":"90210"}\''
  });
});

// ============================================
// Error Handling
// ============================================

/**
 * 404 Handler
 * 
 * Catches requests to undefined routes
 */
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.url} does not exist`,
    availableEndpoints: [
      'POST /api/recycling',
      'GET /api/recycling/health',
      'GET /api/recycling/materials'
    ]
  });
});

/**
 * Global Error Handler
 * 
 * Catches any unhandled errors in route handlers
 */
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

// ============================================
// Start the server
// ============================================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log('');
  console.log('♻️  RecycleLocal Backend');
  console.log('─'.repeat(40));
  console.log(`   Server:    http://localhost:${PORT}`);
  console.log(`   API Docs:  http://localhost:${PORT}/`);
  console.log(`   Health:    http://localhost:${PORT}/api/recycling/health`);
  console.log('');
  console.log('   Try it:');
  console.log(`   curl -X POST http://localhost:${PORT}/api/recycling \\`);
  console.log(`     -H "Content-Type: application/json" \\`);
  console.log(`     -d '{"zip": "90210"}'`);
  console.log('');
});

// ============================================
// Export for testing
// ============================================
module.exports = app;
