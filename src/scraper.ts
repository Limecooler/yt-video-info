import { VideoMetadata, Transcript, TranscriptSegment, YouTubePlayerResponse, YouTubeError, YouTubeErrorCode, CaptionTrack } from './types.js';
import { VideoIdSchema, YouTubePlayerResponseSchema, TranscriptResponseSchema } from './validation.js';
import { withRetry, isRetryableError } from './utils.js';
import { videoInfoCache, transcriptCache } from './cache.js';
import { logger } from './logger.js';
import { z } from 'zod';

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

export async function fetchVideoInfo(videoId: string): Promise<{ metadata: VideoMetadata; captionTracks: CaptionTrack[] }> {
  // Validate video ID format with Zod
  try {
    VideoIdSchema.parse(videoId);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new YouTubeError(error.errors[0].message, 'INVALID_ID');
    }
    throw new YouTubeError('Invalid YouTube video ID format', 'INVALID_ID');
  }

  // Check cache first
  const cached = videoInfoCache.get(videoId);
  if (cached) {
    logger.debug(`Cache hit for video ${videoId}`);
    return cached;
  }
  
  logger.info(`Fetching video info for ${videoId}`);

  const url = `https://www.youtube.com/watch?v=${videoId}`;
  
  try {
    // Fetch with retry logic
    const { html, response } = await withRetry(async () => {
      const response = await fetch(url, {
        headers: {
          'User-Agent': USER_AGENT,
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new YouTubeError('Video not found', 'NOT_FOUND');
        }
        const error = new Error(`HTTP error ${response.status}`) as any;
        error.status = response.status;
        throw error;
      }

      const html = await response.text();
      return { html, response };
    }, { maxRetries: 3, baseDelay: 1000 });
    const playerResponse = extractPlayerResponse(html);

    if (!playerResponse) {
      throw new YouTubeError('Could not extract video data from page', 'PARSE_ERROR');
    }

    // Check if video is available
    if (playerResponse.playabilityStatus?.status !== 'OK') {
      const status = playerResponse.playabilityStatus?.status;
      const reason = playerResponse.playabilityStatus?.reason || 'Video is not available';
      
      // Determine specific error type
      let errorCode: YouTubeErrorCode = 'PRIVATE';
      if (reason.toLowerCase().includes('age')) {
        errorCode = 'AGE_RESTRICTED';
      } else if (reason.toLowerCase().includes('region') || reason.toLowerCase().includes('country')) {
        errorCode = 'REGION_BLOCKED';
      }
      
      throw new YouTubeError(reason, errorCode);
    }

    const metadata = extractMetadata(playerResponse);
    const captionTracks = extractCaptionTracks(playerResponse);

    const result = { metadata, captionTracks };
    
    // Cache the result
    videoInfoCache.set(videoId, result);
    logger.debug(`Cached video info for ${videoId}`);
    
    return result;
  } catch (error) {
    logger.error(`Failed to fetch video ${videoId}:`, error);
    if (error instanceof YouTubeError) {
      throw error;
    }
    throw new YouTubeError(
      `Failed to fetch video: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'NETWORK_ERROR',
      error
    );
  }
}

export async function fetchTranscript(captionTrack: CaptionTrack): Promise<Transcript> {
  // Create cache key from caption track URL
  const cacheKey = captionTrack.baseUrl;
  
  // Check cache first
  const cached = transcriptCache.get(cacheKey);
  if (cached) {
    logger.debug(`Cache hit for transcript`);
    return cached;
  }
  
  logger.info(`Fetching transcript for language: ${captionTrack.languageCode || 'unknown'}`);
  
  try {
    // Try multiple format options
    const formats = ['json3', 'srv3', 'vtt'];
    
    for (const fmt of formats) {
      const url = new URL(captionTrack.baseUrl);
      url.searchParams.set('fmt', fmt);
      
      // Try fetching with retry logic for each format
      let response: Response;
      let text: string;
      
      try {
        const result = await withRetry(async () => {
          const resp = await fetch(url.toString(), {
            headers: {
              'User-Agent': USER_AGENT,
              'Accept': '*/*',
              'Accept-Language': 'en-US,en;q=0.9',
              'Referer': 'https://www.youtube.com/',
            }
          });

          if (!resp.ok) {
            const error = new Error(`HTTP error ${resp.status}`) as any;
            error.status = resp.status;
            throw error;
          }

          const content = await resp.text();
          return { response: resp, text: content };
        }, { maxRetries: 2, baseDelay: 500 });
        
        response = result.response;
        text = result.text;
      } catch (error) {
        // Skip to next format on error
        continue;
      }
      
      // Check if we got actual content
      if (!text || text.length === 0) {
        continue;
      }
      
      try {
        // Try to parse based on format
        let transcript: Transcript;
        if (fmt === 'vtt') {
          transcript = parseVTTTranscript(text);
        } else {
          transcript = parseTranscript(text);
        }
        
        // Cache the successful result
        transcriptCache.set(cacheKey, transcript);
        
        return transcript;
      } catch (e) {
        // Try next format
        continue;
      }
    }
    
    throw new YouTubeError(
      'Transcript not available. The video may not have captions, or they may be restricted.',
      'NO_TRANSCRIPT'
    );
  } catch (error) {
    if (error instanceof YouTubeError) {
      throw error;
    }
    throw new YouTubeError(
      'Failed to fetch transcript',
      'NO_TRANSCRIPT',
      error
    );
  }
}


function extractPlayerResponse(html: string): YouTubePlayerResponse | null {
  // Try multiple patterns to extract the player response
  const patterns = [
    /var\s+ytInitialPlayerResponse\s*=\s*({.+?});/s,
    /ytInitialPlayerResponse\s*=\s*({.+?});/s,
    /"playerResponse":"(\\?.+?)\\?"/s
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) {
      try {
        let jsonStr = match[1];
        
        // If it's from the third pattern, we need to unescape it
        if (pattern === patterns[2]) {
          jsonStr = jsonStr.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
        }
        
        const parsed = JSON.parse(jsonStr);
        // Validate the response with Zod
        return YouTubePlayerResponseSchema.parse(parsed);
      } catch (e) {
        continue;
      }
    }
  }

  return null;
}

function extractMetadata(playerResponse: YouTubePlayerResponse): VideoMetadata {
  const details = playerResponse.videoDetails;
  
  if (!details) {
    throw new YouTubeError('Video details not found', 'PARSE_ERROR');
  }

  return {
    title: details.title || 'Unknown Title',
    author: details.author || 'Unknown Author',
    lengthSeconds: parseInt(details.lengthSeconds || '0', 10),
    viewCount: parseInt(details.viewCount || '0', 10),
    description: details.shortDescription || '',
  };
}

function extractCaptionTracks(playerResponse: YouTubePlayerResponse): CaptionTrack[] {
  const tracks = playerResponse.captions?.playerCaptionsTracklistRenderer?.captionTracks;
  
  if (!tracks || tracks.length === 0) {
    return [];
  }

  return tracks.filter(track => track.baseUrl);
}

function parseTranscript(jsonText: string): Transcript {
  const segments: TranscriptSegment[] = [];
  let fullText = '';

  try {
    const data = JSON.parse(jsonText);
    
    // Validate and parse the transcript response
    const validatedData = TranscriptResponseSchema.parse(data);
    
    // Handle json3 format from YouTube
    if (validatedData.events) {
      for (const event of validatedData.events) {
        // Skip music events and other non-text events
        if (!event.segs || !Array.isArray(event.segs)) {
          continue;
        }
        
        let eventText = '';
        for (const seg of event.segs) {
          if (seg.utf8) {
            eventText += seg.utf8;
          }
        }
        
        if (eventText.trim()) {
          const startTime = (event.tStartMs || 0) / 1000;
          segments.push({
            start: startTime,
            text: eventText.trim()
          });
          fullText += eventText + ' ';
        }
      }
    }
    
    // Handle other potential JSON formats
    if (segments.length === 0 && validatedData.captions) {
      for (const caption of validatedData.captions) {
        if (caption.text) {
          segments.push({
            start: caption.start || 0,
            text: caption.text
          });
          fullText += caption.text + ' ';
        }
      }
    }
  } catch (e) {
    // If not JSON, try XML format
    const textRegex = /<text[^>]*start="([^"]*)"[^>]*>(.*?)<\/text>/gs;
    let match;

    while ((match = textRegex.exec(jsonText)) !== null) {
      const start = parseFloat(match[1]);
      const text = decodeXML(match[2]);
      
      if (text.trim()) {
        segments.push({ start, text: text.trim() });
        fullText += text + ' ';
      }
    }
  }

  if (segments.length === 0) {
    throw new YouTubeError('Could not parse transcript format', 'PARSE_ERROR');
  }

  return {
    text: fullText.trim(),
    segments
  };
}

function parseVTTTranscript(vttText: string): Transcript {
  const segments: TranscriptSegment[] = [];
  let fullText = '';
  
  // Split by double newline to get cues
  const cues = vttText.split(/\n\n+/);
  
  for (const cue of cues) {
    // Skip the WEBVTT header and empty cues
    if (!cue || cue.startsWith('WEBVTT') || cue.trim() === '') {
      continue;
    }
    
    const lines = cue.trim().split('\n');
    if (lines.length >= 2) {
      // Parse timestamp line (e.g., "00:00:00.000 --> 00:00:02.000")
      const timeMatch = lines[0].match(/(\d{2}:\d{2}:\d{2}\.\d{3})/);
      if (timeMatch) {
        const startTime = parseVTTTime(timeMatch[1]);
        // Join all lines after the timestamp
        const text = lines.slice(1).join(' ').trim();
        
        if (text) {
          segments.push({ start: startTime, text });
          fullText += text + ' ';
        }
      }
    }
  }
  
  if (segments.length === 0) {
    throw new YouTubeError('Could not parse VTT transcript format', 'PARSE_ERROR');
  }
  
  return {
    text: fullText.trim(),
    segments
  };
}

function parseVTTTime(timeStr: string): number {
  const parts = timeStr.split(':');
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  const seconds = parseFloat(parts[2]);
  return hours * 3600 + minutes * 60 + seconds;
}

function decodeXML(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(Number(dec)))
    .replace(/&#x([0-9a-fA-F]+);/g, (match, hex) => String.fromCharCode(parseInt(hex, 16)));
}