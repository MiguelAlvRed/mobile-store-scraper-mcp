/**
 * Parser for similar apps from Google Play
 */

/**
 * Extracts similar apps from Google Play HTML page
 * @param {string} html - HTML content from app page
 * @returns {Array<Object>}
 */
export function parseSimilar(html) {
  if (!html || typeof html !== 'string') {
    return [];
  }

  const similarApps = [];

  try {
    // Google Play similar apps are in a "You might also like" section
    // Look for similar apps section
    const similarSection = html.match(/<div[^>]*class=["'][^"']*similar["'][^>]*>([\s\S]*?)<\/div>/i) ||
                           html.match(/<section[^>]*class=["'][^"']*you-might-also-like["'][^>]*>([\s\S]*?)<\/section>/i);

    if (similarSection) {
      const sectionHtml = similarSection[1];
      
      // Extract app links
      const appLinkMatches = sectionHtml.matchAll(/<a[^>]*href=["']\/store\/apps\/details\?id=([^&"']+)["'][^>]*>/gi);
      
      for (const match of appLinkMatches) {
        const appId = match[1];
        
        // Try to extract title and other info from surrounding HTML
        const linkStart = sectionHtml.indexOf(match[0]);
        const contextHtml = sectionHtml.substring(Math.max(0, linkStart - 500), linkStart + 500);
        
        const titleMatch = contextHtml.match(/<span[^>]*title=["']([^"']+)["']/i) ||
                          contextHtml.match(/<div[^>]*class=["'][^"']*title["'][^>]*>([^<]+)<\/div>/i);
        const title = titleMatch ? titleMatch[1].trim() : null;

        const iconMatch = contextHtml.match(/<img[^>]*src=["']([^"']+)["'][^>]*>/i);
        const icon = iconMatch ? iconMatch[1] : null;

        const scoreMatch = contextHtml.match(/(\d+\.?\d*)\s*stars?/i);
        const score = scoreMatch ? parseFloat(scoreMatch[1]) : null;

        if (appId && !similarApps.find(a => a.appId === appId)) {
          similarApps.push({
            appId: appId,
            url: `https://play.google.com/store/apps/details?id=${appId}`,
            title: title,
            icon: icon,
            score: score,
            scoreText: score ? score.toFixed(1) : null,
            priceText: null,
            free: null,
            summary: null,
            developer: null,
            developerId: null,
          });
        }
      }
    }

    // Also try extracting from script tags
    const scriptMatches = html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi);
    
    for (const match of scriptMatches) {
      const scriptContent = match[1];
      
      if (scriptContent.includes('similar') || scriptContent.includes('recommended')) {
        try {
          // Try to find similar apps in JSON structures
          const similarMatch = scriptContent.match(/similarApps["']?\s*:\s*\[([\s\S]*?)\]/i);
          if (similarMatch) {
            const similarData = similarMatch[1];
            const appIdMatches = similarData.matchAll(/id["']?\s*:\s*["']([^"']+)["']/gi);
            
            for (const idMatch of appIdMatches) {
              const appId = idMatch[1];
              if (appId && !similarApps.find(a => a.appId === appId)) {
                similarApps.push({
                  appId: appId,
                  url: `https://play.google.com/store/apps/details?id=${appId}`,
                });
              }
            }
          }
        } catch (e) {
          // Continue
        }
      }
    }

    return similarApps;
  } catch (error) {
    console.error('Error parsing Google Play similar apps:', error);
    return [];
  }
}

