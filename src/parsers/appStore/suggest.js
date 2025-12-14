/**
 * Parser for search suggestions/autocomplete
 */

/**
 * Normalizes suggestion data from iTunes Search Hints API
 * @param {Object} data - Raw suggestion API response
 * @returns {Array<Object>}
 */
export function parseSuggest(data) {
  if (!data || !data.hints || !Array.isArray(data.hints)) {
    return [];
  }

  return data.hints.map(hint => ({
    term: hint.term || null,
    priority: hint.priority || 0,
  })).sort((a, b) => (b.priority || 0) - (a.priority || 0));
}

