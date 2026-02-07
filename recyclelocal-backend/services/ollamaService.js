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
          // Ollama returns JSONL (JSON Lines) - parse the last line
          const lines = data.trim().split('\n');
          const lastLine = lines[lines.length - 1];
          const response = JSON.parse(lastLine);
          resolve(response);
        } catch (error) {
          reject(new Error('Failed to parse Ollama response'));
        }
      });
    });

    req.on('error', (error) => {
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
        content: 'You are a helpful recycling assistant. Your job is to help users understand recycling rules, identify recyclable materials, and provide eco-friendly waste management tips. Always be encouraging and informative.'
      },
      {
        role: 'user',
        content: userMessage
      }
    ],
    stream: false
  };

  const response = await makeOllamaRequest('/api/chat', payload);
  return response.message.content;
}

/**
 * Analyze an image using Ollama vision model
 */
async function analyzeRecyclingImage(imageBase64) {
  const payload = {
    model: 'llava:13b',
    prompt: `Can you make this into one big string with no enter characters:

Each image analysis is independent. Ignore all previous images and answers.

You are an image recognition assistant for a recycling application.

When given an image:
- Identify the primary item visible (Include brand name when deciding what item it is)
- Use a specific name for the item
- Use a specific name for the materials the item is composed of (only if it's a recyclable material, otherwise, list as non-recyclable
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
  return response.response;
}

module.exports = {
  chatWithRecyclingAssistant,
  analyzeRecyclingImage,
  getOllamaUrl
};
