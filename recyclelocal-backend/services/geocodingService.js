/**
 * ============================================
 * Geocoding Service
 * ============================================
 * 
 * Converts browser geolocation coordinates (lat/lng)
 * to a US ZIP code using the US Census Bureau's
 * free geocoder API. No API key required.
 * 
 * FRONTEND INTEGRATION:
 * The frontend gets coordinates via navigator.geolocation,
 * sends them to the backend, and this service converts
 * them to a ZIP code for the recycling rules lookup.
 * 
 * ============================================
 */

const https = require('https');

/**
 * Convert latitude/longitude to a ZIP code
 * Uses the US Census Bureau reverse geocoder (free, no key needed)
 * 
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<{zip: string, city: string, state: string}>}
 */
async function coordsToZip(lat, lng) {
  const url = `https://geocoding.geo.census.gov/geocoder/geographies/coordinates?x=${lng}&y=${lat}&benchmark=Public_AR_Current&vintage=Current_Current&format=json`;

  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          const geographies = result?.result?.geographies;

          // Extract ZIP from Census Block Groups or 2020 Census Blocks
          const blockGroups = geographies?.['Census Block Groups'] || geographies?.['2020 Census Blocks'] || [];

          if (blockGroups.length > 0) {
            const block = blockGroups[0];
            // ZCTA5 is the ZIP Code Tabulation Area
            const zip = block.ZCTA5CE || block.ZCTA5CE20 || null;
            const state = block.STATE || null;
            const county = block.COUNTY || null;

            if (zip) {
              return resolve({ zip, state, county });
            }
          }

          // Fallback: try BigQuery-style geocoding with a second API
          return resolve(fallbackCoordsToZip(lat, lng));
        } catch (error) {
          reject(new Error('Failed to parse geocoder response: ' + error.message));
        }
      });
    }).on('error', (error) => {
      reject(new Error('Geocoder request failed: ' + error.message));
    });
  });
}

/**
 * Fallback: Use Nominatim (OpenStreetMap) for reverse geocoding
 * Free, no key, but has a 1 req/sec rate limit
 */
async function fallbackCoordsToZip(lat, lng) {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`;

  return new Promise((resolve, reject) => {
    const options = {
      headers: { 'User-Agent': 'RecycleLocal/1.0' }
    };

    https.get(url, options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          const address = result?.address;

          if (address?.postcode) {
            // Take first 5 digits (some return ZIP+4)
            const zip = address.postcode.substring(0, 5);
            return resolve({
              zip,
              city: address.city || address.town || address.village || null,
              state: address.state || null
            });
          }

          reject(new Error('Could not determine ZIP code from coordinates'));
        } catch (error) {
          reject(new Error('Failed to parse fallback geocoder response: ' + error.message));
        }
      });
    }).on('error', (error) => {
      reject(new Error('Fallback geocoder request failed: ' + error.message));
    });
  });
}

module.exports = {
  coordsToZip
};
