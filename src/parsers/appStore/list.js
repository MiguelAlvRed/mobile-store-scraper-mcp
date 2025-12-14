/**
 * Parser for App Store list/ranking data from RSS feed
 */

import { parseApp, parseApps } from './app.js';

/**
 * Parses RSS feed data from App Store rankings
 * @param {Object} data - Raw RSS JSON response
 * @returns {Array<Object>}
 */
export function parseList(data) {
  if (!data || !data.feed) {
    return [];
  }

  const apps = [];

  try {
    // RSS feed format has entries in feed.entry
    if (data.feed.entry && Array.isArray(data.feed.entry)) {
      for (const entry of data.feed.entry) {
        // Convert RSS entry to app format
        const app = {
          trackId: extractId(entry),
          bundleId: extractBundleId(entry),
          trackName: extractTitle(entry),
          artistName: extractArtist(entry),
          artistId: extractArtistId(entry),
          description: extractDescription(entry),
          price: extractPrice(entry),
          currency: 'USD',
          averageUserRating: extractRating(entry),
          userRatingCount: extractRatingCount(entry),
          artworkUrl100: extractIcon(entry),
          artworkUrl512: extractIcon(entry),
          screenshotUrls: extractScreenshots(entry),
          primaryGenreName: extractCategory(entry),
          releaseDate: extractReleaseDate(entry),
          kind: 'software',
        };

        // Use parseApp to normalize
        const lookupData = { results: [app] };
        const normalizedApp = parseApp(lookupData);
        if (normalizedApp) {
          apps.push(normalizedApp);
        }
      }
    }
  } catch (error) {
    console.error('Error parsing App Store list:', error);
  }

  return apps;
}

/**
 * Extracts app ID from RSS entry
 */
function extractId(entry) {
  return entry.id?.attributes?.['im:id'] || 
         entry['im:id']?.label || 
         entry.id?.label ||
         null;
}

/**
 * Extracts bundle ID from RSS entry
 */
function extractBundleId(entry) {
  return entry['im:bundleId']?.label || null;
}

/**
 * Extracts title from RSS entry
 */
function extractTitle(entry) {
  return entry.title?.label || 
         entry['im:name']?.label || 
         entry.title || 
         null;
}

/**
 * Extracts artist/developer from RSS entry
 */
function extractArtist(entry) {
  return entry['im:artist']?.label || 
         entry.author?.name?.label || 
         entry['im:artist']?.label || 
         null;
}

/**
 * Extracts artist ID from RSS entry
 */
function extractArtistId(entry) {
  return entry['im:artist']?.attributes?.href?.match(/id(\d+)/)?.[1] || null;
}

/**
 * Extracts description from RSS entry
 */
function extractDescription(entry) {
  return entry.summary?.label || 
         entry.content?.label || 
         entry.description?.label || 
         null;
}

/**
 * Extracts price from RSS entry
 */
function extractPrice(entry) {
  const priceStr = entry['im:price']?.label || entry['im:price'] || '0';
  const price = parseFloat(priceStr.replace(/[^0-9.]/g, '')) || 0;
  return price;
}

/**
 * Extracts rating from RSS entry
 */
function extractRating(entry) {
  const ratingStr = entry['im:rating']?.label || entry['im:rating'] || null;
  return ratingStr ? parseFloat(ratingStr) : null;
}

/**
 * Extracts rating count from RSS entry
 */
function extractRatingCount(entry) {
  const countStr = entry['im:ratingCount']?.label || entry['im:ratingCount'] || '0';
  return parseInt(countStr.replace(/[^0-9]/g, ''), 10) || 0;
}

/**
 * Extracts icon from RSS entry
 */
function extractIcon(entry) {
  const images = entry['im:image'];
  if (Array.isArray(images) && images.length > 0) {
    // Get the largest image (usually last)
    return images[images.length - 1]?.label || images[0]?.label || null;
  }
  return images?.label || null;
}

/**
 * Extracts screenshots from RSS entry
 */
function extractScreenshots(entry) {
  // RSS feed typically doesn't include screenshots
  return [];
}

/**
 * Extracts category from RSS entry
 */
function extractCategory(entry) {
  return entry.category?.attributes?.label || 
         entry['im:category']?.attributes?.label || 
         entry.category?.label || 
         null;
}

/**
 * Extracts release date from RSS entry
 */
function extractReleaseDate(entry) {
  return entry['im:releaseDate']?.label || 
         entry.published?.label || 
         entry.updated?.label || 
         null;
}

