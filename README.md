# YouTube Info MCP Server

[![npm version](https://img.shields.io/npm/v/@limecooler/yt-info-mcp.svg)](https://www.npmjs.com/package/@limecooler/yt-info-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org)
[![npm downloads](https://img.shields.io/npm/dm/@limecooler/yt-info-mcp.svg)](https://www.npmjs.com/package/@limecooler/yt-info-mcp)

A lightweight MCP server that extracts YouTube video metadata and transcripts through web scraping, featuring robust error handling, caching, and retry logic without requiring API keys or external dependencies.

## Table of Contents

- [🚀 Quick Start](#-quick-start)
- [Prerequisites](#prerequisites)
- [Features](#features)
- [How It Works](#how-it-works)
- [Comparison with Alternatives](#comparison-with-alternatives)
- [Installation](#installation)
- [Claude Desktop Configuration](#claude-desktop-configuration)
- [Claude Code Configuration](#claude-code-configuration)
- [Usage](#usage)
- [API Reference](#api-reference)
- [Response Format](#response-format)
- [Error Handling](#error-handling)
- [Development](#development)
- [Troubleshooting](#troubleshooting)
- [Environment Variables](#environment-variables)
- [Performance](#performance)
- [Security](#security)
- [Limitations](#limitations)
- [Contributing](#contributing)
- [Built with Claude Code](#built-with-claude-code)
- [Changelog](#changelog)
- [License](#license)

## 🚀 Quick Start

```bash
npx @limecooler/yt-info-mcp
```

That's it! No installation required.

## Prerequisites

- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 9.0.0 or higher (for global installation)
- **Operating System**: Windows, macOS, or Linux

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

## How It Works

This MCP server uses YouTube's InnerTube API (the same API used by YouTube's mobile apps) to reliably fetch video data:

1. **Page Fetch**: Retrieves the YouTube video page HTML
2. **API Key Extraction**: Extracts the `INNERTUBE_API_KEY` from the page source
3. **InnerTube Request**: Makes an authenticated POST request to `/youtubei/v1/player`
4. **Android Context**: Uses Android client context (`clientName: "ANDROID"`) for better transcript access
5. **Fallback Strategy**: Falls back to HTML scraping if InnerTube fails

This approach is more reliable than direct caption URL fetching because it mimics how YouTube's official apps retrieve data.

## Comparison with Alternatives

| Feature | yt-info-mcp | yt-dlp | youtube-dl | YouTube API |
|---------|-------------|--------|------------|-------------|
| No API Key Required | ✅ | ✅ | ✅ | ❌ |
| Transcript Support | ✅ | ✅ | ✅ | ✅ |
| Lightweight (<10MB) | ✅ | ❌ | ❌ | ✅ |
| MCP Protocol | ✅ | ❌ | ❌ | ❌ |
| No Python Required | ✅ | ❌ | ❌ | ✅ |
| TypeScript/JavaScript | ✅ | ❌ | ❌ | ✅ |
| Caching Built-in | ✅ | ❌ | ❌ | ❌ |

## Installation

> **Note**: Installation is not necessary if you're using this with Claude Desktop or Claude Code. See [Claude Desktop Configuration](#claude-desktop-configuration) or [Claude Code Configuration](#claude-code-configuration) below.

### Option 1: Direct Usage with npx (Recommended)

No installation needed! You can run the server directly using npx:

```bash
npx @limecooler/yt-info-mcp
```

### Option 2: Install from npm

```bash
npm install -g @limecooler/yt-info-mcp
```

### Option 3: Local Installation

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

### Configuration File Locations

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

### Option 1: Using npx (Recommended - No Installation Required)

```json
{
  "mcpServers": {
    "youtube-info": {
      "command": "npx",
      "args": ["-y", "@limecooler/yt-info-mcp@latest"]
    }
  }
}
```

### Option 2: Local Installation

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

## Claude Code Configuration

To use this MCP server with Claude Code:

### Option 1: Quick Setup Using CLI (Recommended)

Simply run this command in your terminal:

```bash
claude mcp add yt-info-mcp -s user -- npx -y @limecooler/yt-info-mcp@latest
```

This automatically adds the YouTube Info MCP server to your global Claude Code configuration.

### Option 2: Manual Global Configuration

Add to your global Claude Code configuration file:

**Configuration File Locations:**
- **macOS/Linux**: `~/.claude/config.json`
- **Windows**: `%USERPROFILE%\.claude\config.json`

```json
{
  "mcpServers": {
    "youtube-info": {
      "command": "npx",
      "args": ["-y", "@limecooler/yt-info-mcp@latest"]
    }
  }
}
```

This makes the YouTube Info MCP server available in all your Claude Code sessions.

### Option 3: Project-Specific Configuration

Add to your Claude Code project configuration (`.claude/project.json`):

```json
{
  "mcpServers": {
    "youtube-info": {
      "command": "npx",
      "args": ["-y", "@limecooler/yt-info-mcp@latest"]
    }
  }
}
```

### Option 4: Local Installation

If you've cloned the repository locally:

```json
{
  "mcpServers": {
    "youtube-info": {
      "command": "node",
      "args": ["./path/to/yt-video-info/dist/index.js"]
    }
  }
}
```

Once configured, you can use the tool in Claude Code:

```
User: Get information about YouTube video dQw4w9WgXcQ

Claude Code: I'll fetch the video information using the YouTube Info MCP server.
[Uses the MCP tool to retrieve video metadata and transcript]
```

## Usage

### Using with Claude Desktop

Once configured, you can use the tool in Claude Desktop:

```
Please get information from YouTube video dQw4w9WgXcQ
```

### Using from npm (Command Line)

If you installed globally via npm:

```bash
# Run the MCP server directly
yt-info-mcp

# Or use with a tool that supports MCP
npx @modelcontextprotocol/cli connect yt-info-mcp
```

### Using as a Library

```javascript
import { fetchVideoInfo, fetchTranscript } from '@limecooler/yt-info-mcp';

// Get video information
const { metadata, captionTracks } = await fetchVideoInfo('dQw4w9WgXcQ');

// Fetch transcript if available
if (captionTracks.length > 0) {
  const transcript = await fetchTranscript(captionTracks[0]);
}
```

The tool will return:
- Video metadata (title, author, duration, view count, description)
- Transcript with timestamps (if available)
- Error details if the video is unavailable or has no transcript

## API Reference

### `fetchVideoInfo(videoId: string)`

Fetches video metadata and available caption tracks.

**Parameters:**
- `videoId` (string): The 11-character YouTube video ID

**Returns:** `Promise<{ metadata: VideoMetadata; captionTracks: CaptionTrack[] }>`
- `metadata`: Object containing video information
  - `title` (string): Video title
  - `author` (string): Channel name
  - `lengthSeconds` (number): Duration in seconds
  - `viewCount` (number): View count
  - `description` (string): Video description
- `captionTracks`: Array of available caption tracks
  - `baseUrl` (string): URL to fetch the transcript
  - `languageCode` (string): Language code (e.g., "en", "es")

**Throws:** `YouTubeError` with specific error codes:
- `INVALID_ID`: Invalid video ID format
- `NOT_FOUND`: Video doesn't exist
- `PRIVATE`: Video is private
- `AGE_RESTRICTED`: Age-restricted content
- `REGION_BLOCKED`: Region-blocked content

### `fetchTranscript(captionTrack: CaptionTrack)`

Fetches and parses transcript for a given caption track.

**Parameters:**
- `captionTrack` (CaptionTrack): Caption track object from `fetchVideoInfo`

**Returns:** `Promise<Transcript>`
- `text` (string): Full transcript text
- `segments` (array): Array of transcript segments
  - `start` (number): Start time in seconds
  - `text` (string): Segment text

**Example with Error Handling:**
```javascript
try {
  const { metadata, captionTracks } = await fetchVideoInfo('dQw4w9WgXcQ');
  
  if (captionTracks.length > 0) {
    const transcript = await fetchTranscript(captionTracks[0]);
    console.log(transcript.text);
  }
} catch (error) {
  if (error.code === 'PRIVATE') {
    console.log('This video is private');
  }
}
```

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

## Troubleshooting

### Common Issues

#### "Command not found" after npm install
**Solution**: Add npm global bin directory to your PATH or use npx:
```bash
# Check npm bin location
npm bin -g

# Or just use npx
npx @limecooler/yt-info-mcp
```

#### Empty transcript responses
**Possible causes:**
- Video doesn't have captions enabled
- Video is region-restricted in your area
- YouTube is rate-limiting your requests

**Solution**: Check if the video has the "CC" button on YouTube's website.

#### "INVALID_ID" error
**Solution**: Ensure the video ID is exactly 11 characters. Extract it from the URL:
- ✅ Correct: `dQw4w9WgXcQ`
- ❌ Wrong: `https://youtube.com/watch?v=dQw4w9WgXcQ`

#### Connection refused in Claude Desktop
**Solution**: Make sure the configuration path is absolute, not relative:
```json
{
  "mcpServers": {
    "youtube-info": {
      "command": "node",
      "args": ["/Users/username/yt-video-info/dist/index.js"]  // Full path
    }
  }
}
```

#### Rate limiting errors
**Solution**: Implement delays between requests or use the built-in caching:
```javascript
// Videos are cached for 1 hour, transcripts for 2 hours
await fetchVideoInfo('video1');
// Second call uses cache
await fetchVideoInfo('video1');
```

## Environment Variables

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `MCP_DEBUG` | Enable debug logging to stderr | `false` | `MCP_DEBUG=true` |
| `DEBUG` | Alternative debug flag | `false` | `DEBUG=true` |
| `NODE_ENV` | Environment mode | `production` | `NODE_ENV=development` |

## Performance

- **Startup Time**: <500ms (measured on M1 MacBook Air)
- **Memory Usage**: ~50MB idle, ~100MB during active requests
- **Cache TTL**: Video info (1 hour), Transcripts (2 hours)
- **Response Time**: 
  - Cached: <100ms
  - Fresh fetch: 2-4s (depends on YouTube's response time)
- **Concurrent Requests**: Limited by Node.js event loop

## Security

### Security Considerations

- **No credentials**: No API keys or authentication tokens required or stored
- **Read-only**: Only performs GET/POST requests to retrieve public data
- **No user data**: Doesn't collect or transmit any user information
- **Content filtering**: Respects YouTube's age restrictions and privacy settings
- **Safe dependencies**: Minimal dependencies, all from trusted sources
- **Input validation**: All inputs validated with Zod schemas

### Best Practices

- Run in isolated environment if processing untrusted video IDs
- Monitor rate limits to avoid IP blocking
- Use environment variables for configuration, not hardcoded values

## Limitations
- Relies on YouTube's web interface structure, which may change
- Cannot transcribe audio - only downloads existing captions
- May be rate-limited by YouTube if used excessively
- Age-restricted or private videos cannot be accessed

## Contributing

We welcome contributions! Here's how you can help:

### Getting Started

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`npm test`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Development Guidelines

- Follow existing code style and conventions
- Add tests for new features
- Update documentation as needed
- Keep commits focused and descriptive
- Ensure all tests pass before submitting PR

### Reporting Issues

- Check existing issues before creating new ones
- Include steps to reproduce bugs
- Provide system information (Node.js version, OS)
- Include relevant error messages and logs

## Built with Claude Code

This entire project was developed using [Claude Code](https://claude.ai/code), Anthropic's AI-powered coding assistant. Claude Code enables rapid development with built-in best practices and comprehensive testing.

### Making Changes with Claude Code

To contribute or modify this repository using Claude Code:

1. **Install Claude Code** (if you haven't already):
   ```bash
   npm install -g @anthropic-ai/claude-code
   ```

2. **Clone and open the repository**:
   ```bash
   git clone https://github.com/Limecooler/yt-video-info.git
   cd yt-video-info
   claude-code
   ```

3. **Ask Claude Code to make changes**:
   - "Add support for playlist extraction"
   - "Improve error handling for rate limiting"
   - "Add unit tests for the scraper module"
   - "Update the InnerTube API implementation"

4. **Claude Code will**:
   - Understand the existing codebase structure
   - Follow the established patterns and conventions
   - Run tests to ensure changes don't break functionality
   - Update documentation as needed
   - Commit changes with descriptive messages

### Why Claude Code?

- **Context-aware**: Understands the entire codebase and maintains consistency
- **Best practices**: Automatically follows TypeScript, MCP, and npm conventions
- **Test-driven**: Ensures changes are tested and documented
- **Efficient**: Reduces development time from hours to minutes

### Example Claude Code Session

```
You: "Add a feature to download video thumbnails"

Claude Code: I'll add thumbnail download functionality to the MCP server.
[Claude Code analyzes the codebase, implements the feature, adds tests, 
updates types, and creates a commit]

You: "Now add documentation for the new feature"

Claude Code: I'll update the README and add inline documentation.
[Updates all relevant documentation files]
```

## Changelog

See [Releases](https://github.com/Limecooler/yt-video-info/releases) for a detailed version history.

### Latest Version: v1.1.1
- 🔧 Fixed executable permissions for npx compatibility
- 🐛 Resolved Claude Code connection error (MCP error -32000)
- 📚 Added simple Claude Code CLI setup command

### v1.1.0
- 🐛 Fixed transcript fetching using YouTube's InnerTube API
- ✨ Added Android client context for better reliability
- 📚 Improved documentation with badges and better structure

## License

MIT