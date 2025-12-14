/**
 * Parser for Google Play search suggestions
 */

/**
 * Extracts suggestions from Google Play suggest API response
 * @param {Object|string} data - Response data (JSON or HTML)
 * @returns {Array<Object>}
 */
export function parseSuggest(data) {
  if (!data) {
    return [];
  }

  const suggestions = [];

  try {
    let jsonData;
    
    if (typeof data === 'string') {
      jsonData = JSON.parse(data);
    } else {
      jsonData = data;
    }

    // Google Play suggest API returns suggestions in various formats
    if (Array.isArray(jsonData)) {
      jsonData.forEach(item => {
        if (typeof item === 'string') {
          suggestions.push({ term: item });
        } else if (item.suggestion || item.term || item.q) {
          suggestions.push({
            term: item.suggestion || item.term || item.q,
            priority: item.priority || 0,
          });
        }
      });
    } else if (jsonData.suggestions || jsonData.data) {
      const suggestList = jsonData.suggestions || jsonData.data || [];
      suggestList.forEach(item => {
        suggestions.push({
          term: item.suggestion || item.term || item.q || item,
          priority: item.priority || 0,
        });
      });
    } else if (jsonData.q) {
      // Single suggestion
      suggestions.push({
        term: jsonData.q,
        priority: jsonData.priority || 0,
      });
    }

    return suggestions.sort((a, b) => (b.priority || 0) - (a.priority || 0));
  } catch (error) {
    console.error('Error parsing Google Play suggestions:', error);
    return [];
  }
}

