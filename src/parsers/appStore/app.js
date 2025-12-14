/**
 * Parser for app detail data from iTunes API
 */

/**
 * Normalizes app data from iTunes lookup API
 * @param {Object} data - Raw iTunes API response
 * @returns {Object|null}
 */
export function parseApp(data) {
  if (!data || !data.results || data.results.length === 0) {
    return null;
  }

  const app = data.results[0];

  return {
    id: app.trackId || null,
    appId: app.bundleId || null,
    title: app.trackName || null,
    url: app.trackViewUrl || null,
    description: app.description || null,
    releaseNotes: app.releaseNotes || null,
    version: app.version || null,
    releaseDate: app.releaseDate || null,
    currentVersionReleaseDate: app.currentVersionReleaseDate || null,
    price: app.price || 0,
    currency: app.currency || null,
    free: app.price === 0,
    developer: {
      id: app.artistId || null,
      name: app.artistName || null,
      url: app.artistViewUrl || null,
    },
    category: {
      id: app.primaryGenreId || null,
      name: app.primaryGenreName || null,
      genres: app.genres || [],
    },
    rating: {
      average: app.averageUserRating || null,
      count: app.userRatingCount || 0,
    },
    contentAdvisoryRating: app.contentAdvisoryRating || null,
    screenshotUrls: app.screenshotUrls || [],
    ipadScreenshotUrls: app.ipadScreenshotUrls || [],
    appletvScreenshotUrls: app.appletvScreenshotUrls || [],
    artwork: {
      icon: app.artworkUrl512 || app.artworkUrl100 || app.artworkUrl60 || null,
      icon60: app.artworkUrl60 || null,
      icon100: app.artworkUrl100 || null,
      icon512: app.artworkUrl512 || null,
    },
    supportedDevices: app.supportedDevices || [],
    minimumOsVersion: app.minimumOsVersion || null,
    languageCodesISO2A: app.languageCodesISO2A || [],
    fileSizeBytes: app.fileSizeBytes || null,
    sellerName: app.sellerName || null,
    formattedPrice: app.formattedPrice || null,
    isGameCenterEnabled: app.isGameCenterEnabled || false,
    features: app.features || [],
    advisories: app.advisories || [],
    kind: app.kind || null,
    averageUserRatingForCurrentVersion: app.averageUserRatingForCurrentVersion || null,
    userRatingCountForCurrentVersion: app.userRatingCountForCurrentVersion || 0,
  };
}

/**
 * Parses multiple apps from search/developer results
 * @param {Object} data - Raw iTunes API response
 * @returns {Array<Object>}
 */
export function parseApps(data) {
  if (!data || !data.results || !Array.isArray(data.results)) {
    return [];
  }

  return data.results
    .filter(app => app.kind === 'software' || app.wrapperType === 'software')
    .map(app => {
      // Reconstruct as if it came from lookup
      const lookupData = { results: [app] };
      return parseApp(lookupData);
    })
    .filter(app => app !== null);
}

