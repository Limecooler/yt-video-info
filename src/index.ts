#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ErrorCode,
  McpError
} from '@modelcontextprotocol/sdk/types.js';

import { fetchVideoInfo, fetchTranscript } from './scraper.js';
import { VideoInfoResponse, YouTubeError } from './types.js';
import { GetVideoInfoArgsSchema } from './validation.js';
import { logger } from './logger.js';
import { z } from 'zod';

const server = new Server(
  {
    name: 'youtube-info',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Handle tool listing
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'get_video_info',
        description: 'Get information and transcript from a YouTube video',
        inputSchema: {
          type: 'object',
          properties: {
            video_id: {
              type: 'string',
              description: 'The YouTube video ID (11 characters)',
              pattern: '^[a-zA-Z0-9_-]{11}$'
            }
          },
          required: ['video_id']
        }
      }
    ]
  };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name !== 'get_video_info') {
    logger.warn(`Unknown tool requested: ${request.params.name}`);
    throw new McpError(
      ErrorCode.MethodNotFound,
      `Unknown tool: ${request.params.name}`
    );
  }
  
  logger.debug(`Tool called: ${request.params.name}`);

  // Validate arguments with Zod
  let args: z.infer<typeof GetVideoInfoArgsSchema>;
  try {
    args = GetVideoInfoArgsSchema.parse(request.params.arguments);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `Invalid parameters: ${error.errors.map(e => e.message).join(', ')}`
      );
    }
    throw new McpError(
      ErrorCode.InvalidParams,
      'Invalid parameters'
    );
  }

  try {
    // Fetch video metadata and caption tracks
    const { metadata, captionTracks } = await fetchVideoInfo(args.video_id);
    
    let transcript = null;
    let transcriptError: string | undefined;

    // Try to fetch transcript if available
    if (captionTracks.length > 0) {
      // Prefer manually created captions over auto-generated
      const manualTrack = captionTracks.find(track => track.kind !== 'asr');
      const trackToUse = manualTrack || captionTracks[0];
      
      try {
        transcript = await fetchTranscript(trackToUse);
      } catch (error) {
        if (error instanceof YouTubeError) {
          transcriptError = error.message;
        } else {
          transcriptError = 'Failed to fetch transcript';
        }
      }
    } else {
      transcriptError = 'No transcript available for this video';
    }

    const response: VideoInfoResponse = {
      metadata,
      transcript,
      ...(transcriptError && !transcript ? { error: transcriptError } : {})
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response, null, 2)
        }
      ]
    };
  } catch (error) {
    if (error instanceof YouTubeError) {
      throw new McpError(
        ErrorCode.InternalError,
        error.message,
        {
          code: error.code,
          details: error.details
        }
      );
    }
    
    throw new McpError(
      ErrorCode.InternalError,
      `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  // Log to stderr to avoid interfering with MCP communication
  logger.info('YouTube Info MCP server running');
  logger.debug('Debug logging enabled');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});