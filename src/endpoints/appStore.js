/**
 * App Store API endpoints and URL builders
 * Based on iTunes Search API and App Store web endpoints
 */

const ITUNES_BASE = 'https://itunes.apple.com';
const APP_STORE_BASE = 'https://apps.apple.com';

/**
 * Builds a search URL
 * @param {Object} params - Search parameters
 * @returns {string}
 */
export function buildSearchUrl(params) {
  const {
    term,
    country = 'us',
    lang = 'en',
    num = 50,
    page = 1,
    entity = 'software',
  } = params;

  const offset = (page - 1) * num;
  const queryParams = new URLSearchParams({
    term: term,
    country: country,
    lang: lang,
    limit: Math.min(num, 200).toString(),
    offset: offset.toString(),
    entity: entity,
  });

  return `${ITUNES_BASE}/search?${queryParams.toString()}`;
}

/**
 * Builds an app detail URL
 * @param {Object} params - App parameters
 * @returns {string}
 */
export function buildAppUrl(params) {
  const { id, appId, country = 'us' } = params;
  
  if (id) {
    return `${ITUNES_BASE}/lookup?id=${id}&country=${country}`;
  }
  
  if (appId) {
    // First lookup by bundleId to get trackId
    return `${ITUNES_BASE}/lookup?bundleId=${appId}&country=${country}`;
  }
  
  throw new Error('Either id or appId must be provided');
}

/**
 * Builds a developer apps URL
 * @param {Object} params - Developer parameters
 * @returns {string}
 */
export function buildDeveloperUrl(params) {
  const { devId, country = 'us', lang = 'en' } = params;
  const queryParams = new URLSearchParams({
    id: devId.toString(),
    country: country,
    lang: lang,
    entity: 'software',
  });
  
  return `${ITUNES_BASE}/lookup?${queryParams.toString()}`;
}

/**
 * Builds a reviews URL
 * @param {Object} params - Review parameters
 * @returns {string}
 */
export function buildReviewsUrl(params) {
  const { id, appId, country = 'us', page = 1, sort = 'mostRecent' } = params;
  
  if (!id && !appId) {
    throw new Error('Either id or appId must be provided');
  }
  
  const appIdParam = id || appId;
  const pageNum = Math.min(page, 10); // Max 10 pages
  const sortParam = sort === 'mostHelpful' ? 'mostHelpful' : 'mostRecent';
  
  return `${ITUNES_BASE}/${country}/rss/customerreviews/page=${pageNum}/id=${appIdParam}/sortby=${sortParam}/json`;
}

/**
 * Builds a ratings URL (uses app detail endpoint)
 * @param {Object} params - Rating parameters
 * @returns {string}
 */
export function buildRatingsUrl(params) {
  return buildAppUrl(params);
}

/**
 * Builds a similar apps URL
 * @param {Object} params - Similar apps parameters
 * @returns {string}
 */
export function buildSimilarUrl(params) {
  const { id, appId, country = 'us' } = params;
  
  if (!id && !appId) {
    throw new Error('Either id or appId must be provided');
  }
  
  // Similar apps are found via the web page
  const appIdParam = id || appId;
  return `${APP_STORE_BASE}/${country}/app/id${appIdParam}`;
}

/**
 * Builds a privacy URL
 * @param {Object} params - Privacy parameters
 * @returns {string}
 */
export function buildPrivacyUrl(params) {
  const { id } = params;
  
  if (!id) {
    throw new Error('id must be provided for privacy data');
  }
  
  return `${ITUNES_BASE}/us/app-privacy-details/${id}.json`;
}

/**
 * Builds a version history URL
 * @param {Object} params - Version history parameters
 * @returns {string}
 */
export function buildVersionHistoryUrl(params) {
  const { id, country = 'us' } = params;
  
  if (!id) {
    throw new Error('id must be provided for version history');
  }
  
  return `${ITUNES_BASE}/us/app-version-history/${id}.json`;
}

/**
 * Builds a list/ranking URL
 * @param {Object} params - List parameters
 * @returns {string}
 */
export function buildListUrl(params) {
  const {
    category = 'all',
    country = 'us',
    genre = 'all',
    limit = 200,
    chart = 'topfreeapplications', // topfreeapplications, toppaidapplications, topgrossingapplications
  } = params;
  
  const queryParams = new URLSearchParams({
    country: country,
    limit: limit.toString(),
  });
  
  if (genre !== 'all') {
    queryParams.append('genre', genre);
  }
  
  return `${ITUNES_BASE}/${country}/rss/${chart}/limit=${limit}/json`;
}

/**
 * Builds a suggest/autocomplete URL
 * @param {Object} params - Suggest parameters
 * @returns {string}
 */
export function buildSuggestUrl(params) {
  const { term, country = 'us' } = params;
  
  // App Store uses a different endpoint for suggestions
  return `https://search.itunes.apple.com/WebObjects/MZSearchHints.woa/wa/hints?term=${encodeURIComponent(term)}&country=${country}`;
}

