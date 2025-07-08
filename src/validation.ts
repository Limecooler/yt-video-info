import { z } from 'zod';

// Video ID validation schema
export const VideoIdSchema = z.string()
  .length(11, 'Video ID must be exactly 11 characters')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Video ID contains invalid characters');

// Tool arguments schema
export const GetVideoInfoArgsSchema = z.object({
  video_id: VideoIdSchema
});

// YouTube API response schemas
export const YouTubeVideoDetailsSchema = z.object({
  videoId: z.string().optional(),
  title: z.string().optional(),
  lengthSeconds: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  channelId: z.string().optional(),
  shortDescription: z.string().optional(),
  viewCount: z.string().optional(),
  author: z.string().optional(),
});

export const CaptionTrackSchema = z.object({
  baseUrl: z.string(),
  name: z.object({
    simpleText: z.string().optional()
  }).optional(),
  languageCode: z.string().optional(),
  kind: z.string().optional(),
  isTranslatable: z.boolean().optional(),
});

export const YouTubePlayerResponseSchema = z.object({
  videoDetails: YouTubeVideoDetailsSchema.optional(),
  captions: z.object({
    playerCaptionsTracklistRenderer: z.object({
      captionTracks: z.array(CaptionTrackSchema).optional()
    }).optional()
  }).optional(),
  playabilityStatus: z.object({
    status: z.string().optional(),
    reason: z.string().optional()
  }).optional()
});

// Transcript event schema for JSON format
export const TranscriptEventSchema = z.object({
  tStartMs: z.number().optional(),
  dDurationMs: z.number().optional(),
  segs: z.array(z.object({
    utf8: z.string().optional()
  })).optional()
});

export const TranscriptResponseSchema = z.object({
  events: z.array(TranscriptEventSchema).optional(),
  captions: z.array(z.object({
    start: z.number().optional(),
    text: z.string().optional()
  })).optional()
});

// Type exports
export type VideoIdInput = z.infer<typeof VideoIdSchema>;
export type GetVideoInfoArgs = z.infer<typeof GetVideoInfoArgsSchema>;
export type YouTubeVideoDetails = z.infer<typeof YouTubeVideoDetailsSchema>;
export type YouTubePlayerResponseParsed = z.infer<typeof YouTubePlayerResponseSchema>;