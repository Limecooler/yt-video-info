export interface VideoMetadata {
  title: string;
  author: string;
  lengthSeconds: number;
  viewCount: number;
  description: string;
}

export interface TranscriptSegment {
  start: number;
  text: string;
}

export interface Transcript {
  text: string;
  segments: TranscriptSegment[];
}

export interface VideoInfoResponse {
  metadata: VideoMetadata;
  transcript: Transcript | null;
  error?: string;
}

export interface CaptionTrack {
  baseUrl: string;
  name?: { simpleText?: string };
  languageCode?: string;
  kind?: string;
  isTranslatable?: boolean;
}

export interface YouTubePlayerResponse {
  videoDetails?: {
    videoId?: string;
    title?: string;
    lengthSeconds?: string;
    keywords?: string[];
    channelId?: string;
    shortDescription?: string;
    viewCount?: string;
    author?: string;
  };
  captions?: {
    playerCaptionsTracklistRenderer?: {
      captionTracks?: CaptionTrack[];
    };
  };
  playabilityStatus?: {
    status?: string;
    reason?: string;
  };
}

export type YouTubeErrorCode = 
  | 'INVALID_ID' 
  | 'NOT_FOUND' 
  | 'PRIVATE' 
  | 'AGE_RESTRICTED'
  | 'REGION_BLOCKED'
  | 'NO_TRANSCRIPT' 
  | 'PARSE_ERROR' 
  | 'NETWORK_ERROR'
  | 'RATE_LIMITED'
  | 'TIMEOUT';

export class YouTubeError extends Error {
  constructor(
    message: string,
    public code: YouTubeErrorCode,
    public details?: any
  ) {
    super(message);
    this.name = 'YouTubeError';
  }
  
  static isRetryable(error: YouTubeError): boolean {
    return ['NETWORK_ERROR', 'RATE_LIMITED', 'TIMEOUT'].includes(error.code);
  }
}