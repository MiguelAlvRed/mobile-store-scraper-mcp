/**
 * Parser for Google Play reviews from HTML
 * Improved version with multiple extraction strategies
 */

/**
 * Extracts reviews from Google Play HTML page
 * @param {string} html - HTML content from reviews section
 * @returns {Object}
 */
export function parseReviews(html) {
  if (!html || typeof html !== 'string') {
    return {
      data: [],
      nextPaginationToken: null,
    };
  }

  const reviews = [];
  const seenReviewIds = new Set();

  try {
    // Strategy 1: Look for JSON-LD structured data
    const jsonLdMatches = html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
    for (const match of jsonLdMatches) {
      try {
        const jsonLd = JSON.parse(match[1]);
        if (jsonLd['@type'] === 'Review' || (jsonLd['@type'] === 'ItemList' && jsonLd.itemListElement)) {
          const reviewList = jsonLd['@type'] === 'Review' ? [jsonLd] : jsonLd.itemListElement;
          reviewList.forEach(item => {
            if (item['@type'] === 'Review' || item.reviewBody) {
              const review = extractFromJsonLd(item);
              if (review && !seenReviewIds.has(review.reviewId || review.text)) {
                seenReviewIds.add(review.reviewId || review.text);
                reviews.push(review);
              }
            }
          });
        }
      } catch (e) {
        // Not valid JSON-LD, continue
      }
    }

    // Strategy 2: Look for embedded JSON data in script tags (Google Play uses _df_ prefix)
    const scriptMatches = html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi);
    
    for (const match of scriptMatches) {
      const scriptContent = match[1];
      
      // Look for review data in various JSON formats
      if (scriptContent.includes('review') || scriptContent.includes('rating') || scriptContent.includes('_df_')) {
        // Try to find JSON objects/arrays
        const jsonPatterns = [
          /\[([\s\S]{100,}?)\]/g,  // Array of reviews
          /\{[\s\S]*?"reviews"[\s\S]*?:[\s\S]*?\[([\s\S]*?)\][\s\S]*?\}/g,  // Object with reviews array
          /\{[\s\S]*?"data"[\s\S]*?:[\s\S]*?\[([\s\S]*?)\][\s\S]*?\}/g,  // Object with data array
        ];

        for (const pattern of jsonPatterns) {
          const matches = scriptContent.matchAll(pattern);
          for (const jsonMatch of matches) {
            try {
              const jsonStr = '[' + jsonMatch[1] + ']';
              const jsonData = JSON.parse(jsonStr);
              if (Array.isArray(jsonData)) {
                jsonData.forEach(item => {
                  if (item && (item.reviewId || item.text || item.rating || item.comment)) {
                    const review = normalizeReview(item);
                    if (review && !seenReviewIds.has(review.reviewId || review.text)) {
                      seenReviewIds.add(review.reviewId || review.text);
                      reviews.push(review);
                    }
                  }
                });
              }
            } catch (e) {
              // Not valid JSON, try next pattern
            }
          }
        }

        // Try direct JSON parsing if content looks like JSON
        if (scriptContent.trim().startsWith('{') || scriptContent.trim().startsWith('[')) {
          try {
            const jsonData = JSON.parse(scriptContent);
            if (Array.isArray(jsonData)) {
              jsonData.forEach(item => {
                if (item && (item.reviewId || item.text || item.rating)) {
                  const review = normalizeReview(item);
                  if (review && !seenReviewIds.has(review.reviewId || review.text)) {
                    seenReviewIds.add(review.reviewId || review.text);
                    reviews.push(review);
                  }
                }
              });
            } else if (jsonData.reviews || jsonData.data || jsonData[0]) {
              const reviewList = jsonData.reviews || jsonData.data || (Array.isArray(jsonData) ? jsonData : []);
              reviewList.forEach(item => {
                const review = normalizeReview(item);
                if (review && !seenReviewIds.has(review.reviewId || review.text)) {
                  seenReviewIds.add(review.reviewId || review.text);
                  reviews.push(review);
                }
              });
            }
          } catch (e) {
            // Not JSON, continue
          }
        }
      }
    }

    // Strategy 3: Extract from visible HTML structure with improved patterns
    const reviewPatterns = [
      /<div[^>]*class=["'][^"']*review["'][^>]*>([\s\S]*?)<\/div>/gi,
      /<div[^>]*itemprop=["']review["'][^>]*>([\s\S]*?)<\/div>/gi,
      /<article[^>]*class=["'][^"']*review["'][^>]*>([\s\S]*?)<\/article>/gi,
      /<div[^>]*data-review-id=["'][^"']*["'][^>]*>([\s\S]*?)<\/div>/gi,
    ];

    for (const pattern of reviewPatterns) {
      const reviewBlockMatches = html.matchAll(pattern);
      
      for (const blockMatch of reviewBlockMatches) {
        const reviewHtml = blockMatch[1];
        
        // Extract rating with multiple patterns
        const ratingMatch = reviewHtml.match(/aria-label=["'](\d+)\s*stars?["']/i) ||
                           reviewHtml.match(/<div[^>]*class=["'][^"']*rating["'][^>]*>(\d+)[^<]*<\/div>/i) ||
                           reviewHtml.match(/ratingValue["']:\s*["']?(\d+)/i) ||
                           reviewHtml.match(/<meta[^>]*itemprop=["']ratingValue["'][^>]*content=["'](\d+)["']/i) ||
                           reviewHtml.match(/<span[^>]*class=["'][^"']*star-rating["'][^>]*>(\d+)/i);
        const rating = ratingMatch ? parseInt(ratingMatch[1], 10) : null;

        // Extract text with multiple patterns
        const textMatch = reviewHtml.match(/<span[^>]*class=["'][^"']*review-body["'][^>]*>([\s\S]*?)<\/span>/i) ||
                         reviewHtml.match(/<div[^>]*class=["'][^"']*review-text["'][^>]*>([\s\S]*?)<\/div>/i) ||
                         reviewHtml.match(/<p[^>]*class=["'][^"']*review-text["'][^>]*>([\s\S]*?)<\/p>/i) ||
                         reviewHtml.match(/reviewBody["']:\s*["']([^"']+)["']/i) ||
                         reviewHtml.match(/<span[^>]*itemprop=["']reviewBody["'][^>]*>([\s\S]*?)<\/span>/i);
        let text = textMatch ? textMatch[1].replace(/<[^>]+>/g, '').trim() : null;
        if (text) {
          text = text.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
        }

        // Extract author with multiple patterns
        const authorMatch = reviewHtml.match(/<span[^>]*class=["'][^"']*author-name["'][^>]*>([^<]+)<\/span>/i) ||
                           reviewHtml.match(/<a[^>]*class=["'][^"']*author["'][^>]*>([^<]+)<\/a>/i) ||
                           reviewHtml.match(/<span[^>]*itemprop=["']author["'][^>]*>([^<]+)<\/span>/i) ||
                           reviewHtml.match(/author["']:\s*["']([^"']+)["']/i);
        const author = authorMatch ? authorMatch[1].trim() : null;

        // Extract date with multiple patterns
        const dateMatch = reviewHtml.match(/<span[^>]*class=["'][^"']*review-date["'][^>]*>([^<]+)<\/span>/i) ||
                         reviewHtml.match(/<time[^>]*datetime=["']([^"']+)["']/i) ||
                         reviewHtml.match(/<span[^>]*itemprop=["']datePublished["'][^>]*>([^<]+)<\/span>/i) ||
                         reviewHtml.match(/datePublished["']:\s*["']([^"']+)["']/i);
        const date = dateMatch ? dateMatch[1].trim() : null;

        // Extract review ID
        const reviewIdMatch = reviewHtml.match(/data-review-id=["']([^"']+)["']/i) ||
                             reviewHtml.match(/reviewId["']:\s*["']([^"']+)["']/i);
        const reviewId = reviewIdMatch ? reviewIdMatch[1] : null;

        // Extract thumbs up
        const thumbsUpMatch = reviewHtml.match(/(\d+)\s*(?:thumbs?|helpful|útil)/i) ||
                             reviewHtml.match(/thumbsUp["']:\s*["']?(\d+)/i);
        const thumbsUp = thumbsUpMatch ? parseInt(thumbsUpMatch[1], 10) : 0;

        // Only add if we have meaningful data
        if (rating || text || author) {
          const reviewKey = reviewId || text || `${author}-${date}`;
          if (!seenReviewIds.has(reviewKey)) {
            seenReviewIds.add(reviewKey);
            reviews.push({
              reviewId: reviewId,
              userName: author || 'Anonymous',
              userImage: null,
              date: date,
              dateText: date,
              score: rating || 0,
              scoreText: rating ? rating.toString() : '0',
              title: null,
              text: text,
              replyDate: null,
              replyText: null,
              version: null,
              thumbsUp: thumbsUp,
              criterias: [],
            });
          }
        }
      }
    }

    // Strategy 4: Look for pagination token
    const paginationPatterns = [
      /nextPaginationToken["']:\s*["']([^"']+)["']/i,
      /"paginationToken"["']:\s*["']([^"']+)["']/i,
      /data-pagination-token=["']([^"']+)["']/i,
    ];
    
    let nextToken = null;
    for (const pattern of paginationPatterns) {
      const match = html.match(pattern);
      if (match) {
        nextToken = match[1];
        break;
      }
    }

    return {
      data: reviews,
      nextPaginationToken: nextToken,
    };
  } catch (error) {
    console.error('Error parsing Google Play reviews:', error);
    return {
      data: [],
      nextPaginationToken: null,
    };
  }
}

/**
 * Extracts review data from JSON-LD structured data
 * @param {Object} jsonLd - JSON-LD review object
 * @returns {Object|null}
 */
function extractFromJsonLd(jsonLd) {
  try {
    return {
      reviewId: jsonLd['@id'] || jsonLd.identifier || null,
      userName: jsonLd.author?.name || jsonLd.author || 'Anonymous',
      userImage: jsonLd.author?.image || null,
      date: jsonLd.datePublished || jsonLd.dateCreated || null,
      dateText: jsonLd.datePublished || jsonLd.dateCreated || null,
      score: jsonLd.reviewRating?.ratingValue || jsonLd.ratingValue || 0,
      scoreText: (jsonLd.reviewRating?.ratingValue || jsonLd.ratingValue || 0).toString(),
      title: jsonLd.headline || jsonLd.name || null,
      text: jsonLd.reviewBody || jsonLd.description || jsonLd.text || null,
      replyDate: null,
      replyText: null,
      version: null,
      thumbsUp: jsonLd.upvoteCount || 0,
      criterias: [],
    };
  } catch (e) {
    return null;
  }
}

/**
 * Normalizes a review object
 * @param {Object} review - Raw review data
 * @returns {Object}
 */
function normalizeReview(review) {
  if (!review || typeof review !== 'object') {
    return null;
  }

  return {
    reviewId: review.reviewId || review.id || review.identifier || null,
    userName: review.userName || review.author || review.authorName || review.name || 'Anonymous',
    userImage: review.userImage || review.avatar || review.authorImage || null,
    date: review.date || review.timestamp || review.datePublished || review.createdAt || null,
    dateText: review.dateText || review.date || review.timestamp || null,
    score: review.score || review.rating || review.starRating || review.ratingValue || 0,
    scoreText: (review.score || review.rating || review.starRating || review.ratingValue || 0).toString(),
    title: review.title || review.headline || null,
    text: review.text || review.comment || review.body || review.reviewBody || review.description || null,
    replyDate: review.replyDate || review.developerCommentDate || null,
    replyText: review.replyText || review.developerComment || review.reply || null,
    version: review.version || review.appVersion || null,
    thumbsUp: review.thumbsUp || review.helpful || review.upvoteCount || 0,
    criterias: review.criterias || review.criteria || [],
  };
}
