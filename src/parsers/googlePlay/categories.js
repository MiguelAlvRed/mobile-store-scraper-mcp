/**
 * Parser for Google Play categories list
 */

/**
 * Extracts categories from Google Play HTML
 * @param {string} html - HTML content from Google Play store page
 * @returns {Array<string>}
 */
export function parseCategories(html) {
  if (!html || typeof html !== 'string') {
    return [];
  }

  const categories = [];

  try {
    // Google Play categories are in navigation/dropdown menus
    // Look for category links
    const categoryLinkMatches = html.matchAll(/<a[^>]*href=["'][^"']*\/store\/apps\/category\/([^/"']+)["'][^>]*>/gi);
    
    for (const match of categoryLinkMatches) {
      const category = match[1];
      if (category && !categories.includes(category)) {
        categories.push(category);
      }
    }

    // Also try extracting from script tags with category data
    const scriptMatches = html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi);
    
    for (const match of scriptMatches) {
      const scriptContent = match[1];
      
      if (scriptContent.includes('category') || scriptContent.includes('CATEGORY')) {
        try {
          // Try to find category arrays
          const categoryArrayMatch = scriptContent.match(/categories["']?\s*:\s*\[([\s\S]*?)\]/i);
          if (categoryArrayMatch) {
            const categoryData = categoryArrayMatch[1];
            const categoryMatches = categoryData.matchAll(/"([^"]+)"/g);
            
            for (const catMatch of categoryMatches) {
              const category = catMatch[1];
              if (category && !categories.includes(category)) {
                categories.push(category);
              }
            }
          }
        } catch (e) {
          // Continue
        }
      }
    }

    // If no categories found, return common ones
    if (categories.length === 0) {
      return [
        'APPLICATION',
        'GAME',
        'ART_AND_DESIGN',
        'AUTO_AND_VEHICLES',
        'BEAUTY',
        'BOOKS_AND_REFERENCE',
        'BUSINESS',
        'COMICS',
        'COMMUNICATION',
        'DATING',
        'EDUCATION',
        'ENTERTAINMENT',
        'EVENTS',
        'FINANCE',
        'FOOD_AND_DRINK',
        'HEALTH_AND_FITNESS',
        'HOUSE_AND_HOME',
        'LIBRARIES_AND_DEMO',
        'LIFESTYLE',
        'MAPS_AND_NAVIGATION',
        'MEDICAL',
        'MUSIC_AND_AUDIO',
        'NEWS_AND_MAGAZINES',
        'PARENTING',
        'PERSONALIZATION',
        'PHOTOGRAPHY',
        'PRODUCTIVITY',
        'SHOPPING',
        'SOCIAL',
        'SPORTS',
        'TOOLS',
        'TRAVEL_AND_LOCAL',
        'VIDEO_PLAYERS',
        'WEATHER',
      ];
    }

    return categories.sort();
  } catch (error) {
    console.error('Error parsing Google Play categories:', error);
    return [];
  }
}

