/**
 * Google Play Store API endpoints and URL builders
 * Based on Google Play web interface and internal APIs
 */

const GOOGLE_PLAY_BASE = 'https://play.google.com';
const GOOGLE_PLAY_API_BASE = 'https://android.clients.google.com';

/**
 * Builds a search URL for Google Play
 * @param {Object} params - Search parameters
 * @returns {string}
 */
export function buildSearchUrl(params) {
  const {
    term,
    country = 'us',
    lang = 'en',
    num = 250,
    fullDetail = false,
  } = params;

  const queryParams = new URLSearchParams({
    q: term,
    c: 'apps',
    gl: country,
    hl: lang,
  });

  return `${GOOGLE_PLAY_BASE}/store/search?${queryParams.toString()}`;
}

/**
 * Builds an app detail URL
 * @param {Object} params - App parameters
 * @returns {string}
 */
export function buildAppUrl(params) {
  const { appId, lang = 'en', country = 'us' } = params;
  
  if (!appId) {
    throw new Error('appId is required for Google Play');
  }

  const queryParams = new URLSearchParams({
    id: appId,
    gl: country,
    hl: lang,
  });

  return `${GOOGLE_PLAY_BASE}/store/apps/details?${queryParams.toString()}`;
}

/**
 * Builds a developer apps URL
 * @param {Object} params - Developer parameters
 * @returns {string}
 */
export function buildDeveloperUrl(params) {
  const { devId, lang = 'en', country = 'us', num = 60 } = params;
  
  if (!devId) {
    throw new Error('devId is required');
  }

  const queryParams = new URLSearchParams({
    id: devId,
    gl: country,
    hl: lang,
  });

  return `${GOOGLE_PLAY_BASE}/store/apps/developer?${queryParams.toString()}`;
}

/**
 * Builds a reviews URL
 * @param {Object} params - Review parameters
 * @returns {string}
 */
export function buildReviewsUrl(params) {
  const {
    appId,
    lang = 'en',
    country = 'us',
    page = 0,
    sort = 0, // 0 = most recent, 2 = most helpful
  } = params;
  
  if (!appId) {
    throw new Error('appId is required');
  }

  // Google Play uses pagination tokens, but we can use page numbers as approximation
  const queryParams = new URLSearchParams({
    id: appId,
    gl: country,
    hl: lang,
    reviewSortOrder: sort.toString(),
    reviewType: '0', // All reviews
    pageNum: page.toString(),
  });

  return `${GOOGLE_PLAY_BASE}/store/apps/details?id=${appId}&gl=${country}&hl=${lang}#Reviews`;
}

/**
 * Builds a list/ranking URL
 * @param {Object} params - List parameters
 * @returns {string}
 */
export function buildListUrl(params) {
  const {
    category = 'APPLICATION',
    collection = 'topselling_free', // topselling_free, topselling_paid, topgrossing, movers_shakers
    country = 'us',
    lang = 'en',
    num = 60,
  } = params;

  const queryParams = new URLSearchParams({
    category: category,
    collection: collection,
    gl: country,
    hl: lang,
    num: num.toString(),
  });

  return `${GOOGLE_PLAY_BASE}/store/apps/category/${category}/collection/${collection}?${queryParams.toString()}`;
}

/**
 * Builds a similar apps URL
 * @param {Object} params - Similar apps parameters
 * @returns {string}
 */
export function buildSimilarUrl(params) {
  const { appId, lang = 'en', country = 'us' } = params;
  
  if (!appId) {
    throw new Error('appId is required');
  }

  return `${GOOGLE_PLAY_BASE}/store/apps/details?id=${appId}&gl=${country}&hl=${lang}`;
}

/**
 * Builds a permissions URL
 * @param {Object} params - Permissions parameters
 * @returns {string}
 */
export function buildPermissionsUrl(params) {
  const { appId, lang = 'en', country = 'us' } = params;
  
  if (!appId) {
    throw new Error('appId is required');
  }

  return `${GOOGLE_PLAY_BASE}/store/apps/details?id=${appId}&gl=${country}&hl=${lang}`;
}

/**
 * Builds a data safety URL
 * @param {Object} params - Data safety parameters
 * @returns {string}
 */
export function buildDataSafetyUrl(params) {
  const { appId, lang = 'en' } = params;
  
  if (!appId) {
    throw new Error('appId is required');
  }

  return `${GOOGLE_PLAY_BASE}/store/apps/details?id=${appId}&hl=${lang}`;
}

/**
 * Builds a categories list URL
 * @returns {string}
 */
export function buildCategoriesUrl() {
  return `${GOOGLE_PLAY_BASE}/store/apps`;
}

/**
 * Builds a suggest/autocomplete URL
 * @param {Object} params - Suggest parameters
 * @returns {string}
 */
export function buildSuggestUrl(params) {
  const { term, country = 'us', lang = 'en' } = params;
  
  if (!term) {
    throw new Error('term is required');
  }

  // Google Play uses a different endpoint for suggestions
  return `https://market.android.com/suggest/SuggRequest?json=1&c=3&query=${encodeURIComponent(term)}&gl=${country}&hl=${lang}`;
}

