/**
 * Parser for Google Play list/ranking results
 */

import { parseSearch } from './search.js';

/**
 * Extracts app list from Google Play category/collection page
 * @param {string} html - HTML content from list page
 * @returns {Array<Object>}
 */
export function parseList(html) {
  // List pages use similar structure to search results
  return parseSearch(html);
}

