/**
 * Parser for Google Play data safety information
 * Improved version with multiple extraction strategies
 */

/**
 * Extracts data safety information from Google Play HTML page
 * @param {string} html - HTML content from app page
 * @returns {Object|null}
 */
export function parseDataSafety(html) {
  if (!html || typeof html !== 'string') {
    return null;
  }

  try {
    const result = {
      dataShared: [],
      dataCollected: [],
      securityPractices: [],
      privacyPolicyUrl: null,
    };

    // Strategy 1: Extract privacy policy URL with multiple patterns
    const privacyPolicyPatterns = [
      /<a[^>]*href=["']([^"']*privacy[^"']*)["'][^>]*>/i,
      /privacy[^"']*policy["'][^>]*href=["']([^"']+)["']/i,
      /<link[^>]*rel=["']privacy-policy["'][^>]*href=["']([^"']+)["']/i,
      /privacyPolicyUrl["']:\s*["']([^"']+)["']/i,
      /privacy.*?policy.*?url["']:\s*["']([^"']+)["']/i,
    ];

    for (const pattern of privacyPolicyPatterns) {
      const match = html.match(pattern);
      if (match) {
        result.privacyPolicyUrl = match[1];
        break;
      }
    }

    // Strategy 2: Look for JSON-LD structured data
    const jsonLdMatches = html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
    
    for (const match of jsonLdMatches) {
      try {
        const jsonLd = JSON.parse(match[1]);
        
        // Look for data safety information in structured data
        if (jsonLd.dataSafety || jsonLd['data-safety'] || jsonLd.data_safety) {
          const ds = jsonLd.dataSafety || jsonLd['data-safety'] || jsonLd.data_safety;
          
          if (ds.dataShared) {
            result.dataShared = Array.isArray(ds.dataShared) ? ds.dataShared : [];
          }
          if (ds.dataCollected) {
            result.dataCollected = Array.isArray(ds.dataCollected) ? ds.dataCollected : [];
          }
          if (ds.securityPractices) {
            result.securityPractices = Array.isArray(ds.securityPractices) ? ds.securityPractices : [];
          }
        }
      } catch (e) {
        // Not valid JSON, continue
      }
    }

    // Strategy 3: Extract from script tags with embedded JSON
    const scriptMatches = html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi);
    
    for (const match of scriptMatches) {
      const scriptContent = match[1];
      
      if (scriptContent.includes('dataSafety') || scriptContent.includes('data-safety') || scriptContent.includes('data_safety')) {
        // Try to find data safety JSON structures
        const jsonPatterns = [
          /dataSafety["']?\s*:\s*\{([\s\S]*?)\}/i,
          /"data-safety"["']?\s*:\s*\{([\s\S]*?)\}/i,
          /data_safety["']?\s*:\s*\{([\s\S]*?)\}/i,
        ];

        for (const pattern of jsonPatterns) {
          const jsonMatch = scriptContent.match(pattern);
          if (jsonMatch) {
            try {
              const jsonStr = '{' + jsonMatch[1] + '}';
              const jsonData = JSON.parse(jsonStr);
              
              if (jsonData.dataShared) {
                result.dataShared = Array.isArray(jsonData.dataShared) ? jsonData.dataShared : [];
              }
              if (jsonData.dataCollected) {
                result.dataCollected = Array.isArray(jsonData.dataCollected) ? jsonData.dataCollected : [];
              }
              if (jsonData.securityPractices) {
                result.securityPractices = Array.isArray(jsonData.securityPractices) ? jsonData.securityPractices : [];
              }
            } catch (e) {
              // Not valid JSON, continue
            }
          }
        }
      }
    }

    // Strategy 4: Extract from HTML sections with multiple patterns
    const dataSafetySectionPatterns = [
      /<div[^>]*class=["'][^"']*data-safety["'][^>]*>([\s\S]*?)<\/div>/i,
      /<section[^>]*id=["']data-safety["'][^>]*>([\s\S]*?)<\/section>/i,
      /<div[^>]*id=["']data-safety["'][^>]*>([\s\S]*?)<\/div>/i,
      /<section[^>]*class=["'][^"']*data-safety["'][^>]*>([\s\S]*?)<\/section>/i,
    ];

    let sectionHtml = null;
    for (const pattern of dataSafetySectionPatterns) {
      const match = html.match(pattern);
      if (match) {
        sectionHtml = match[1];
        break;
      }
    }

    if (sectionHtml) {
      // Extract "Data shared" section
      const dataSharedPatterns = [
        /data.*?shared["']?\s*:\s*\[([\s\S]*?)\]/i,
        /<div[^>]*class=["'][^"']*data-shared["'][^>]*>([\s\S]*?)<\/div>/gi,
        /<section[^>]*class=["'][^"']*data-shared["'][^>]*>([\s\S]*?)<\/section>/gi,
      ];

      for (const pattern of dataSharedPatterns) {
        const matches = sectionHtml.matchAll(pattern);
        for (const match of matches) {
          const itemHtml = pattern.source.includes('div') || pattern.source.includes('section') ? match[1] : match[0];
          
          // Extract data items
          const dataItemPatterns = [
            /<span[^>]*>([^<]+)<\/span>/gi,
            /<div[^>]*class=["'][^"']*item["'][^>]*>([^<]+)<\/div>/gi,
            /"([^"]+)"/g,
          ];

          for (const itemPattern of dataItemPatterns) {
            const itemMatches = itemHtml.matchAll(itemPattern);
            for (const itemMatch of itemMatches) {
              const dataText = itemMatch[1].trim();
              if (dataText && dataText.length > 2 && dataText.length < 100) {
                // Check if it's a valid data type (not HTML tags or common words)
                if (!dataText.startsWith('<') && !['and', 'or', 'the', 'a', 'an'].includes(dataText.toLowerCase())) {
                  const existing = result.dataShared.find(d => d.data === dataText);
                  if (!existing) {
                    result.dataShared.push({
                      data: dataText,
                      optional: itemHtml.includes('optional') || false,
                      purpose: extractPurpose(itemHtml),
                      type: extractDataType(dataText),
                    });
                  }
                }
              }
            }
          }
        }
      }

      // Extract "Data collected" section
      const dataCollectedPatterns = [
        /data.*?collected["']?\s*:\s*\[([\s\S]*?)\]/i,
        /<div[^>]*class=["'][^"']*data-collected["'][^>]*>([\s\S]*?)<\/div>/gi,
        /<section[^>]*class=["'][^"']*data-collected["'][^>]*>([\s\S]*?)<\/section>/gi,
      ];

      for (const pattern of dataCollectedPatterns) {
        const matches = sectionHtml.matchAll(pattern);
        for (const match of matches) {
          const itemHtml = pattern.source.includes('div') || pattern.source.includes('section') ? match[1] : match[0];
          
          // Extract data items
          const dataItemPatterns = [
            /<span[^>]*>([^<]+)<\/span>/gi,
            /<div[^>]*class=["'][^"']*item["'][^>]*>([^<]+)<\/div>/gi,
            /"([^"]+)"/g,
          ];

          for (const itemPattern of dataItemPatterns) {
            const itemMatches = itemHtml.matchAll(itemPattern);
            for (const itemMatch of itemMatches) {
              const dataText = itemMatch[1].trim();
              if (dataText && dataText.length > 2 && dataText.length < 100) {
                if (!dataText.startsWith('<') && !['and', 'or', 'the', 'a', 'an'].includes(dataText.toLowerCase())) {
                  const existing = result.dataCollected.find(d => d.data === dataText);
                  if (!existing) {
                    result.dataCollected.push({
                      data: dataText,
                      optional: itemHtml.includes('optional') || false,
                      purpose: extractPurpose(itemHtml),
                      type: extractDataType(dataText),
                    });
                  }
                }
              }
            }
          }
        }
      }

      // Extract security practices
      const securityPatterns = [
        /security.*?practices["']?\s*:\s*\[([\s\S]*?)\]/i,
        /<div[^>]*class=["'][^"']*security-practices["'][^>]*>([\s\S]*?)<\/div>/gi,
      ];

      for (const pattern of securityPatterns) {
        const matches = sectionHtml.matchAll(pattern);
        for (const match of matches) {
          const practiceHtml = match[1];
          const practiceMatch = practiceHtml.match(/([^<]+)/);
          if (practiceMatch) {
            const practice = practiceMatch[1].trim();
            if (practice && practice.length > 5) {
              result.securityPractices.push({
                practice: practice,
                description: extractDescription(practiceHtml),
              });
            }
          }
        }
      }
    }

    // Return result only if we found at least some data
    if (result.dataShared.length > 0 || result.dataCollected.length > 0 || result.securityPractices.length > 0 || result.privacyPolicyUrl) {
      return result;
    }

    return null;
  } catch (error) {
    console.error('Error parsing Google Play data safety:', error);
    return null;
  }
}

/**
 * Extracts purpose from HTML context
 * @param {string} html - HTML context
 * @returns {string}
 */
function extractPurpose(html) {
  const purposePatterns = [
    /purpose["']:\s*["']([^"']+)["']/i,
    /<span[^>]*class=["'][^"']*purpose["'][^>]*>([^<]+)<\/span>/i,
  ];

  for (const pattern of purposePatterns) {
    const match = html.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }

  return '';
}

/**
 * Extracts data type from data name
 * @param {string} dataName - Name of the data
 * @returns {string}
 */
function extractDataType(dataName) {
  const dataTypes = {
    'name': 'Personal info',
    'email': 'Personal info',
    'phone': 'Personal info',
    'address': 'Personal info',
    'location': 'Location',
    'contacts': 'Contacts',
    'photos': 'Photos/Media/Files',
    'camera': 'Photos/Media/Files',
    'microphone': 'Audio',
    'calendar': 'Calendar',
    'sms': 'Messages',
    'call': 'Phone',
  };

  const lowerName = dataName.toLowerCase();
  for (const [key, value] of Object.entries(dataTypes)) {
    if (lowerName.includes(key)) {
      return value;
    }
  }

  return '';
}

/**
 * Extracts description from HTML context
 * @param {string} html - HTML context
 * @returns {string}
 */
function extractDescription(html) {
  const descPatterns = [
    /description["']:\s*["']([^"']+)["']/i,
    /<p[^>]*>([^<]+)<\/p>/i,
    /<span[^>]*>([^<]+)<\/span>/i,
  ];

  for (const pattern of descPatterns) {
    const match = html.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }

  return '';
}
