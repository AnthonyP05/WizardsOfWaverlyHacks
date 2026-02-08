/**
 * ============================================
 * Recycling Service
 * ============================================
 * 
 * Core business logic for extracting recycling rules from search results.
 * This is the brain of the application — it takes raw search results and
 * extracts structured, actionable recycling information.
 * 
 * HOW IT WORKS:
 * 1. Receives raw search results from searchService
 * 2. Scans snippets for known recyclable materials
 * 3. Cross-references multiple sources for accuracy
 * 4. Extracts contextual notes (rinse, flatten, etc.)
 * 5. Deduplicates and formats the results
 * 
 * FRONTEND INTEGRATION:
 * This service is used internally by the route handlers.
 * Frontend should use the /api/recycling endpoint.
 * 
 * ============================================
 */

const { searchGoogle } = require('./searchService');

// ============================================
// MATERIAL DATABASE
// ============================================
// Maps canonical material names to their variations.
// This helps us match different ways people describe
// the same material (e.g., "aluminum cans" vs "soda cans").
// 
// ADD NEW MATERIALS HERE if you want to expand coverage.
// ============================================

const MATERIAL_DATABASE = {
  // Materials that CAN typically be recycled curbside
  accepted: {
    'Cardboard': ['cardboard', 'corrugated', 'boxes'],
    'Paper': ['paper', 'office paper', 'junk mail', 'mail'],
    'Newspaper': ['newspaper', 'newspapers', 'newsprint'],
    'Magazines': ['magazines', 'catalogs', 'catalogues'],
    'Aluminum Cans': ['aluminum cans', 'aluminum', 'soda cans', 'beer cans'],
    'Glass Bottles': ['glass bottles', 'glass jars', 'glass containers'],
    'Glass': ['glass'],
    'Plastic Bottles': ['plastic bottles', 'water bottles', 'soda bottles'],
    'Plastic Containers': ['plastic containers', 'plastic tubs', 'plastic jugs'],
    'Metal Cans': ['metal cans', 'tin cans', 'steel cans', 'food cans'],
    'Cartons': ['cartons', 'milk cartons', 'juice cartons', 'beverage cartons'],
    'Rigid Plastics': ['rigid plastics', 'hard plastics', 'plastic #1', 'plastic #2', 'pete', 'hdpe']
  },

  // Materials that are commonly NOT accepted in curbside recycling
  notAccepted: {
    'Plastic Bags': ['plastic bags', 'grocery bags', 'shopping bags', 'film plastic'],
    'Styrofoam': ['styrofoam', 'polystyrene', 'foam', 'packing peanuts'],
    'Food Waste': ['food waste', 'food scraps', 'food-soiled', 'food contaminated'],
    'Electronics': ['electronics', 'e-waste', 'computers', 'phones', 'tvs'],
    'Batteries': ['batteries', 'battery'],
    'Hazardous Waste': ['hazardous', 'toxic', 'chemicals', 'pesticides'],
    'Yard Waste': ['yard waste', 'grass clippings', 'leaves', 'branches'],
    'Textiles': ['textiles', 'clothing', 'clothes', 'fabric'],
    'Diapers': ['diapers', 'sanitary products'],
    'Ceramics': ['ceramics', 'pottery', 'dishes', 'china'],
    'Mirrors': ['mirrors', 'window glass', 'broken glass'],
    'Light Bulbs': ['light bulbs', 'bulbs', 'fluorescent'],
    'Tanglers': ['hoses', 'cords', 'wires', 'chains', 'tanglers'],
    'Scrap Metal': ['scrap metal', 'large metal', 'metal furniture']
  }
};

// Words that indicate something is NOT accepted
const REJECTION_PATTERNS = [
  'not accepted', 'do not', "don't", 'cannot', 'no ', 'never', 'prohibited', 'banned'
];

// Items that are almost universally not recyclable curbside
const ALWAYS_NOT_ACCEPTED = ['plastic bags', 'styrofoam', 'batteries', 'electronics', 'hazardous'];

// ============================================
// MAIN SERVICE FUNCTION
// ============================================

/**
 * Get recycling rules for a ZIP code
 * 
 * This is the main entry point for the recycling service.
 * It orchestrates the search and parsing process.
 * 
 * @param {string} zip - 5-digit US ZIP code
 * @returns {Promise<Object>} Structured recycling rules
 * 
 * @example
 * const rules = await getRecyclingRules('90210');
 * // Returns: { location, accepted, not_accepted, tips, sources, meta }
 */
async function getRecyclingRules(zip) {
  // Step 1: Search Google for recycling information
  const searchResults = await searchGoogle(zip);

  // Step 2: Check if we found anything
  if (searchResults.length === 0) {
    return {
      location: `ZIP ${zip}`,
      accepted: [],
      not_accepted: [],
      tips: [],
      sources: [],
      meta: { sourcesAnalyzed: 0, materialsFound: 0 },
      error: 'No recycling info found for this area'
    };
  }

  // Step 3: Extract structured rules from search results
  return extractRules(zip, searchResults);
}

/**
 * Extract structured recycling rules from raw search results
 * 
 * This is where the magic happens — we parse Google snippets
 * to extract specific recyclable materials and instructions.
 * 
 * @param {string} zip - ZIP code for location detection
 * @param {Array} searchResults - Array of { title, url, snippet }
 * @returns {Object} Structured recycling rules with confidence levels
 */
function extractRules(zip, searchResults) {
  // ----------------------------------------------------------------
  // Track materials found and which sources mentioned them
  // ----------------------------------------------------------------
  // We use Maps to track:
  // - Which materials were found
  // - How many different sources mentioned each material
  // - Any special notes/instructions for each material
  // ----------------------------------------------------------------
  const acceptedBySource = new Map();    // material -> Set of source URLs
  const notAcceptedBySource = new Map(); // material -> Set of source URLs
  const restrictionNotes = new Map();    // material -> extracted notes

  // ----------------------------------------------------------------
  // Process each search result
  // ----------------------------------------------------------------
  for (const result of searchResults) {
    const text = (result.snippet || '').toLowerCase();
    const url = result.url;

    // Check for accepted materials
    for (const [canonical, variations] of Object.entries(MATERIAL_DATABASE.accepted)) {
      for (const term of variations) {
        if (text.includes(term)) {
          // Add this source to the material's source set
          if (!acceptedBySource.has(canonical)) {
            acceptedBySource.set(canonical, new Set());
          }
          acceptedBySource.get(canonical).add(url);

          // Try to extract any special instructions
          extractNotes(text, term, canonical, restrictionNotes);
          break; // Found a match, move to next material category
        }
      }
    }

    // Check for not accepted materials
    const hasRejectionContext = REJECTION_PATTERNS.some(p => text.includes(p));

    for (const [canonical, variations] of Object.entries(MATERIAL_DATABASE.notAccepted)) {
      for (const term of variations) {
        if (text.includes(term)) {
          // Only count as "not accepted" if:
          // 1. There's rejection language in the text, OR
          // 2. It's a universally non-recyclable item
          if (hasRejectionContext || ALWAYS_NOT_ACCEPTED.some(a => term.includes(a))) {
            if (!notAcceptedBySource.has(canonical)) {
              notAcceptedBySource.set(canonical, new Set());
            }
            notAcceptedBySource.get(canonical).add(url);
            extractNotes(text, term, canonical, restrictionNotes);
          }
          break;
        }
      }
    }
  }

  // ----------------------------------------------------------------
  // Build the accepted materials list
  // ----------------------------------------------------------------
  // Materials confirmed by 2+ sources get "high" confidence
  // Single-source materials get "medium" confidence
  // ----------------------------------------------------------------
  const accepted = [];
  const singleSourceAccepted = [];

  for (const [material, sources] of acceptedBySource) {
    const item = {
      material,
      notes: restrictionNotes.get(material) || '',
      confidence: sources.size >= 2 ? 'high' : 'medium',
      sourceCount: sources.size
    };

    if (sources.size >= 2) {
      accepted.push(item);
    } else {
      singleSourceAccepted.push(item);
    }
  }

  // Sort: multi-source first, then alphabetically
  accepted.sort((a, b) => b.sourceCount - a.sourceCount || a.material.localeCompare(b.material));
  singleSourceAccepted.sort((a, b) => a.material.localeCompare(b.material));

  // Append single-source items with a verification note
  for (const item of singleSourceAccepted) {
    item.notes = item.notes || 'Verify with local guidelines';
    accepted.push(item);
  }

  // ----------------------------------------------------------------
  // Build the not accepted materials list
  // ----------------------------------------------------------------
  const notAccepted = [];
  for (const [material, sources] of notAcceptedBySource) {
    notAccepted.push({
      material,
      notes: restrictionNotes.get(material) || 'Check local drop-off options',
      confidence: sources.size >= 2 ? 'high' : 'medium',
      sourceCount: sources.size
    });
  }
  notAccepted.sort((a, b) => b.sourceCount - a.sourceCount || a.material.localeCompare(b.material));

  // ----------------------------------------------------------------
  // Deduplicate materials
  // ----------------------------------------------------------------
  // Remove overlaps like "Glass" when "Glass Bottles" already exists
  // ----------------------------------------------------------------
  const deduplicatedAccepted = deduplicateMaterials(accepted);
  const deduplicatedNotAccepted = deduplicateMaterials(notAccepted);

  // ----------------------------------------------------------------
  // Extract location
  // ----------------------------------------------------------------
  const location = extractLocation(zip, searchResults);

  // ----------------------------------------------------------------
  // Extract tips
  // ----------------------------------------------------------------
  const tips = extractTips(searchResults);

  // ----------------------------------------------------------------
  // Deduplicate sources
  // ----------------------------------------------------------------
  const sources = deduplicateSources(searchResults);

  // ----------------------------------------------------------------
  // Clean up output format
  // ----------------------------------------------------------------
  // Remove internal tracking fields (sourceCount) from final output
  // ----------------------------------------------------------------
  const cleanAccepted = deduplicatedAccepted.map(({ material, notes, confidence }) => ({
    material,
    notes: notes || (confidence === 'high' ? 'Confirmed by multiple sources' : 'Verify with source'),
    confidence
  }));

  const cleanNotAccepted = deduplicatedNotAccepted.map(({ material, notes, confidence }) => ({
    material,
    notes: notes || 'Check local guidelines for disposal',
    confidence
  }));

  // ----------------------------------------------------------------
  // Return the final structured result
  // ----------------------------------------------------------------
  return {
    location,
    accepted: cleanAccepted.length > 0 
      ? cleanAccepted 
      : [{ material: 'See sources below', notes: 'Could not extract specific materials', confidence: 'low' }],
    not_accepted: cleanNotAccepted.length > 0 ? cleanNotAccepted : [],
    tips,
    sources,
    meta: {
      sourcesAnalyzed: searchResults.length,
      materialsFound: acceptedBySource.size + notAcceptedBySource.size
    }
  };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Extract contextual notes/instructions for a material
 * 
 * Looks at the text surrounding a material mention to find
 * actionable instructions like "rinse", "flatten", etc.
 * 
 * @param {string} text - Full snippet text (lowercase)
 * @param {string} term - The search term that was found
 * @param {string} canonical - The canonical material name
 * @param {Map} notesMap - Map to store extracted notes
 */
function extractNotes(text, term, canonical, notesMap) {
  const idx = text.indexOf(term);
  if (idx === -1) return;

  // Get surrounding context (50 chars before and after the term)
  const start = Math.max(0, idx - 50);
  const end = Math.min(text.length, idx + term.length + 50);
  const context = text.slice(start, end);

  // Look for actionable instructions in the context
  const instructions = [];
  if (context.includes('rinse')) instructions.push('rinse before recycling');
  if (context.includes('flatten')) instructions.push('flatten');
  if (context.includes('empty')) instructions.push('empty completely');
  if (context.includes('clean')) instructions.push('must be clean');
  if (context.includes('dry')) instructions.push('keep dry');
  if (context.includes('remove') && context.includes('cap')) instructions.push('remove caps');
  if (context.includes('remove') && context.includes('lid')) instructions.push('remove lids');
  if (context.includes('label')) instructions.push('labels OK');

  // Store the first set of instructions found (don't overwrite)
  if (instructions.length > 0 && !notesMap.has(canonical)) {
    const formatted = instructions.join(', ');
    notesMap.set(canonical, formatted.charAt(0).toUpperCase() + formatted.slice(1));
  }
}

/**
 * Deduplicate materials to avoid redundancy
 * 
 * For example, if we found both "Glass" and "Glass Bottles",
 * we keep only "Glass Bottles" (more specific).
 * 
 * @param {Array} materials - Array of material objects
 * @returns {Array} Deduplicated array
 */
function deduplicateMaterials(materials) {
  const seen = new Set();
  const result = [];

  // Sort by specificity (longer names = more specific = first priority)
  const sorted = [...materials].sort((a, b) => b.material.length - a.material.length);

  for (const item of sorted) {
    const words = item.material.toLowerCase().split(' ');
    
    // Check if any word in this material is already in a seen material
    const isDuplicate = words.some(word =>
      [...seen].some(seenMaterial =>
        seenMaterial.toLowerCase().includes(word) && word.length > 3
      )
    );

    if (!isDuplicate) {
      seen.add(item.material);
      result.push(item);
    }
  }

  // Re-sort by source count (confidence)
  return result.sort((a, b) => (b.sourceCount || 0) - (a.sourceCount || 0));
}

/**
 * Extract location name from search results
 * 
 * Tries multiple strategies:
 * 1. Look for "City, ST" pattern in titles
 * 2. Look for city names in titles
 * 3. Extract from URL domain
 * 
 * @param {string} zip - ZIP code (fallback)
 * @param {Array} searchResults - Search results to analyze
 * @returns {string} Location name
 */
function extractLocation(zip, searchResults) {
  let location = `ZIP ${zip}`;

  for (const result of searchResults) {
    // Strategy 1: Look for "| City, ST" pattern in title
    const titleMatch = result.title.match(/\|\s*([A-Za-z\s]+,\s*[A-Z]{2})\s*$/) ||
                       result.title.match(/([A-Za-z\s]+(?:City|County|Town|Village|Borough))/i);
    if (titleMatch) {
      location = titleMatch[1].trim();
      break;
    }

    // Strategy 2: Extract from URL domain
    const urlMatch = result.url.match(/(?:www\.)?([a-z]+)(?:city|county|town|village)?\.(gov|org)/i);
    if (urlMatch) {
      let city = urlMatch[1];
      
      // Common city name mappings (URLs often concatenate words)
      const cityMappings = {
        'beverlyhills': 'Beverly Hills',
        'losangeles': 'Los Angeles',
        'newyork': 'New York',
        'sanfrancisco': 'San Francisco',
        'sandiego': 'San Diego',
        'santamonica': 'Santa Monica',
        'longbeach': 'Long Beach'
      };

      if (cityMappings[city.toLowerCase()]) {
        city = cityMappings[city.toLowerCase()];
      } else {
        // Try to split camelCase or just capitalize
        city = city.replace(/([a-z])([A-Z])/g, '$1 $2');
        city = city.charAt(0).toUpperCase() + city.slice(1);
      }

      location = city;
      break;
    }
  }

  return location;
}

/**
 * Extract recycling tips from search results
 * 
 * Looks for common recycling instructions in snippets
 * like "rinse containers", "flatten cardboard", etc.
 * 
 * @param {Array} searchResults - Search results to analyze
 * @returns {Array<string>} List of unique tips
 */
function extractTips(searchResults) {
  // Pattern -> Tip mapping
  const tipPatterns = [
    { pattern: /rinse/i, tip: 'Rinse containers before recycling' },
    { pattern: /flatten.*cardboard|cardboard.*flatten/i, tip: 'Flatten cardboard boxes' },
    { pattern: /empty/i, tip: 'Empty containers completely' },
    { pattern: /clean.*dry|dry.*clean/i, tip: 'Keep recyclables clean and dry' },
    { pattern: /remove.*(cap|lid)/i, tip: 'Remove caps and lids' },
    { pattern: /no.*bag|don't.*bag|loose/i, tip: 'Place recyclables loose in bin, not in bags' },
    { pattern: /label/i, tip: 'Labels can stay on containers' }
  ];

  const foundTips = new Set();

  for (const result of searchResults) {
    const text = result.snippet || '';
    for (const { pattern, tip } of tipPatterns) {
      if (pattern.test(text)) {
        foundTips.add(tip);
      }
    }
  }

  return [...foundTips];
}

/**
 * Deduplicate sources by domain
 * 
 * Keeps only one result per domain to avoid showing
 * multiple pages from the same website.
 * 
 * @param {Array} searchResults - Search results to deduplicate
 * @returns {Array<{title: string, url: string}>} Deduplicated sources
 */
function deduplicateSources(searchResults) {
  const seenDomains = new Set();
  const sources = [];

  for (const result of searchResults) {
    try {
      const domain = new URL(result.url).hostname;
      if (!seenDomains.has(domain)) {
        seenDomains.add(domain);
        sources.push({ title: result.title, url: result.url });
      }
    } catch {
      // If URL parsing fails, include it anyway
      sources.push({ title: result.title, url: result.url });
    }
  }

  return sources;
}

// ============================================
// MATERIAL COMPARISON
// ============================================
// 
// Compares detected materials from AI image analysis
// against the recycling rules for a specific location.
// 
// ============================================

/**
 * Compare detected materials against recycling rules
 * 
 * @param {Array} detectedItems - Items from AI analysis [{name, materials, confidence, preparation}]
 * @param {Object} recyclingRules - Rules from getRecyclingRules()
 * @returns {Object} Comparison results with recyclability for each item
 */
function compareMaterials(detectedItems, recyclingRules) {
  if (!detectedItems || !Array.isArray(detectedItems)) {
    return { items: [], summary: { recyclable: 0, notRecyclable: 0, unknown: 0 } };
  }

  // Build lookup sets for quick matching
  const acceptedMaterials = new Set();
  const notAcceptedMaterials = new Set();
  
  // Add canonical names and variations to sets
  for (const [canonical, variations] of Object.entries(MATERIAL_DATABASE.accepted)) {
    acceptedMaterials.add(canonical.toLowerCase());
    for (const v of variations) {
      acceptedMaterials.add(v.toLowerCase());
    }
  }
  
  for (const [canonical, variations] of Object.entries(MATERIAL_DATABASE.notAccepted)) {
    notAcceptedMaterials.add(canonical.toLowerCase());
    for (const v of variations) {
      notAcceptedMaterials.add(v.toLowerCase());
    }
  }

  // Also add materials specifically accepted/not accepted in user's location
  if (recyclingRules.accepted) {
    for (const item of recyclingRules.accepted) {
      acceptedMaterials.add(item.material.toLowerCase());
    }
  }
  if (recyclingRules.not_accepted) {
    for (const item of recyclingRules.not_accepted) {
      notAcceptedMaterials.add(item.material.toLowerCase());
    }
  }

  const results = [];
  let recyclableCount = 0;
  let notRecyclableCount = 0;
  let unknownCount = 0;

  for (const item of detectedItems) {
    const itemMaterials = item.materials || [];
    const itemName = (item.name || '').toLowerCase();
    const materialResults = [];
    let itemRecyclable = true;
    let hasUnknown = false;

    for (const material of itemMaterials) {
      const materialLower = material.toLowerCase();
      
      // Use both item name and material for matching
      // e.g. item "plastic bottle" with material "plastic" should match "Plastic Bottles"
      const searchTerms = [itemName, materialLower];
      
      let isAccepted = false;
      let isNotAccepted = false;
      let matchedRule = null;
      let acceptedMatchSpecificity = 0;
      let notAcceptedMatchSpecificity = 0;

      // Check accepted materials - track how specific the match is
      for (const accepted of acceptedMaterials) {
        for (const term of searchTerms) {
          if (term.includes(accepted) || accepted.includes(term)) {
            // More specific match = longer matched string
            const specificity = Math.min(term.length, accepted.length);
            if (specificity > acceptedMatchSpecificity) {
              acceptedMatchSpecificity = specificity;
              isAccepted = true;
              matchedRule = recyclingRules.accepted?.find(r => 
                r.material.toLowerCase().includes(term) || 
                term.includes(r.material.toLowerCase())
              );
            }
          }
        }
      }

      // Check not accepted materials
      for (const notAccepted of notAcceptedMaterials) {
        for (const term of searchTerms) {
          if (term.includes(notAccepted) || notAccepted.includes(term)) {
            const specificity = Math.min(term.length, notAccepted.length);
            if (specificity > notAcceptedMatchSpecificity) {
              notAcceptedMatchSpecificity = specificity;
              isNotAccepted = true;
            }
          }
        }
      }

      // The more specific match wins
      // e.g. "plastic bottle" matching "Plastic Bottles" (accepted, specificity=14) 
      // beats "plastic" matching "Plastic Bags" (not accepted, specificity=7)
      if (isAccepted && isNotAccepted) {
        if (acceptedMatchSpecificity >= notAcceptedMatchSpecificity) {
          isNotAccepted = false;
        } else {
          isAccepted = false;
          matchedRule = recyclingRules.not_accepted?.find(r => 
            r.material.toLowerCase().includes(itemName) || 
            itemName.includes(r.material.toLowerCase()) ||
            r.material.toLowerCase().includes(materialLower) || 
            materialLower.includes(r.material.toLowerCase())
          );
        }
      }

      if (isNotAccepted) {
        itemRecyclable = false;
        materialResults.push({
          material,
          status: 'not_recyclable',
          recyclable: false,
          reason: matchedRule?.notes || 'Not accepted in curbside recycling'
        });
      } else if (isAccepted) {
        materialResults.push({
          material,
          status: 'recyclable',
          recyclable: true,
          notes: matchedRule?.notes || null
        });
      } else {
        hasUnknown = true;
        materialResults.push({
          material,
          status: 'unknown',
          recyclable: 'unknown',
          reason: 'Material not recognized - check local guidelines'
        });
      }
    }

    // Determine overall item recyclability
    // If any material is accepted and none are explicitly rejected, it's recyclable
    let overallStatus;
    const hasRecyclableMaterial = materialResults.some(m => m.status === 'recyclable');
    if (!itemRecyclable) {
      overallStatus = 'not_recyclable';
      notRecyclableCount++;
    } else if (hasRecyclableMaterial) {
      overallStatus = 'recyclable';
      recyclableCount++;
    } else if (hasUnknown) {
      overallStatus = 'check_locally';
      unknownCount++;
    } else {
      overallStatus = 'recyclable';
      recyclableCount++;
    }

    results.push({
      name: item.name,
      confidence: item.confidence,
      preparation: item.preparation,
      overallStatus,
      materials: materialResults
    });
  }

  return {
    items: results,
    location: recyclingRules.location || 'Unknown',
    summary: {
      recyclable: recyclableCount,
      notRecyclable: notRecyclableCount,
      unknown: unknownCount,
      total: detectedItems.length
    },
    tips: recyclingRules.tips || []
  };
}

// ============================================
// Export the service
// ============================================
module.exports = {
  getRecyclingRules,
  extractRules,
  compareMaterials,
  
  // Export helpers for testing
  extractNotes,
  extractLocation,
  extractTips,
  deduplicateMaterials,
  deduplicateSources,
  
  // Export database for extension
  MATERIAL_DATABASE
};
