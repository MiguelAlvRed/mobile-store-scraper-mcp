/**
 * Parser for app version history
 */

/**
 * Normalizes version history data
 * @param {Object} data - Raw version history API response
 * @returns {Array<Object>}
 */
export function parseVersionHistory(data) {
  if (!data || !Array.isArray(data)) {
    return [];
  }

  return data.map(version => ({
    versionDisplay: version.versionDisplay || version.version || null,
    releaseNotes: version.releaseNotes || null,
    releaseDate: version.releaseDate || null,
    releaseTimestamp: version.releaseTimestamp || null,
  }));
}

