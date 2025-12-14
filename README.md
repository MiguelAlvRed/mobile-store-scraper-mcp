# Store Scraper MCP

A Model Context Protocol (MCP) server for accessing App Store and Google Play Store data. Provides 20 tools to query application information, reviews, ratings, rankings, and more from both iOS and Android app stores.

## Features

- ✅ **20 MCP Tools** - Complete access to App Store and Google Play data
- ✅ **Dual Store Support** - iOS (App Store) and Android (Google Play)
- ✅ **No External Dependencies** - Self-contained scraping implementation
- ✅ **Robust Error Handling** - Automatic retry and timeout management
- ✅ **Normalized Data** - Consistent structured JSON responses
- ✅ **Cursor IDE Integration** - Ready to use with Cursor

## Installation

```bash
npm install
```

## Configuration

### Cursor IDE

Add the following to your Cursor MCP settings file:

**Windows:**
```
%APPDATA%\Cursor\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json
```

**macOS/Linux:**
```
~/.cursor/mcp.json
```

**Configuration:**
```json
{
  "mcpServers": {
    "store-scraper": {
      "command": "node",
      "args": ["/absolute/path/to/store-scraper-mcp/src/server.js"],
      "cwd": "/absolute/path/to/store-scraper-mcp"
    }
  }
}
```

See `examples/cursor-mcp.json` for a complete example.

Replace `/absolute/path/to/store-scraper-mcp` with your actual project path.

**Restart Cursor** completely after configuration.

## Available Tools

### App Store (iOS) - 10 tools

1. **app** - Get detailed app information
2. **search** - Search for apps
3. **list** - Get app rankings (top free/paid/grossing)
4. **reviews** - Get app reviews with pagination
5. **ratings** - Get app ratings distribution
6. **developer** - Get all apps by a developer
7. **similar** - Get similar apps
8. **privacy** - Get privacy labels and data usage
9. **versionHistory** - Get app version history
10. **suggest** - Get search suggestions/autocomplete

### Google Play (Android) - 10 tools

1. **gp_app** - Get detailed app information
2. **gp_search** - Search for apps
3. **gp_list** - Get app rankings
4. **gp_reviews** - Get app reviews with pagination
5. **gp_developer** - Get all apps by a developer
6. **gp_similar** - Get similar apps
7. **gp_permissions** - Get app permissions
8. **gp_datasafety** - Get data safety information
9. **gp_categories** - Get list of available categories
10. **gp_suggest** - Get search suggestions/autocomplete

## Usage Examples

### In Cursor

Once configured, you can use prompts like:

**App Store:**
```
Search for fitness apps in the App Store
```

```
Get details of Duolingo using bundleId com.duolingo.DuolingoMobile
```

```
Show me the top 20 free apps in the United States
```

**Google Play:**
```
Search for fitness apps on Google Play
```

```
Get details of Duolingo on Google Play (appId: com.duolingo)
```

```
Show me all permissions of WhatsApp on Google Play (appId: com.whatsapp)
```

```
Get data safety information for TikTok (appId: com.zhiliaoapp.musically)
```

## API Reference

### App Store Tools

#### app
Get detailed information about an app.

**Parameters:**
- `id` (number, optional): iTunes trackId
- `appId` (string, optional): Bundle ID
- `country` (string, optional): Two-letter country code (default: "us")

#### search
Search for apps in the App Store.

**Parameters:**
- `term` (string, required): Search term
- `country` (string, optional): Two-letter country code (default: "us")
- `lang` (string, optional): Language code (default: "en")
- `num` (number, optional): Number of results (default: 50, max: 200)
- `page` (number, optional): Page number (default: 1)

#### list
Get app rankings.

**Parameters:**
- `chart` (string, optional): Chart type - "topfreeapplications", "toppaidapplications", or "topgrossingapplications" (default: "topfreeapplications")
- `country` (string, optional): Two-letter country code (default: "us")
- `genre` (string, optional): Genre ID or "all" (default: "all")
- `limit` (number, optional): Number of results (default: 200)

### Google Play Tools

#### gp_app
Get detailed information about an app.

**Parameters:**
- `appId` (string, required): Google Play app ID (e.g., "com.duolingo")
- `lang` (string, optional): Language code (default: "en")
- `country` (string, optional): Two-letter country code (default: "us")

#### gp_search
Search for apps on Google Play.

**Parameters:**
- `term` (string, required): Search term
- `country` (string, optional): Two-letter country code (default: "us")
- `lang` (string, optional): Language code (default: "en")
- `num` (number, optional): Number of results (default: 250)

#### gp_permissions
Get app permissions.

**Parameters:**
- `appId` (string, required): Google Play app ID
- `lang` (string, optional): Language code (default: "en")
- `country` (string, optional): Two-letter country code (default: "us")
- `short` (boolean, optional): If true, return only permission names (default: false)

## Requirements

- Node.js >= 18.0.0
- npm or yarn

## Limitations

### App Store
- Similar apps parsing is limited (HTML parsing required)
- Ratings histogram details not available from public API (only average and count)
- Privacy data only available for US App Store apps

### Google Play
- HTML scraping required, may be fragile to structure changes
- Some data may not be available depending on app structure
- Rate limiting may apply with excessive requests

## Error Handling

The server handles errors robustly:
- **Automatic retry**: 3 attempts with exponential backoff
- **Timeouts**: 30 seconds default
- **HTTP errors**: Proper status code handling
- **Parsing**: Validation and graceful handling of missing data

If functionality is unavailable or fails, returns:
- `null` for individual objects
- `[]` for arrays
- Descriptive error messages

## Project Structure

```
store-scraper-mcp/
├── src/
│   ├── server.js                    # MCP server entry point
│   ├── httpClient.js                # HTTP client with retry logic
│   ├── endpoints/
│   │   ├── appStore.js              # App Store URL builders
│   │   └── googlePlay.js            # Google Play URL builders
│   └── parsers/
│       ├── appStore/                # App Store parsers
│       │   ├── app.js
│       │   ├── list.js
│       │   ├── reviews.js
│       │   ├── search.js
│       │   ├── ratings.js
│       │   ├── privacy.js
│       │   ├── similar.js
│       │   ├── versionHistory.js
│       │   └── suggest.js
│       └── googlePlay/              # Google Play parsers
│           ├── app.js
│           ├── categories.js
│           ├── datasafety.js
│           ├── list.js
│           ├── permissions.js
│           ├── reviews.js
│           ├── search.js
│           ├── similar.js
│           └── suggest.js
├── examples/
│   └── cursor-mcp.json              # Example Cursor configuration
├── .editorconfig                    # Editor configuration
├── .gitattributes                   # Git attributes
├── .gitignore                       # Git ignore rules
├── CHANGELOG.md                     # Changelog
├── LICENSE                          # MIT License
├── package.json                     # Project configuration
└── README.md                        # This file
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Disclaimer

This project is for educational and research purposes. Please respect the terms of service of App Store and Google Play when using this tool.
