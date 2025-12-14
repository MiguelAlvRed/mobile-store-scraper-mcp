/**
 * Parser for app privacy data
 */

/**
 * Normalizes privacy data from App Store privacy API
 * @param {Object} data - Raw privacy API response
 * @returns {Object|null}
 */
export function parsePrivacy(data) {
  if (!data || typeof data !== 'object') {
    return null;
  }

  return {
    managePrivacyChoicesUrl: data.managePrivacyChoicesUrl || null,
    privacyTypes: (data.privacyTypes || []).map(privacyType => ({
      privacyType: privacyType.privacyType || null,
      identifier: privacyType.identifier || null,
      description: privacyType.description || null,
      dataCategories: (privacyType.dataCategories || []).map(category => ({
        dataCategory: category.dataCategory || null,
        identifier: category.identifier || null,
        dataTypes: category.dataTypes || [],
      })),
      purposes: privacyType.purposes || [],
    })),
  };
}

