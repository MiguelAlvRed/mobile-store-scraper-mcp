/**
 * HTTP Client with retry logic and proper headers for App Store requests
 */

const DEFAULT_TIMEOUT = 30000; // 30 seconds
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

/**
 * User agent that mimics a real browser
 */
const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/**
 * Sleep utility for retry delays
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Fetches a URL with retry logic and proper error handling
 * @param {string} url - URL to fetch
 * @param {Object} options - Fetch options
 * @param {number} retries - Number of retries remaining
 * @returns {Promise<Response>}
 */
async function fetchWithRetry(url, options = {}, retries = MAX_RETRIES) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);

  const fetchOptions = {
    ...options,
    signal: controller.signal,
    headers: {
      'User-Agent': USER_AGENT,
      'Accept': 'application/json, text/html, */*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, fetchOptions);
    clearTimeout(timeoutId);

    if (!response.ok) {
      // Retry on server errors (5xx) and rate limiting (429)
      if ((response.status >= 500 || response.status === 429) && retries > 0) {
        await sleep(RETRY_DELAY * (MAX_RETRIES - retries + 1));
        return fetchWithRetry(url, options, retries - 1);
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response;
  } catch (error) {
    clearTimeout(timeoutId);

    // Retry on network errors
    if (error.name === 'AbortError' || (error.message.includes('fetch') && retries > 0)) {
      await sleep(RETRY_DELAY * (MAX_RETRIES - retries + 1));
      return fetchWithRetry(url, options, retries - 1);
    }

    throw error;
  }
}

/**
 * Fetches JSON from a URL
 * @param {string} url - URL to fetch
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>}
 */
export async function fetchJSON(url, options = {}) {
  const response = await fetchWithRetry(url, options);
  const text = await response.text();
  
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`Failed to parse JSON from ${url}: ${error.message}`);
  }
}

/**
 * Fetches HTML/text from a URL
 * @param {string} url - URL to fetch
 * @param {Object} options - Fetch options
 * @returns {Promise<string>}
 */
export async function fetchText(url, options = {}) {
  const response = await fetchWithRetry(url, options);
  return await response.text();
}

/**
 * Fetches a URL and returns the response object
 * @param {string} url - URL to fetch
 * @param {Object} options - Fetch options
 * @returns {Promise<Response>}
 */
export async function fetchResponse(url, options = {}) {
  return await fetchWithRetry(url, options);
}

