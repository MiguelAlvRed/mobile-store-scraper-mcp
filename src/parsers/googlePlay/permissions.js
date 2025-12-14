/**
 * Parser for Google Play app permissions
 * Improved version with multiple extraction strategies
 */

/**
 * Extracts permissions from Google Play HTML page
 * @param {string} html - HTML content from app page
 * @param {boolean} short - If true, return only permission names
 * @returns {Array<Object|string>}
 */
export function parsePermissions(html, short = false) {
  if (!html || typeof html !== 'string') {
    return [];
  }

  const permissions = [];
  const seenPermissions = new Set();

  try {
    // Strategy 1: Look for permissions section in HTML
    const permissionsSectionPatterns = [
      /<div[^>]*class=["'][^"']*permissions["'][^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]*id=["']permissions["'][^>]*>([\s\S]*?)<\/div>/i,
      /<section[^>]*class=["'][^"']*permissions["'][^>]*>([\s\S]*?)<\/section>/i,
      /<div[^>]*data-permissions[^>]*>([\s\S]*?)<\/div>/i,
    ];

    for (const pattern of permissionsSectionPatterns) {
      const sectionMatch = html.match(pattern);
      if (sectionMatch) {
        const sectionHtml = sectionMatch[1];
        
        // Extract permission items with multiple patterns
        const permissionItemPatterns = [
          /<div[^>]*class=["'][^"']*permission["'][^>]*>([\s\S]*?)<\/div>/gi,
          /<li[^>]*class=["'][^"']*permission["'][^>]*>([\s\S]*?)<\/li>/gi,
          /<div[^>]*data-permission[^>]*>([\s\S]*?)<\/div>/gi,
        ];

        for (const itemPattern of permissionItemPatterns) {
          const permissionMatches = sectionHtml.matchAll(itemPattern);
          
          for (const match of permissionMatches) {
            const permHtml = match[1];
            
            // Extract permission name with multiple patterns
            const namePatterns = [
              /<div[^>]*class=["'][^"']*permission-name["'][^>]*>([^<]+)<\/div>/i,
              /<span[^>]*class=["'][^"']*permission-name["'][^>]*>([^<]+)<\/span>/i,
              /<div[^>]*class=["'][^"']*title["'][^>]*>([^<]+)<\/div>/i,
              /<span[^>]*>([^<]+)<\/span>/i,
              /<p[^>]*>([^<]+)<\/p>/i,
            ];

            let permissionName = null;
            for (const namePattern of namePatterns) {
              const nameMatch = permHtml.match(namePattern);
              if (nameMatch) {
                permissionName = nameMatch[1].trim();
                break;
              }
            }

            // Extract permission type/category with multiple patterns
            const typePatterns = [
              /<div[^>]*class=["'][^"']*permission-type["'][^>]*>([^<]+)<\/div>/i,
              /<span[^>]*class=["'][^"']*permission-type["'][^>]*>([^<]+)<\/span>/i,
              /<div[^>]*class=["'][^"']*category["'][^>]*>([^<]+)<\/div>/i,
              /data-type=["']([^"']+)["']/i,
            ];

            let type = '';
            for (const typePattern of typePatterns) {
              const typeMatch = permHtml.match(typePattern);
              if (typeMatch) {
                type = typeMatch[1].trim();
                break;
              }
            }

            if (permissionName && !seenPermissions.has(permissionName.toLowerCase())) {
              seenPermissions.add(permissionName.toLowerCase());
              if (short) {
                permissions.push(permissionName);
              } else {
                permissions.push({
                  permission: permissionName,
                  type: type,
                });
              }
            }
          }
        }
      }
    }

    // Strategy 2: Extract from script tags with JSON data
    const scriptMatches = html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi);
    
    for (const match of scriptMatches) {
      const scriptContent = match[1];
      
      if (scriptContent.includes('permission') || scriptContent.includes('PERMISSION') || scriptContent.includes('uses-permission')) {
        // Try multiple JSON patterns
        const jsonPatterns = [
          /permissions["']?\s*:\s*\[([\s\S]*?)\]/i,
          /"permissions"["']?\s*:\s*\[([\s\S]*?)\]/i,
          /permissionList["']?\s*:\s*\[([\s\S]*?)\]/i,
          /usesPermissions["']?\s*:\s*\[([\s\S]*?)\]/i,
        ];

        for (const pattern of jsonPatterns) {
          const permArrayMatch = scriptContent.match(pattern);
          if (permArrayMatch) {
            const permData = permArrayMatch[1];
            
            // Try to extract permission names
            // Pattern 1: Array of strings
            const stringMatches = permData.matchAll(/"([^"]+)"/g);
            for (const stringMatch of stringMatches) {
              const permName = stringMatch[1].trim();
              if (permName && permName.length > 3 && !seenPermissions.has(permName.toLowerCase())) {
                seenPermissions.add(permName.toLowerCase());
                if (short) {
                  permissions.push(permName);
                } else {
                  permissions.push({
                    permission: permName,
                    type: '',
                  });
                }
              }
            }

            // Pattern 2: Array of objects
            try {
              const jsonStr = '[' + permData + ']';
              const jsonData = JSON.parse(jsonStr);
              if (Array.isArray(jsonData)) {
                jsonData.forEach(item => {
                  if (typeof item === 'string') {
                    if (!seenPermissions.has(item.toLowerCase())) {
                      seenPermissions.add(item.toLowerCase());
                      if (short) {
                        permissions.push(item);
                      } else {
                        permissions.push({
                          permission: item,
                          type: '',
                        });
                      }
                    }
                  } else if (item && typeof item === 'object') {
                    const permName = item.name || item.permission || item.label || item.title;
                    const permType = item.type || item.category || '';
                    if (permName && !seenPermissions.has(permName.toLowerCase())) {
                      seenPermissions.add(permName.toLowerCase());
                      if (short) {
                        permissions.push(permName);
                      } else {
                        permissions.push({
                          permission: permName,
                          type: permType,
                        });
                      }
                    }
                  }
                });
              }
            } catch (e) {
              // Not valid JSON, continue
            }
          }
        }
      }
    }

    // Strategy 3: Extract from meta tags or data attributes
    const metaPermissionMatches = html.matchAll(/<meta[^>]*name=["']permission["'][^>]*content=["']([^"']+)["']/gi);
    for (const metaMatch of metaPermissionMatches) {
      const permName = metaMatch[1].trim();
      if (permName && !seenPermissions.has(permName.toLowerCase())) {
        seenPermissions.add(permName.toLowerCase());
        if (short) {
          permissions.push(permName);
        } else {
          permissions.push({
            permission: permName,
            type: '',
          });
        }
      }
    }

    // Strategy 4: Look for common permission patterns in text
    // This is a fallback for when structured data isn't available
    const commonPermissionPatterns = [
      /(?:permission|allows?)\s+(?:the\s+)?(?:app\s+)?(?:to\s+)?(?:access|read|write|modify|delete|use|send|receive|view|get|set|manage|control|change|enable|disable)\s+([^.,!?]+)/gi,
    ];

    // Only use this as last resort if we have very few permissions
    if (permissions.length < 3) {
      for (const pattern of commonPermissionPatterns) {
        const matches = html.matchAll(pattern);
        for (const match of matches) {
          const permText = match[1].trim();
          if (permText && permText.length > 5 && permText.length < 100 && !seenPermissions.has(permText.toLowerCase())) {
            seenPermissions.add(permText.toLowerCase());
            if (short) {
              permissions.push(permText);
            } else {
              permissions.push({
                permission: permText,
                type: '',
              });
            }
          }
        }
      }
    }

    return permissions;
  } catch (error) {
    console.error('Error parsing Google Play permissions:', error);
    return [];
  }
}
