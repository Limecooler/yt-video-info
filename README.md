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

### Option 1: Direct Usage with npx (Recommended)

No installation needed! You can run the server directly using npx.

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
      "args": ["-y", "@limecooler/yt-info-mcp"]
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
- Cannot transcribe audio - only downloads existing captions
- May be rate-limited by YouTube if used excessively
- Age-restricted or private videos cannot be accessed

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

## License

MIT