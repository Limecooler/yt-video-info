# YouTube Info MCP Server

A lightweight MCP server that extracts YouTube video metadata and transcripts through web scraping, featuring robust error handling, caching, and retry logic without requiring API keys or external dependencies.

## Features

- Fetches video metadata (title, author, duration, views, description)
- Downloads available transcripts/captions
- No API key required
- No external dependencies (like yt-dlp)
- Fast startup time for Claude Desktop integration
- Comprehensive error handling with specific error codes
- Input validation using Zod schemas
- Retry logic with exponential backoff for network resilience
- In-memory caching for improved performance
- Debug logging support (set `MCP_DEBUG=true`)
- TypeScript with full type safety

## Installation

1. Clone this repository:
```bash
git clone https://github.com/Limecooler/yt-video-info.git
cd yt-video-info
```

2. Install dependencies:
```bash
npm install
```

3. Build the TypeScript code:
```bash
npm run build
```

## Claude Desktop Configuration

Add the following to your Claude Desktop configuration file:

### macOS
Location: `~/Library/Application Support/Claude/claude_desktop_config.json`

### Windows
Location: `%APPDATA%\Claude\claude_desktop_config.json`

### Configuration

```json
{
  "mcpServers": {
    "youtube-info": {
      "command": "node",
      "args": ["/absolute/path/to/yt-video-info/dist/index.js"]
    }
  }
}
```

Or if you prefer to run with tsx directly:

```json
{
  "mcpServers": {
    "youtube-info": {
      "command": "npx",
      "args": ["tsx", "/absolute/path/to/yt-video-info/src/index.ts"]
    }
  }
}
```

## Usage

Once configured, you can use the tool in Claude Desktop:

```
Please get information from YouTube video dQw4w9WgXcQ
```

The tool will return:
- Video metadata (title, author, duration, view count, description)
- Transcript with timestamps (if available)
- Error details if the video is unavailable or has no transcript

## Response Format

```json
{
  "metadata": {
    "title": "Video Title",
    "author": "Channel Name",
    "lengthSeconds": 215,
    "viewCount": 1234567,
    "description": "Video description..."
  },
  "transcript": {
    "text": "Full transcript text...",
    "segments": [
      {
        "start": 0.0,
        "text": "First segment"
      },
      {
        "start": 2.5,
        "text": "Second segment"
      }
    ]
  },
  "error": "Error message if transcript unavailable"
}
```

## Error Handling

The server handles various error cases:
- Invalid video ID format
- Video not found (404)
- Private or age-restricted videos
- Videos without transcripts
- Network errors

## Development

Run in development mode with auto-reload:
```bash
npm run dev
```

### Testing

Run comprehensive tests:
```bash
npm test
```

Test MCP protocol communication:
```bash
npm run test:mcp
```

Enable debug logging:
```bash
MCP_DEBUG=true npm start
```

## Limitations

- Relies on YouTube's web interface structure, which may change
- Cannot access transcripts for videos that don't have captions
- May be rate-limited by YouTube if used excessively
- Does not transcribe audio - only downloads existing captions

## License

MIT