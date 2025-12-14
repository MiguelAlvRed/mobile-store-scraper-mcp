/**
 * Parser for Google Play app detail data from HTML
 */

/**
 * Extracts app data from Google Play HTML page
 * @param {string} html - HTML content from Google Play page
 * @returns {Object|null}
 */
export function parseApp(html) {
  if (!html || typeof html !== 'string') {
    return null;
  }

  try {
    // Extract JSON-LD structured data if available
    const jsonLdMatch = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/is);
    let appData = {};
    
    if (jsonLdMatch) {
      try {
        const jsonLd = JSON.parse(jsonLdMatch[1]);
        if (jsonLd['@type'] === 'SoftwareApplication') {
          appData = {
            title: jsonLd.name || null,
            description: jsonLd.description || null,
            url: jsonLd.url || null,
            icon: jsonLd.image || null,
            aggregateRating: jsonLd.aggregateRating || null,
            offers: jsonLd.offers || null,
          };
        }
      } catch (e) {
        // Continue with HTML parsing
      }
    }

    // Extract appId from URL or page
    const appIdMatch = html.match(/data-docid=["']([^"']+)["']/) || 
                       html.match(/id=["']([^"']+)["'][^>]*data-docid/) ||
                       html.match(/\/store\/apps\/details\?id=([^&"']+)/);
    const appId = appIdMatch ? appIdMatch[1] : null;

    // Extract title
    const titleMatch = html.match(/<h1[^>]*class=["'][^"']*title["'][^>]*>([^<]+)<\/h1>/i) ||
                      html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
    const title = titleMatch ? titleMatch[1].trim() : appData.title;

    // Extract developer
    const devMatch = html.match(/<a[^>]*href=["'][^"']*\/store\/apps\/developer[^"']*["'][^>]*>([^<]+)<\/a>/i) ||
                    html.match(/<span[^>]*itemprop=["']name["'][^>]*>([^<]+)<\/span>/i);
    const developer = devMatch ? devMatch[1].trim() : null;

    // Extract developer ID
    const devIdMatch = html.match(/\/store\/apps\/developer\?id=([^&"']+)/);
    const developerId = devIdMatch ? devIdMatch[1] : null;

    // Extract price
    const priceMatch = html.match(/<meta[^>]*itemprop=["']price["'][^>]*content=["']([^"']+)["']/i) ||
                       html.match(/<span[^>]*class=["'][^"']*price["'][^>]*>([^<]+)<\/span>/i);
    const priceText = priceMatch ? priceMatch[1].trim() : 'Free';
    const free = priceText.toLowerCase() === 'free' || priceText === '0' || !priceText;

    // Extract rating
    const ratingMatch = html.match(/<div[^>]*class=["'][^"']*rating["'][^>]*>([^<]+)<\/div>/i) ||
                       html.match(/<meta[^>]*itemprop=["']ratingValue["'][^>]*content=["']([^"']+)["']/i);
    const rating = ratingMatch ? parseFloat(ratingMatch[1]) : null;

    // Extract rating count
    const ratingCountMatch = html.match(/<meta[^>]*itemprop=["']ratingCount["'][^>]*content=["']([^"']+)["']/i) ||
                             html.match(/([\d,]+)\s*(?:ratings|reviews)/i);
    const ratingCount = ratingCountMatch ? parseInt(ratingCountMatch[1].replace(/,/g, ''), 10) : 0;

    // Extract icon
    const iconMatch = html.match(/<img[^>]*class=["'][^"']*cover-image["'][^>]*src=["']([^"']+)["']/i) ||
                     html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
    const icon = iconMatch ? iconMatch[1] : appData.icon;

    // Extract screenshots
    const screenshotMatches = html.matchAll(/<img[^>]*class=["'][^"']*screenshot["'][^>]*src=["']([^"']+)["']/gi);
    const screenshots = Array.from(screenshotMatches, m => m[1]).filter(Boolean);

    // Extract summary/description
    const descMatch = html.match(/<div[^>]*class=["'][^"']*description["'][^>]*>([\s\S]*?)<\/div>/i) ||
                     html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
    const description = descMatch ? descMatch[1].replace(/<[^>]+>/g, '').trim() : appData.description;

    // Extract version with multiple patterns
    const versionPatterns = [
      /Current Version["'][^>]*>([^<]+)<\/div>/i,
      /Version["'][^>]*>([^<]+)<\/div>/i,
      /<div[^>]*itemprop=["']softwareVersion["'][^>]*>([^<]+)<\/div>/i,
      /softwareVersion["']:\s*["']([^"']+)["']/i,
      /version["']:\s*["']([^"']+)["']/i,
    ];
    let version = null;
    for (const pattern of versionPatterns) {
      const match = html.match(pattern);
      if (match) {
        version = match[1].trim();
        break;
      }
    }

    // Extract content rating with multiple patterns
    const contentRatingPatterns = [
      /Content Rating["'][^>]*>([^<]+)<\/div>/i,
      /<div[^>]*itemprop=["']contentRating["'][^>]*>([^<]+)<\/div>/i,
      /contentRating["']:\s*["']([^"']+)["']/i,
    ];
    let contentRating = null;
    for (const pattern of contentRatingPatterns) {
      const match = html.match(pattern);
      if (match) {
        contentRating = match[1].trim();
        break;
      }
    }

    // Extract installs count with multiple patterns
    const installsPatterns = [
      /([\d,]+)\+?\s*(?:installs|downloads)/i,
      /<div[^>]*itemprop=["']numDownloads["'][^>]*>([^<]+)<\/div>/i,
      /numDownloads["']:\s*["']([^"']+)["']/i,
      /installs["']:\s*["']([^"']+)["']/i,
    ];
    let installs = null;
    for (const pattern of installsPatterns) {
      const match = html.match(pattern);
      if (match) {
        installs = match[1].replace(/[^0-9]/g, '');
        break;
      }
    }

    // Extract size
    const sizePatterns = [
      /Size["'][^>]*>([^<]+)<\/div>/i,
      /<div[^>]*itemprop=["']fileSize["'][^>]*>([^<]+)<\/div>/i,
      /fileSize["']:\s*["']([^"']+)["']/i,
    ];
    let size = null;
    for (const pattern of sizePatterns) {
      const match = html.match(pattern);
      if (match) {
        size = match[1].trim();
        break;
      }
    }

    // Extract Android version requirement
    const androidVersionPatterns = [
      /Requires Android["'][^>]*>([^<]+)<\/div>/i,
      /androidVersion["']:\s*["']([^"']+)["']/i,
      /operatingSystem["']:\s*["']Android\s*([^"']+)["']/i,
    ];
    let androidVersion = null;
    let androidVersionText = null;
    for (const pattern of androidVersionPatterns) {
      const match = html.match(pattern);
      if (match) {
        androidVersionText = match[1].trim();
        // Try to extract version number
        const versionMatch = androidVersionText.match(/(\d+(?:\.\d+)?)/);
        androidVersion = versionMatch ? versionMatch[1] : null;
        break;
      }
    }

    // Extract recent changes/release notes
    const recentChangesPatterns = [
      /What's New["'][^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]*class=["'][^"']*recent-changes["'][^>]*>([\s\S]*?)<\/div>/i,
      /releaseNotes["']:\s*["']([^"']+)["']/i,
    ];
    let recentChanges = null;
    for (const pattern of recentChangesPatterns) {
      const match = html.match(pattern);
      if (match) {
        recentChanges = match[1].replace(/<[^>]+>/g, '').trim();
        if (recentChanges.length > 500) {
          recentChanges = recentChanges.substring(0, 500) + '...';
        }
        break;
      }
    }

    // Extract ad supported flag
    const adSupportedMatch = html.match(/Contains Ads["']/i) || html.match(/adSupported["']:\s*true/i);
    const adSupported = adSupportedMatch ? true : null;

    // Extract in-app purchases flag
    const inAppPurchasesMatch = html.match(/In-app purchases["']/i) || html.match(/offersIAP["']:\s*true/i);
    const inAppPurchases = inAppPurchasesMatch ? true : null;

    // Extract category
    const categoryMatch = html.match(/<a[^>]*href=["'][^"']*\/store\/apps\/category\/([^/"']+)["'][^>]*>/i);
    const category = categoryMatch ? categoryMatch[1] : null;

    // Extract updated date
    const updatedMatch = html.match(/Updated["'][^>]*>([^<]+)<\/div>/i);
    const updated = updatedMatch ? updatedMatch[1].trim() : null;

    return {
      appId: appId,
      title: title,
      url: appId ? `https://play.google.com/store/apps/details?id=${appId}` : null,
      summary: description ? description.substring(0, 200) : null,
      description: description,
      developer: developer,
      developerId: developerId,
      developerEmail: null, // Not easily extractable from public page
      developerWebsite: null,
      developerAddress: null,
      icon: icon,
      headerImage: null,
      score: rating,
      scoreText: rating ? rating.toFixed(1) : null,
      ratings: ratingCount,
      reviews: ratingCount, // Google Play uses same count
      price: free ? 0 : null,
      priceText: priceText,
      free: free,
      currency: free ? null : 'USD', // Default, may vary
      version: version,
      contentRating: contentRating,
      contentRatingDescription: null,
      adSupported: adSupported,
      inAppPurchases: inAppPurchases,
      screenshots: screenshots,
      video: null,
      videoImage: null,
      recentChanges: recentChanges,
      comments: [], // Will be populated by reviews parser
      editorsChoice: false,
      category: category,
      categoryId: category,
      size: size,
      androidVersion: androidVersion,
      androidVersionText: androidVersionText,
      updated: updated,
      installs: installs,
      minInstalls: null,
      maxInstalls: null,
      requiresAndroid: androidVersionText,
      permissions: [], // Will be populated by permissions parser
      similarApps: [], // Will be populated by similar parser
    };
  } catch (error) {
    console.error('Error parsing Google Play app:', error);
    return null;
  }
}

