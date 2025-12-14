/**
 * Parser for search results
 */

import { parseApps } from './app.js';

/**
 * Parses search results from iTunes Search API
 * @param {Object} data - Raw iTunes API response
 * @returns {Object}
 */
export function parseSearch(data) {
  const apps = parseApps(data);
  
  return {
    results: apps,
    count: apps.length,
    total: data.resultCount || apps.length,
  };
}

