/**
 * Parser for similar apps
 * Note: Similar apps require HTML parsing from the App Store web page
 */

/**
 * Extracts similar apps from App Store HTML page
 * This is a simplified version - full implementation would require more robust HTML parsing
 * @param {string} html - HTML content from App Store page
 * @returns {Array<Object>}
 */
export function parseSimilarFromHTML(html) {
  const similarApps = [];
  
  // App Store embeds similar apps in JSON-LD or in script tags
  // This is a simplified parser - in production you'd want more robust parsing
  try {
    // Try to find JSON-LD structured data
    const jsonLdMatches = html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/gis);
    for (const match of jsonLdMatches) {
      try {
        const jsonLd = JSON.parse(match[1]);
        if (jsonLd['@graph']) {
          const apps = jsonLd['@graph'].filter(item => item['@type'] === 'SoftwareApplication');
          apps.forEach(app => {
            if (app.url) {
              similarApps.push({
                id: extractIdFromUrl(app.url) || null,
                appId: null,
                title: app.name || null,
                url: app.url || null,
              });
            }
          });
        }
      } catch (e) {
        // Skip invalid JSON
      }
    }

    // Try to extract app IDs from App Store links
    const appLinkMatches = html.matchAll(/apps\.apple\.com\/[^\/]+\/app\/id(\d+)/gi);
    const seenIds = new Set();
    for (const match of appLinkMatches) {
      const appId = match[1];
      if (!seenIds.has(appId)) {
        seenIds.add(appId);
        similarApps.push({
          id: parseInt(appId, 10),
          appId: null,
          title: null,
          url: `https://apps.apple.com/app/id${appId}`,
        });
      }
    }
  } catch (error) {
    // If parsing fails, return empty array
    // Error is silently handled
  }

  return similarApps;
}

/**
 * Extracts app ID from App Store URL
 * @param {string} url - App Store URL
 * @returns {string|null}
 */
function extractIdFromUrl(url) {
  if (!url) return null;
  const match = url.match(/\/id(\d+)/);
  return match ? match[1] : null;
}

/**
 * For now, similar apps will need to use the search API with related terms
 * This is a fallback approach
 */
export async function getSimilarAppsViaSearch(appData) {
  // This would use search with related keywords
  // For now, return empty array
  return [];
}

