# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A lightweight MCP (Model Context Protocol) server that retrieves YouTube video information and transcripts using web scraping (no API keys required).

## Common Commands

- `npm install` - Install dependencies
- `npm run build` - Build TypeScript to JavaScript
- `npm run dev` - Run in development mode with auto-reload
- `npm start` - Run the MCP server
- `npx tsx src/index.ts` - Run directly without building

## Architecture

### Core Components

1. **MCP Server** (`src/index.ts`)
   - Implements a single tool: `get_video_info`
   - Handles MCP protocol communication via stdio
   - Returns video metadata and transcripts
   - Uses Zod for runtime validation of tool arguments

2. **Scraper Module** (`src/scraper.ts`)
   - Extracts video data from YouTube's web interface
   - Parses `ytInitialPlayerResponse` from HTML
   - Attempts to fetch transcripts in multiple formats (json3, srv3, vtt)
   - Implements retry logic with exponential backoff
   - Caches results for improved performance

3. **Types** (`src/types.ts`)
   - TypeScript interfaces for video metadata, transcripts, and errors
   - Custom error types with specific error codes
   - Enhanced error codes: INVALID_ID, NOT_FOUND, PRIVATE, AGE_RESTRICTED, REGION_BLOCKED, NO_TRANSCRIPT, PARSE_ERROR, NETWORK_ERROR, RATE_LIMITED, TIMEOUT

4. **Validation** (`src/validation.ts`)
   - Zod schemas for runtime type validation
   - Validates video IDs, API responses, and transcript formats
   - Provides clear error messages for invalid inputs

5. **Utils** (`src/utils.ts`)
   - Retry logic with exponential backoff and jitter
   - Helper functions for error handling
   - Sleep utility for delays

6. **Cache** (`src/cache.ts`)
   - In-memory LRU cache with TTL support
   - Separate caches for video info (1 hour) and transcripts (2 hours)
   - Automatic cleanup of expired entries

7. **Logger** (`src/logger.ts`)
   - Debug logging to stderr (doesn't interfere with MCP)
   - Controlled by MCP_DEBUG or DEBUG environment variables
   - Log levels: debug, info, warn, error

### Key Design Decisions

- **No API Keys**: Uses web scraping instead of YouTube API
- **No External Tools**: No yt-dlp or similar dependencies
- **Minimal Dependencies**: Only MCP SDK and TypeScript
- **Fast Startup**: Optimized for Claude Desktop usage
- **Robust Error Handling**: Specific error codes for different failure scenarios

## Known Limitations

### Transcript Fetching (Fixed)
- **Solution**: Now uses YouTube's InnerTube API (the same API YouTube's mobile apps use)
- **Implementation**: Extracts INNERTUBE_API_KEY from page HTML and makes authenticated requests
- **Android Client**: Uses Android client context for better reliability
- **Fallback**: Falls back to direct HTML extraction if InnerTube fails
- **Success Rate**: Much more reliable than direct caption URL fetching

### Other Limitations
- The scraping approach depends on YouTube's HTML structure, which may change
- Cannot transcribe audio - only downloads existing captions
- Rate limiting may occur with excessive use
- Age-restricted or private videos cannot be accessed
- Some videos may have captions disabled by the uploader

## Troubleshooting

### Common Issues

1. **Empty Transcript Responses**
   - YouTube's caption URLs often return empty responses due to protective measures
   - The server will return metadata even if transcripts fail
   - Error message will indicate "Transcript not available"

2. **Video Not Found**
   - Verify the video ID is exactly 11 characters
   - Check if the video is private or age-restricted
   - Ensure the video still exists on YouTube

3. **Build Errors**
   - Run `npm install` to ensure all dependencies are installed
   - Make sure you have Node.js 18+ installed
   - Try deleting `node_modules` and `dist` folders, then reinstall

### Debugging Tips

For debugging transcript issues:
```javascript
// Create a test file to debug specific videos
import { fetchVideoInfo, fetchTranscript } from './dist/scraper.js';

const { metadata, captionTracks } = await fetchVideoInfo('VIDEO_ID');
console.log('Caption tracks found:', captionTracks.length);
```

### Future Development Considerations

If improving transcript support:
1. **Alternative Approaches**:
   - Consider using YouTube's InnerTube API (requires reverse engineering)
   - Implement cookie-based authentication for better access
   - Use headless browser automation (slower but more reliable)

2. **Code Structure for Extensions**:
   - The `fetchTranscript` function in `scraper.ts` tries multiple formats
   - Add new formats to the `formats` array in that function
   - The `parseTranscript` function handles JSON formats
   - The `parseVTTTranscript` function handles VTT format

3. **Error Handling Patterns**:
   - All errors use the custom `YouTubeError` class with specific codes
   - Error codes: `INVALID_ID`, `NOT_FOUND`, `PRIVATE`, `NO_TRANSCRIPT`, `PARSE_ERROR`, `NETWORK_ERROR`
   - Errors are propagated with detailed messages for debugging

## MCP Tool Details

**Tool Name**: `get_video_info`
**Parameters**: 
- `video_id` (string, required): 11-character YouTube video ID

**Response Structure**:
```json
{
  "metadata": {
    "title": "string",
    "author": "string", 
    "lengthSeconds": "number",
    "viewCount": "number",
    "description": "string"
  },
  "transcript": {
    "text": "string",
    "segments": [{"start": "number", "text": "string"}]
  } | null,
  "error": "string (if transcript unavailable)"
}
```

## Recent Changes

### InnerTube API Integration (2025-07-08)
- Added YouTube's InnerTube API support for more reliable transcript fetching
- Extracts INNERTUBE_API_KEY from YouTube page HTML
- Makes authenticated POST requests to `/youtubei/v1/player` endpoint
- Uses Android client context (`clientName: "ANDROID"`) for better access
- Falls back to HTML extraction if InnerTube fails
- Significantly improves transcript fetching success rate