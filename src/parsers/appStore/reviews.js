/**
 * Parser for app reviews from iTunes RSS feed
 */

/**
 * Normalizes review data from iTunes RSS feed
 * @param {Object} data - Raw iTunes RSS JSON response
 * @returns {Array<Object>}
 */
export function parseReviews(data) {
  if (!data || !data.feed || !data.feed.entry) {
    return [];
  }

  // First entry is app metadata, skip it
  const reviews = Array.isArray(data.feed.entry) 
    ? data.feed.entry.slice(1) 
    : [];

  return reviews.map(entry => {
    const author = entry.author?.[0] || entry.author || {};
    const rating = entry['im:rating']?.label || entry['im:rating'] || '0';
    const version = entry['im:version']?.label || entry['im:version'] || null;
    const title = entry.title?.label || entry.title || null;
    const content = entry.content?.label || entry.content?.[0]?.label || entry.content || null;
    const updated = entry.updated?.label || entry.updated || null;
    const id = entry.id?.label || entry.id || null;

    // Extract user ID from author URI if available
    let userId = null;
    let userUrl = null;
    if (author.uri?.label || author.uri) {
      const uri = author.uri.label || author.uri;
      const match = uri.match(/\/id(\d+)/);
      if (match) {
        userId = match[1];
        userUrl = uri;
      }
    }

    return {
      id: id || null,
      userName: author.name?.label || author.name || 'Anonymous',
      userUrl: userUrl || null,
      version: version,
      score: parseInt(rating, 10) || 0,
      title: title,
      text: content,
      updated: updated,
      url: entry.link?.[0]?.attributes?.href || entry.link?.attributes?.href || null,
    };
  });
}

