/**
 * Test script for the analyze-image endpoint
 * 
 * Usage: node test-analyze.js [path-to-image] [zip-code]
 * Example: node test-analyze.js ./test-image.jpg 90210
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

// Get command line args
const imagePath = process.argv[2];
const zipCode = process.argv[3] || '90210';

if (!imagePath) {
  console.log('Usage: node test-analyze.js <path-to-image> [zip-code]');
  console.log('Example: node test-analyze.js ./bottle.jpg 90210');
  process.exit(1);
}

// Read and encode image
const imageBuffer = fs.readFileSync(path.resolve(imagePath));
const base64Image = imageBuffer.toString('base64');

console.log(`\n📷 Analyzing image: ${imagePath}`);
console.log(`📍 ZIP code: ${zipCode}`);
console.log(`📦 Image size: ${(base64Image.length / 1024).toFixed(1)} KB (base64)\n`);

// Build request
const requestData = JSON.stringify({
  image: base64Image,
  zip: zipCode
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/ai/analyze-image',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(requestData)
  }
};

console.log('⏳ Sending to AI for analysis...\n');

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', chunk => data += chunk);
  
  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      
      console.log('═══════════════════════════════════════');
      console.log('📊 ANALYSIS RESULT');
      console.log('═══════════════════════════════════════\n');
      
      // Show AI analysis
      if (result.analysis) {
        console.log('🤖 AI Detection:');
        if (result.analysis.items && result.analysis.items.length > 0) {
          result.analysis.items.forEach((item, i) => {
            console.log(`   ${i + 1}. ${item.name}`);
            console.log(`      Materials: ${item.materials?.join(', ') || 'unknown'}`);
            console.log(`      Confidence: ${item.confidence}`);
            if (item.preparation) console.log(`      Prep: ${item.preparation}`);
          });
        } else {
          console.log(`   Summary: ${result.analysis.summary || 'No items detected'}`);
        }
        console.log('');
      }
      
      // Show comparison results
      if (result.comparison) {
        console.log('♻️  Recyclability Check:');
        console.log(`   Location: ${result.comparison.location}`);
        console.log('');
        
        if (result.comparison.items) {
          result.comparison.items.forEach((item, i) => {
            const status = item.overallStatus === 'recyclable' ? '✅' : 
                          item.overallStatus === 'not_recyclable' ? '❌' : '⚠️';
            console.log(`   ${status} ${item.name}: ${item.overallStatus.replace('_', ' ')}`);
            
            item.materials?.forEach(m => {
              const mStatus = m.recyclable === true ? '✓' : m.recyclable === false ? '✗' : '?';
              console.log(`      [${mStatus}] ${m.material} - ${m.notes || m.reason || ''}`);
            });
          });
        }
        
        console.log('');
        console.log('📈 Summary:');
        console.log(`   ✅ Recyclable: ${result.comparison.summary.recyclable}`);
        console.log(`   ❌ Not recyclable: ${result.comparison.summary.notRecyclable}`);
        console.log(`   ⚠️  Unknown: ${result.comparison.summary.unknown}`);
      }
      
      console.log('');
      console.log('═══════════════════════════════════════');
      console.log(`🎯 CAN RECYCLE: ${result.canRecycle ? 'YES ✅' : 'NO ❌'}`);
      console.log('═══════════════════════════════════════\n');
      
      // Optionally print full JSON
      if (process.env.DEBUG) {
        console.log('\n📄 Full JSON response:');
        console.log(JSON.stringify(result, null, 2));
      }
      
    } catch (e) {
      console.error('Failed to parse response:', e.message);
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (e) => {
  console.error(`❌ Error: ${e.message}`);
  console.log('\nMake sure the server is running: node server.js');
});

req.write(requestData);
req.end();
