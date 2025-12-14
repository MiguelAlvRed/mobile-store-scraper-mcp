#!/usr/bin/env node

/**
 * MCP Server for App Store and Google Play Store data
 * Provides tools to query iTunes/App Store and Google Play data via Model Context Protocol
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { fetchJSON, fetchText } from './httpClient.js';

// App Store imports
import {
  buildSearchUrl,
  buildAppUrl,
  buildDeveloperUrl,
  buildReviewsUrl,
  buildRatingsUrl,
  buildSimilarUrl,
  buildPrivacyUrl,
  buildVersionHistoryUrl,
  buildListUrl,
  buildSuggestUrl,
} from './endpoints/appStore.js';

import { parseApp, parseApps } from './parsers/appStore/app.js';
import { parseList } from './parsers/appStore/list.js';
import { parseReviews } from './parsers/appStore/reviews.js';
import { parseSearch } from './parsers/appStore/search.js';
import { parseRatings } from './parsers/appStore/ratings.js';
import { parsePrivacy } from './parsers/appStore/privacy.js';
import { parseVersionHistory } from './parsers/appStore/versionHistory.js';
import { parseSuggest } from './parsers/appStore/suggest.js';
import { parseSimilarFromHTML } from './parsers/appStore/similar.js';

// Google Play imports
import {
  buildSearchUrl as buildGPSearchUrl,
  buildAppUrl as buildGPAppUrl,
  buildDeveloperUrl as buildGPDeveloperUrl,
  buildReviewsUrl as buildGPReviewsUrl,
  buildListUrl as buildGPListUrl,
  buildSimilarUrl as buildGPSimilarUrl,
  buildPermissionsUrl,
  buildDataSafetyUrl,
  buildCategoriesUrl,
  buildSuggestUrl as buildGPSuggestUrl,
} from './endpoints/googlePlay.js';

import { parseApp as parseGPApp } from './parsers/googlePlay/app.js';
import { parseSearchResults as parseGPSearch } from './parsers/googlePlay/search.js';
import { parseReviews as parseGPReviews } from './parsers/googlePlay/reviews.js';
import { parseList as parseGPList } from './parsers/googlePlay/list.js';
import { parseSimilar as parseGPSimilar } from './parsers/googlePlay/similar.js';
import { parsePermissions } from './parsers/googlePlay/permissions.js';
import { parseDataSafety } from './parsers/googlePlay/datasafety.js';
import { parseCategories } from './parsers/googlePlay/categories.js';
import { parseSuggest as parseGPSuggest } from './parsers/googlePlay/suggest.js';

const server = new Server(
  {
    name: 'store-scraper-mcp',
    version: '2.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * App tool - Get detailed information about an app
 */
async function handleApp(args) {
  try {
    const { id, appId, country = 'us' } = args;
    
    if (!id && !appId) {
      throw new Error('Either id or appId must be provided');
    }

    const url = buildAppUrl({ id, appId, country });
    const data = await fetchJSON(url);
    const app = parseApp(data);

    if (!app) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ error: 'App not found' }, null, 2),
          },
        ],
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(app, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ error: error.message }, null, 2),
        },
      ],
      isError: true,
    };
  }
}

/**
 * Search tool - Search for apps
 */
async function handleSearch(args) {
  try {
    const {
      term,
      country = 'us',
      lang = 'en',
      num = 50,
      page = 1,
    } = args;

    if (!term) {
      throw new Error('term is required');
    }

    const url = buildSearchUrl({ term, country, lang, num, page });
    const data = await fetchJSON(url);
    const result = parseSearch(data);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ error: error.message }, null, 2),
        },
      ],
      isError: true,
    };
  }
}

/**
 * List tool - Get app rankings (top free, paid, grossing)
 */
async function handleList(args) {
  try {
    const {
      chart = 'topfreeapplications',
      category = 'all',
      country = 'us',
      genre = 'all',
      limit = 200,
    } = args;

    const url = buildListUrl({ chart, category, country, genre, limit });
    const data = await fetchJSON(url);
    // Use parseList for RSS feed format, fallback to parseApps for JSON format
    const apps = data.feed ? parseList(data) : parseApps(data);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            chart,
            country,
            results: apps,
            count: apps.length,
          }, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ error: error.message }, null, 2),
        },
      ],
      isError: true,
    };
  }
}

/**
 * Reviews tool - Get app reviews with pagination
 */
async function handleReviews(args) {
  try {
    const {
      id,
      appId,
      country = 'us',
      page = 1,
      sort = 'mostRecent',
    } = args;

    if (!id && !appId) {
      throw new Error('Either id or appId must be provided');
    }

    const url = buildReviewsUrl({ id, appId, country, page, sort });
    const data = await fetchJSON(url);
    const reviews = parseReviews(data);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            page,
            reviews,
            count: reviews.length,
          }, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ error: error.message }, null, 2),
        },
      ],
      isError: true,
    };
  }
}

/**
 * Ratings tool - Get app ratings distribution
 */
async function handleRatings(args) {
  try {
    const { id, appId, country = 'us' } = args;

    if (!id && !appId) {
      throw new Error('Either id or appId must be provided');
    }

    const url = buildRatingsUrl({ id, appId, country });
    const data = await fetchJSON(url);
    const app = parseApp(data);

    if (!app) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ error: 'App not found' }, null, 2),
          },
        ],
      };
    }

    const ratings = parseRatings(app);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(ratings, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ error: error.message }, null, 2),
        },
      ],
      isError: true,
    };
  }
}

/**
 * Developer tool - Get apps by developer
 */
async function handleDeveloper(args) {
  try {
    const { devId, country = 'us', lang = 'en' } = args;

    if (!devId) {
      throw new Error('devId is required');
    }

    const url = buildDeveloperUrl({ devId, country, lang });
    const data = await fetchJSON(url);
    const apps = parseApps(data);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            developerId: devId,
            apps,
            count: apps.length,
          }, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ error: error.message }, null, 2),
        },
      ],
      isError: true,
    };
  }
}

/**
 * Similar tool - Get similar apps
 */
async function handleSimilar(args) {
  try {
    const { id, appId, country = 'us' } = args;

    if (!id && !appId) {
      throw new Error('Either id or appId must be provided');
    }

    // Try to get similar apps from the web page
    const url = buildSimilarUrl({ id, appId, country });
    const html = await fetchText(url);
    const similarApps = parseSimilarFromHTML(html);

    // If HTML parsing didn't work, return empty array
    // In a production environment, you might want to implement more robust parsing
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            similarApps,
            count: similarApps.length,
            note: similarApps.length === 0 
              ? 'Similar apps parsing from HTML is limited. Consider using search with related terms.' 
              : null,
          }, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ error: error.message }, null, 2),
        },
      ],
      isError: true,
    };
  }
}

/**
 * Privacy tool - Get app privacy labels
 */
async function handlePrivacy(args) {
  try {
    const { id } = args;

    if (!id) {
      throw new Error('id is required');
    }

    const url = buildPrivacyUrl({ id });
    const data = await fetchJSON(url);
    const privacy = parsePrivacy(data);

    if (!privacy) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ error: 'Privacy data not available' }, null, 2),
          },
        ],
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(privacy, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ error: error.message }, null, 2),
        },
      ],
      isError: true,
    };
  }
}

/**
 * VersionHistory tool - Get app version history
 */
async function handleVersionHistory(args) {
  try {
    const { id, country = 'us' } = args;

    if (!id) {
      throw new Error('id is required');
    }

    const url = buildVersionHistoryUrl({ id, country });
    const data = await fetchJSON(url);
    const history = parseVersionHistory(data);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            id,
            versionHistory: history,
            count: history.length,
          }, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ error: error.message }, null, 2),
        },
      ],
      isError: true,
    };
  }
}

/**
 * Suggest tool - Get search suggestions
 */
async function handleSuggest(args) {
  try {
    const { term, country = 'us' } = args;

    if (!term) {
      throw new Error('term is required');
    }

    const url = buildSuggestUrl({ term, country });
    const data = await fetchJSON(url);
    const suggestions = parseSuggest(data);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            term,
            suggestions,
            count: suggestions.length,
          }, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ error: error.message }, null, 2),
        },
      ],
      isError: true,
    };
  }
}

// ============================================================================
// Google Play Handlers
// ============================================================================

/**
 * Google Play App tool - Get detailed information about an app
 */
async function handleGPApp(args) {
  try {
    const { appId, lang = 'en', country = 'us' } = args;
    
    if (!appId) {
      throw new Error('appId is required for Google Play');
    }

    const url = buildGPAppUrl({ appId, lang, country });
    const html = await fetchText(url);
    const app = parseGPApp(html);

    if (!app) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ error: 'App not found' }, null, 2),
          },
        ],
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(app, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ error: error.message }, null, 2),
        },
      ],
      isError: true,
    };
  }
}

/**
 * Google Play Search tool - Search for apps
 */
async function handleGPSearch(args) {
  try {
    const {
      term,
      country = 'us',
      lang = 'en',
      num = 250,
    } = args;

    if (!term) {
      throw new Error('term is required');
    }

    const url = buildGPSearchUrl({ term, country, lang, num });
    const html = await fetchText(url);
    const result = parseGPSearch(html);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ error: error.message }, null, 2),
        },
      ],
      isError: true,
    };
  }
}

/**
 * Google Play List tool - Get app rankings
 */
async function handleGPList(args) {
  try {
    const {
      collection = 'topselling_free',
      category = 'APPLICATION',
      country = 'us',
      lang = 'en',
      num = 60,
    } = args;

    const url = buildGPListUrl({ collection, category, country, lang, num });
    const html = await fetchText(url);
    const apps = parseGPList(html);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            collection,
            category,
            country,
            results: apps,
            count: apps.length,
          }, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ error: error.message }, null, 2),
        },
      ],
      isError: true,
    };
  }
}

/**
 * Google Play Reviews tool - Get app reviews
 */
async function handleGPReviews(args) {
  try {
    const {
      appId,
      country = 'us',
      lang = 'en',
      page = 0,
      sort = 0,
    } = args;

    if (!appId) {
      throw new Error('appId is required');
    }

    const url = buildGPReviewsUrl({ appId, country, lang, page, sort });
    const html = await fetchText(url);
    const result = parseGPReviews(html);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            page,
            ...result,
          }, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ error: error.message }, null, 2),
        },
      ],
      isError: true,
    };
  }
}

/**
 * Google Play Developer tool - Get apps by developer
 */
async function handleGPDeveloper(args) {
  try {
    const { devId, country = 'us', lang = 'en', num = 60 } = args;

    if (!devId) {
      throw new Error('devId is required');
    }

    const url = buildGPDeveloperUrl({ devId, country, lang, num });
    const html = await fetchText(url);
    const apps = parseGPList(html); // Uses same parser as list

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            developerId: devId,
            apps,
            count: apps.length,
          }, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ error: error.message }, null, 2),
        },
      ],
      isError: true,
    };
  }
}

/**
 * Google Play Similar tool - Get similar apps
 */
async function handleGPSimilar(args) {
  try {
    const { appId, lang = 'en', country = 'us' } = args;

    if (!appId) {
      throw new Error('appId is required');
    }

    const url = buildGPSimilarUrl({ appId, lang, country });
    const html = await fetchText(url);
    const similarApps = parseGPSimilar(html);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            similarApps,
            count: similarApps.length,
          }, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ error: error.message }, null, 2),
        },
      ],
      isError: true,
    };
  }
}

/**
 * Google Play Permissions tool - Get app permissions
 */
async function handleGPPermissions(args) {
  try {
    const { appId, lang = 'en', country = 'us', short = false } = args;

    if (!appId) {
      throw new Error('appId is required');
    }

    const url = buildPermissionsUrl({ appId, lang, country });
    const html = await fetchText(url);
    const permissions = parsePermissions(html, short);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            appId,
            permissions,
            count: permissions.length,
          }, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ error: error.message }, null, 2),
        },
      ],
      isError: true,
    };
  }
}

/**
 * Google Play Data Safety tool - Get data safety information
 */
async function handleGPDataSafety(args) {
  try {
    const { appId, lang = 'en' } = args;

    if (!appId) {
      throw new Error('appId is required');
    }

    const url = buildDataSafetyUrl({ appId, lang });
    const html = await fetchText(url);
    const dataSafety = parseDataSafety(html);

    if (!dataSafety) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ error: 'Data safety information not available' }, null, 2),
          },
        ],
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(dataSafety, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ error: error.message }, null, 2),
        },
      ],
      isError: true,
    };
  }
}

/**
 * Google Play Categories tool - Get list of categories
 */
async function handleGPCategories(args) {
  try {
    const url = buildCategoriesUrl();
    const html = await fetchText(url);
    const categories = parseCategories(html);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            categories,
            count: categories.length,
          }, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ error: error.message }, null, 2),
        },
      ],
      isError: true,
    };
  }
}

/**
 * Google Play Suggest tool - Get search suggestions
 */
async function handleGPSuggest(args) {
  try {
    const { term, country = 'us', lang = 'en' } = args;

    if (!term) {
      throw new Error('term is required');
    }

    const url = buildGPSuggestUrl({ term, country, lang });
    const data = await fetchJSON(url);
    const suggestions = parseGPSuggest(data);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            term,
            suggestions,
            count: suggestions.length,
          }, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ error: error.message }, null, 2),
        },
      ],
      isError: true,
    };
  }
}

// Register tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'app',
        description: 'Get detailed information about an app by ID or bundleId',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'number',
              description: 'iTunes trackId of the app (e.g., 553834731)',
            },
            appId: {
              type: 'string',
              description: 'Bundle ID of the app (e.g., com.midasplayer.apps.candycrushsaga)',
            },
            country: {
              type: 'string',
              description: 'Two-letter country code (default: us)',
              default: 'us',
            },
          },
        },
      },
      {
        name: 'search',
        description: 'Search for apps in the App Store',
        inputSchema: {
          type: 'object',
          properties: {
            term: {
              type: 'string',
              description: 'Search term',
            },
            country: {
              type: 'string',
              description: 'Two-letter country code (default: us)',
              default: 'us',
            },
            lang: {
              type: 'string',
              description: 'Language code (default: en)',
              default: 'en',
            },
            num: {
              type: 'number',
              description: 'Number of results (default: 50, max: 200)',
              default: 50,
            },
            page: {
              type: 'number',
              description: 'Page number (default: 1)',
              default: 1,
            },
          },
          required: ['term'],
        },
      },
      {
        name: 'list',
        description: 'Get app rankings (top free, paid, or grossing)',
        inputSchema: {
          type: 'object',
          properties: {
            chart: {
              type: 'string',
              description: 'Chart type: topfreeapplications, toppaidapplications, or topgrossingapplications',
              default: 'topfreeapplications',
              enum: ['topfreeapplications', 'toppaidapplications', 'topgrossingapplications'],
            },
            country: {
              type: 'string',
              description: 'Two-letter country code (default: us)',
              default: 'us',
            },
            genre: {
              type: 'string',
              description: 'Genre ID or "all" (default: all)',
              default: 'all',
            },
            limit: {
              type: 'number',
              description: 'Number of results (default: 200)',
              default: 200,
            },
          },
        },
      },
      {
        name: 'reviews',
        description: 'Get app reviews with pagination',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'number',
              description: 'iTunes trackId of the app',
            },
            appId: {
              type: 'string',
              description: 'Bundle ID of the app',
            },
            country: {
              type: 'string',
              description: 'Two-letter country code (default: us)',
              default: 'us',
            },
            page: {
              type: 'number',
              description: 'Page number (1-10, default: 1)',
              default: 1,
            },
            sort: {
              type: 'string',
              description: 'Sort order: mostRecent or mostHelpful',
              default: 'mostRecent',
              enum: ['mostRecent', 'mostHelpful'],
            },
          },
        },
      },
      {
        name: 'ratings',
        description: 'Get app ratings distribution',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'number',
              description: 'iTunes trackId of the app',
            },
            appId: {
              type: 'string',
              description: 'Bundle ID of the app',
            },
            country: {
              type: 'string',
              description: 'Two-letter country code (default: us)',
              default: 'us',
            },
          },
        },
      },
      {
        name: 'developer',
        description: 'Get all apps by a developer',
        inputSchema: {
          type: 'object',
          properties: {
            devId: {
              type: 'number',
              description: 'iTunes artistId of the developer (e.g., 284882218 for Facebook)',
            },
            country: {
              type: 'string',
              description: 'Two-letter country code (default: us)',
              default: 'us',
            },
            lang: {
              type: 'string',
              description: 'Language code (default: en)',
              default: 'en',
            },
          },
          required: ['devId'],
        },
      },
      {
        name: 'similar',
        description: 'Get apps similar to the specified app',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'number',
              description: 'iTunes trackId of the app',
            },
            appId: {
              type: 'string',
              description: 'Bundle ID of the app',
            },
            country: {
              type: 'string',
              description: 'Two-letter country code (default: us)',
              default: 'us',
            },
          },
        },
      },
      {
        name: 'privacy',
        description: 'Get app privacy labels and data usage information',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'number',
              description: 'iTunes trackId of the app',
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'versionHistory',
        description: 'Get app version history with release notes',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'number',
              description: 'iTunes trackId of the app',
            },
            country: {
              type: 'string',
              description: 'Two-letter country code (default: us)',
              default: 'us',
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'suggest',
        description: 'Get search suggestions/autocomplete for a search term',
        inputSchema: {
          type: 'object',
          properties: {
            term: {
              type: 'string',
              description: 'Search term to get suggestions for',
            },
            country: {
              type: 'string',
              description: 'Two-letter country code (default: us)',
              default: 'us',
            },
          },
          required: ['term'],
        },
      },
      // Google Play tools
      {
        name: 'gp_app',
        description: '[Google Play] Get detailed information about an app',
        inputSchema: {
          type: 'object',
          properties: {
            appId: {
              type: 'string',
              description: 'Google Play app ID (e.g., com.duolingo)',
            },
            lang: {
              type: 'string',
              description: 'Language code (default: en)',
              default: 'en',
            },
            country: {
              type: 'string',
              description: 'Two-letter country code (default: us)',
              default: 'us',
            },
          },
          required: ['appId'],
        },
      },
      {
        name: 'gp_search',
        description: '[Google Play] Search for apps',
        inputSchema: {
          type: 'object',
          properties: {
            term: {
              type: 'string',
              description: 'Search term',
            },
            country: {
              type: 'string',
              description: 'Two-letter country code (default: us)',
              default: 'us',
            },
            lang: {
              type: 'string',
              description: 'Language code (default: en)',
              default: 'en',
            },
            num: {
              type: 'number',
              description: 'Number of results (default: 250)',
              default: 250,
            },
          },
          required: ['term'],
        },
      },
      {
        name: 'gp_list',
        description: '[Google Play] Get app rankings (top free, paid, grossing)',
        inputSchema: {
          type: 'object',
          properties: {
            collection: {
              type: 'string',
              description: 'Collection type: topselling_free, topselling_paid, topgrossing, movers_shakers',
              default: 'topselling_free',
              enum: ['topselling_free', 'topselling_paid', 'topgrossing', 'movers_shakers'],
            },
            category: {
              type: 'string',
              description: 'Category ID (default: APPLICATION)',
              default: 'APPLICATION',
            },
            country: {
              type: 'string',
              description: 'Two-letter country code (default: us)',
              default: 'us',
            },
            lang: {
              type: 'string',
              description: 'Language code (default: en)',
              default: 'en',
            },
            num: {
              type: 'number',
              description: 'Number of results (default: 60)',
              default: 60,
            },
          },
        },
      },
      {
        name: 'gp_reviews',
        description: '[Google Play] Get app reviews with pagination',
        inputSchema: {
          type: 'object',
          properties: {
            appId: {
              type: 'string',
              description: 'Google Play app ID',
            },
            country: {
              type: 'string',
              description: 'Two-letter country code (default: us)',
              default: 'us',
            },
            lang: {
              type: 'string',
              description: 'Language code (default: en)',
              default: 'en',
            },
            page: {
              type: 'number',
              description: 'Page number (default: 0)',
              default: 0,
            },
            sort: {
              type: 'number',
              description: 'Sort order: 0 = most recent, 2 = most helpful (default: 0)',
              default: 0,
            },
          },
          required: ['appId'],
        },
      },
      {
        name: 'gp_developer',
        description: '[Google Play] Get all apps by a developer',
        inputSchema: {
          type: 'object',
          properties: {
            devId: {
              type: 'string',
              description: 'Google Play developer ID',
            },
            country: {
              type: 'string',
              description: 'Two-letter country code (default: us)',
              default: 'us',
            },
            lang: {
              type: 'string',
              description: 'Language code (default: en)',
              default: 'en',
            },
            num: {
              type: 'number',
              description: 'Number of results (default: 60)',
              default: 60,
            },
          },
          required: ['devId'],
        },
      },
      {
        name: 'gp_similar',
        description: '[Google Play] Get apps similar to the specified app',
        inputSchema: {
          type: 'object',
          properties: {
            appId: {
              type: 'string',
              description: 'Google Play app ID',
            },
            lang: {
              type: 'string',
              description: 'Language code (default: en)',
              default: 'en',
            },
            country: {
              type: 'string',
              description: 'Two-letter country code (default: us)',
              default: 'us',
            },
          },
          required: ['appId'],
        },
      },
      {
        name: 'gp_permissions',
        description: '[Google Play] Get app permissions',
        inputSchema: {
          type: 'object',
          properties: {
            appId: {
              type: 'string',
              description: 'Google Play app ID',
            },
            lang: {
              type: 'string',
              description: 'Language code (default: en)',
              default: 'en',
            },
            country: {
              type: 'string',
              description: 'Two-letter country code (default: us)',
              default: 'us',
            },
            short: {
              type: 'boolean',
              description: 'If true, return only permission names (default: false)',
              default: false,
            },
          },
          required: ['appId'],
        },
      },
      {
        name: 'gp_datasafety',
        description: '[Google Play] Get app data safety information',
        inputSchema: {
          type: 'object',
          properties: {
            appId: {
              type: 'string',
              description: 'Google Play app ID',
            },
            lang: {
              type: 'string',
              description: 'Language code (default: en)',
              default: 'en',
            },
          },
          required: ['appId'],
        },
      },
      {
        name: 'gp_categories',
        description: '[Google Play] Get list of available categories',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'gp_suggest',
        description: '[Google Play] Get search suggestions/autocomplete',
        inputSchema: {
          type: 'object',
          properties: {
            term: {
              type: 'string',
              description: 'Search term to get suggestions for',
            },
            country: {
              type: 'string',
              description: 'Two-letter country code (default: us)',
              default: 'us',
            },
            lang: {
              type: 'string',
              description: 'Language code (default: en)',
              default: 'en',
            },
          },
          required: ['term'],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    // App Store tools
    case 'app':
      return await handleApp(args);
    case 'search':
      return await handleSearch(args);
    case 'list':
      return await handleList(args);
    case 'reviews':
      return await handleReviews(args);
    case 'ratings':
      return await handleRatings(args);
    case 'developer':
      return await handleDeveloper(args);
    case 'similar':
      return await handleSimilar(args);
    case 'privacy':
      return await handlePrivacy(args);
    case 'versionHistory':
      return await handleVersionHistory(args);
    case 'suggest':
      return await handleSuggest(args);
    // Google Play tools
    case 'gp_app':
      return await handleGPApp(args);
    case 'gp_search':
      return await handleGPSearch(args);
    case 'gp_list':
      return await handleGPList(args);
    case 'gp_reviews':
      return await handleGPReviews(args);
    case 'gp_developer':
      return await handleGPDeveloper(args);
    case 'gp_similar':
      return await handleGPSimilar(args);
    case 'gp_permissions':
      return await handleGPPermissions(args);
    case 'gp_datasafety':
      return await handleGPDataSafety(args);
    case 'gp_categories':
      return await handleGPCategories(args);
    case 'gp_suggest':
      return await handleGPSuggest(args);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('App Store MCP server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});

