/**
 * Parser for Google Play search results
 */

import { parseApp } from './app.js';

/**
 * Extracts search results from Google Play HTML
 * @param {string} html - HTML content from search page
 * @returns {Array<Object>}
 */
export function parseSearch(html) {
  if (!html || typeof html !== 'string') {
    return [];
  }

  const apps = [];

  try {
    // Google Play search results are in script tags with JSON data
    // Look for _df_ prefixed data
    const scriptMatches = html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi);
    
    for (const match of scriptMatches) {
      const scriptContent = match[1];
      
      // Try to find app data in various formats
      // Google Play uses different structures, we'll try multiple patterns
      
      // Pattern 1: Look for app IDs in links
      const appLinkMatches = scriptContent.matchAll(/\/store\/apps\/details\?id=([^&"']+)/gi);
      for (const linkMatch of appLinkMatches) {
        const appId = linkMatch[1];
        if (appId && !apps.find(a => a.appId === appId)) {
          apps.push({
            appId: appId,
            url: `https://play.google.com/store/apps/details?id=${appId}`,
          });
        }
      }
    }

    // Also try extracting from visible HTML
    const visibleAppMatches = html.matchAll(/<a[^>]*href=["']\/store\/apps\/details\?id=([^&"']+)["'][^>]*>/gi);
    for (const visibleMatch of visibleAppMatches) {
      const appId = visibleMatch[1];
      if (appId && !apps.find(a => a.appId === appId)) {
        // Try to extract title from surrounding HTML
        const titleMatch = html.substring(html.indexOf(visibleMatch[0])).match(/<span[^>]*title=["']([^"']+)["']/i);
        const title = titleMatch ? titleMatch[1] : null;
        
        apps.push({
          appId: appId,
          title: title,
          url: `https://play.google.com/store/apps/details?id=${appId}`,
        });
      }
    }

    // Remove duplicates
    const uniqueApps = [];
    const seenIds = new Set();
    for (const app of apps) {
      if (app.appId && !seenIds.has(app.appId)) {
        seenIds.add(app.appId);
        uniqueApps.push(app);
      }
    }

    return uniqueApps;
  } catch (error) {
    console.error('Error parsing Google Play search:', error);
    return [];
  }
}

/**
 * Parses search results and returns structured data
 * @param {string} html - HTML content
 * @returns {Object}
 */
export function parseSearchResults(html) {
  const apps = parseSearch(html);
  
  return {
    results: apps,
    count: apps.length,
  };
}

