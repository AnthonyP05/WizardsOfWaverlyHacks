/**
 * ============================================
 * Search Service
 * ============================================
 * 
 * Handles all external search API interactions.
 * Currently uses SerpAPI to query Google for recycling information.
 * 
 * WHY A SEPARATE SERVICE?
 * - Easy to swap out SerpAPI for another provider later
 * - Keeps API-specific logic isolated from business logic
 * - Makes testing easier (can mock this service)
 * 
 * FRONTEND INTEGRATION:
 * This service is used internally by recyclingService.
 * Frontend should NOT call this directly — use the /api/recycling endpoint.
 * 
 * ============================================
 */

/**
 * Search Google for recycling information via SerpAPI
 * 
 * @param {string} zip - 5-digit US ZIP code
 * @returns {Promise<Array<{title: string, url: string, snippet: string}>>}
 *          Array of search results with title, URL, and snippet text
 * 
 * @example
 * const results = await searchGoogle('90210');
 * // Returns: [
 * //   { title: 'Beverly Hills Recycling...', url: 'https://...', snippet: '...' },
 * //   ...
 * // ]
 */
async function searchGoogle(zip) {
  // ----------------------------------------------------------------
  // Build the search query
  // ----------------------------------------------------------------
  // We craft a specific query to get relevant municipal recycling pages.
  // Keywords like "curbside" and "accepted materials" help filter out
  // irrelevant results (news articles, recycling companies, etc.)
  // ----------------------------------------------------------------
  const query = `curbside recycling rules accepted materials ${zip}`;

  // ----------------------------------------------------------------
  // Call SerpAPI
  // ----------------------------------------------------------------
  // SerpAPI is a Google Search wrapper that returns clean JSON.
  // Free tier: 100 searches/month (plenty for hackathon)
  // Docs: https://serpapi.com/search-api
  // ----------------------------------------------------------------
  const response = await fetch(
    `https://serpapi.com/search.json?` +
    `q=${encodeURIComponent(query)}` +
    `&api_key=${process.env.SERP_API_KEY}` +
    `&num=5`  // Only grab top 5 results — that's enough context
  );

  // Parse the response
  const data = await response.json();

  // ----------------------------------------------------------------
  // Log for debugging (remove in production)
  // ----------------------------------------------------------------
  if (process.env.DEBUG === 'true') {
    console.log('SerpAPI response:', JSON.stringify(data, null, 2));
  }

  // ----------------------------------------------------------------
  // Transform results into a clean format
  // ----------------------------------------------------------------
  // We only need three things from each result:
  // - title: The page title (helps identify the source)
  // - url: Link to the actual page (for user verification)
  // - snippet: Google's preview text (often contains the actual rules!)
  // ----------------------------------------------------------------
  const results = data.organic_results?.map(result => ({
    title: result.title,
    url: result.link,
    snippet: result.snippet
  })) || [];

  return results;
}

// ============================================
// Export the service
// ============================================
module.exports = {
  searchGoogle
};
