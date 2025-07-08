/**
 * Utility functions for the YouTube Info MCP server
 */

interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  factor?: number;
}

/**
 * Implements exponential backoff retry logic
 * @param fn The function to retry
 * @param options Retry configuration options
 * @returns The result of the function
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    factor = 2
  } = options;

  let lastError: Error | undefined;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        break;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        baseDelay * Math.pow(factor, attempt),
        maxDelay
      );
      
      // Add jitter to avoid thundering herd
      const jitter = Math.random() * 0.3 * delay;
      const totalDelay = delay + jitter;
      
      await sleep(totalDelay);
    }
  }
  
  throw lastError || new Error('Retry failed');
}

/**
 * Sleep for specified milliseconds
 * @param ms Milliseconds to sleep
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if an error is retryable
 * @param error The error to check
 * @returns True if the error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }
  
  // Network errors are retryable
  if (error.message.includes('ECONNRESET') || 
      error.message.includes('ETIMEDOUT') ||
      error.message.includes('ENOTFOUND')) {
    return true;
  }
  
  // Some HTTP status codes are retryable
  if ('status' in error && typeof error.status === 'number') {
    const status = error.status;
    // Retry on 5xx errors and some 4xx errors
    return status >= 500 || status === 429 || status === 408;
  }
  
  return false;
}