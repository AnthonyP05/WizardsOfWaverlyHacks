/**
 * ============================================
 * Ollama Service
 * ============================================
 * 
 * Service for interacting with a local Ollama instance
 * for AI-powered chat and image analysis.
 * 
 * The Ollama URL is fetched from the gist configuration.
 * 
 * ============================================
 */

const https = require('https');
const http = require('http');

// Gist URL containing the Ollama endpoint configuration
const GIST_URL = 'https://gist.githubusercontent.com/AnthonyP05/163634f39557cf0a8fbee049126c8cf3/raw/ollama.json';

// Cache for the Ollama URL
let cachedOllamaUrl = null;

/**
 * Fetch the Ollama URL from the gist
 */
async function getOllamaUrl() {
  if (cachedOllamaUrl) {
    return cachedOllamaUrl;
  }

  return new Promise((resolve, reject) => {
    https.get(GIST_URL, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const config = JSON.parse(data);
          cachedOllamaUrl = config.url;
          resolve(cachedOllamaUrl);
        } catch (error) {
          reject(new Error('Failed to parse Ollama URL from gist'));
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * Make a request to the Ollama API
 */
async function makeOllamaRequest(endpoint, payload) {
  const baseUrl = await getOllamaUrl();
  const url = new URL(endpoint, baseUrl);
  
  const isHttps = url.protocol === 'https:';
  const client = isHttps ? https : http;

  return new Promise((resolve, reject) => {
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = client.request(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          console.log('[DEBUG] Ollama raw data length:', data.length);
          console.log('[DEBUG] Ollama status code:', res.statusCode);
          
          // Handle non-200 responses
          if (res.statusCode !== 200) {
            console.error('[DEBUG] Ollama error response:', data.substring(0, 500));
            reject(new Error(`Ollama returned status ${res.statusCode}: ${data.substring(0, 200)}`));
            return;
          }
          
          // Try to parse as single JSON first (when stream: false)
          try {
            const response = JSON.parse(data);
            resolve(response);
            return;
          } catch (e) {
            // Fall back to JSONL parsing
          }
          
          // Ollama returns JSONL (JSON Lines) - parse the last line
          const lines = data.trim().split('\n');
          const lastLine = lines[lines.length - 1];
          const response = JSON.parse(lastLine);
          resolve(response);
        } catch (error) {
          console.error('[DEBUG] Parse error:', error.message);
          console.error('[DEBUG] Raw data:', data.substring(0, 500));
          reject(new Error('Failed to parse Ollama response: ' + error.message));
        }
      });
    });

    req.on('error', (error) => {
      console.error('[DEBUG] Request error:', error.message);
      reject(error);
    });

    req.write(JSON.stringify(payload));
    req.end();
  });
}

/**
 * Chat with Ollama using a predetermined system prompt
 */
async function chatWithRecyclingAssistant(userMessage) {
  const payload = {
    model: 'qwen2.5:3b',
    messages: [
      {
        role: 'system',
        content: 'You are a helpful recycling assistant. Your job is to help users understand recycling rules, identify recyclable materials, and provide eco-friendly waste management tips. Always be encouraging and informative. Keep responses concise and under 150 words. Use line breaks for better readability when listing items.'
      },
      {
        role: 'user',
        content: userMessage
      }
    ],
    stream: false,
    options: {
      num_predict: 200,
      temperature: 0.7
    }
  };

  const response = await makeOllamaRequest('/api/chat', payload);
  return response.message.content;
}

/**
 * Analyze an image using Ollama vision model
 * Returns structured data with materials and confidence ratings
 */
async function analyzeRecyclingImage(imageBase64) {
  const payload = {
    model: 'llava:13b',
    prompt: `Each image analysis is independent. Ignore all previous images and answers.

You are an image recognition assistant for a recycling application.

When given an image:
- Identify the primary item visible (Include brand name when deciding what item it is)
- Use a specific name for the item
- Use a specific name for the materials the item is composed of (only if it's a recyclable material, otherwise, list as non-recyclable)
- Prefer recycling-relevant terms

Analyze the image and respond in JSON only:

{
"item": "<generic item name>",
"brand": "<brand name or null>",
"material": "<material or unknown>",
"confidence": "high | medium | low"
}

Rules:
- Only name a brand if clearly visible
- Do not guess
- If unsure, set fields to null or "unknown"

Do not include explanations or additional text.
If the item cannot be confidently identified, set confidence to low`,
    images: [imageBase64],
    stream: false
  };

  const response = await makeOllamaRequest('/api/generate', payload);
  const rawResponse = response.response || '';
  
  console.log('[DEBUG] Raw Ollama response:', rawResponse.substring(0, 500));
  
  // Try to parse as JSON first (expected format from the prompt)
  try {
    const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      // Convert single-item format to our items array format
      if (parsed.item) {
        const materials = [];
        if (parsed.material && parsed.material !== 'unknown' && parsed.material !== 'non-recyclable') {
          materials.push(parsed.material);
        }
        return {
          items: [{
            name: parsed.item,
            brand: parsed.brand || null,
            materials,
            confidence: (parsed.confidence || 'medium').toLowerCase().trim(),
            preparation: getPreparationNote(parsed.item.toLowerCase())
          }],
          rawResponse,
          summary: `Found: ${parsed.item}${parsed.brand ? ` (${parsed.brand})` : ''}`
        };
      }
    }
  } catch (e) {
    console.log('[DEBUG] JSON parse failed, falling back to text parsing:', e.message);
  }
  
  // Fallback: parse natural language response
  const items = parseImageAnalysisResponse(rawResponse);
  
  return {
    items,
    rawResponse,
    summary: items.length > 0 
      ? `Found ${items.length} item(s): ${items.map(i => i.name).join(', ')}`
      : rawResponse.substring(0, 200)
  };
}

/**
 * Parse natural language response from vision model to extract items and materials
 */
function parseImageAnalysisResponse(text) {
  if (!text) return [];
  
  const items = [];
  const lowerText = text.toLowerCase();
  
  // Material keywords to detect
  const materialKeywords = {
    'plastic': ['plastic', 'pet', 'hdpe', 'pvc', 'ldpe', 'pp', 'ps', 'polypropylene', 'polyethylene'],
    'glass': ['glass'],
    'aluminum': ['aluminum', 'aluminium', 'aluminum can'],
    'cardboard': ['cardboard', 'corrugated'],
    'paper': ['paper'],
    'metal': ['metal', 'steel', 'tin', 'iron'],
    'styrofoam': ['styrofoam', 'polystyrene', 'foam'],
    'fabric': ['fabric', 'textile', 'cloth', 'cotton', 'polyester'],
    'electronics': ['electronic', 'battery', 'batteries', 'circuit'],
    'food waste': ['food', 'organic', 'compost']
  };
  
  // Item patterns to look for
  const itemPatterns = [
    { pattern: /(?:plastic\s+)?(?:water\s+)?bottle/i, name: 'plastic bottle', materials: ['plastic'] },
    { pattern: /glass\s+bottle/i, name: 'glass bottle', materials: ['glass'] },
    { pattern: /(?:aluminum|aluminium|soda|beer)\s+can/i, name: 'aluminum can', materials: ['aluminum'] },
    { pattern: /(?:tin|metal|food)\s+can/i, name: 'metal can', materials: ['metal'] },
    { pattern: /cardboard\s+box/i, name: 'cardboard box', materials: ['cardboard'] },
    { pattern: /(?:cardboard|box)/i, name: 'cardboard', materials: ['cardboard'] },
    { pattern: /(?:news)?paper/i, name: 'paper', materials: ['paper'] },
    { pattern: /magazine/i, name: 'magazine', materials: ['paper'] },
    { pattern: /glass\s+jar/i, name: 'glass jar', materials: ['glass'] },
    { pattern: /plastic\s+(?:container|tub|jug)/i, name: 'plastic container', materials: ['plastic'] },
    { pattern: /styrofoam|foam\s+cup/i, name: 'styrofoam', materials: ['styrofoam'] },
    { pattern: /plastic\s+bag/i, name: 'plastic bag', materials: ['plastic'] },
    { pattern: /milk\s+(?:carton|jug)/i, name: 'milk container', materials: ['plastic', 'cardboard'] },
    { pattern: /juice\s+(?:box|carton)/i, name: 'juice carton', materials: ['cardboard', 'plastic'] },
  ];
  
  // Track what we've found to avoid duplicates
  const foundItems = new Set();
  
  // First, try to match specific item patterns
  for (const { pattern, name, materials } of itemPatterns) {
    if (pattern.test(text) && !foundItems.has(name)) {
      foundItems.add(name);
      items.push({
        name,
        materials,
        confidence: 'high',
        preparation: getPreparationNote(name)
      });
    }
  }
  
  // If no specific patterns matched, look for material mentions and infer items
  if (items.length === 0) {
    for (const [material, keywords] of Object.entries(materialKeywords)) {
      for (const keyword of keywords) {
        if (lowerText.includes(keyword) && !foundItems.has(material)) {
          foundItems.add(material);
          items.push({
            name: `${material} item`,
            materials: [material],
            confidence: 'medium',
            preparation: null
          });
          break;
        }
      }
    }
  }
  
  return items;
}

/**
 * Get preparation notes for common recyclable items
 */
function getPreparationNote(itemName) {
  const notes = {
    'plastic bottle': 'Rinse and remove cap',
    'glass bottle': 'Rinse, labels can stay on',
    'aluminum can': 'Rinse, no need to crush',
    'metal can': 'Rinse, remove paper labels if possible',
    'cardboard box': 'Flatten and remove tape',
    'cardboard': 'Flatten, keep dry',
    'pizza box': 'Remove greasy portions',
    'plastic container': 'Rinse thoroughly',
    'glass jar': 'Rinse, lids can be recycled separately',
    'milk container': 'Rinse thoroughly',
    'juice carton': 'Rinse and flatten'
  };
  return notes[itemName] || null;
}

module.exports = {
  chatWithRecyclingAssistant,
  analyzeRecyclingImage,
  getOllamaUrl
};
