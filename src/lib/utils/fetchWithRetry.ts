/**
 * Fetch with Retry Utility
 *
 * Implements exponential backoff for resilient API calls:
 * - 4 retry attempts maximum
 * - Exponential backoff: 2s, 4s, 8s, 16s (max)
 * - Retries on network errors and 5xx/429 status codes
 */

export interface RetryOptions {
  /** Maximum number of retry attempts (default: 4) */
  maxRetries?: number;
  /** Base delay in milliseconds (default: 2000) */
  baseDelay?: number;
  /** Maximum delay in milliseconds (default: 16000) */
  maxDelay?: number;
  /** Callback when a retry is attempted */
  onRetry?: (attempt: number, error: Error | Response) => void;
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'onRetry'>> = {
  maxRetries: 4,
  baseDelay: 2000,
  maxDelay: 16000,
};

/** HTTP status codes that should trigger a retry */
const RETRYABLE_STATUS_CODES = [
  408, // Request Timeout
  429, // Too Many Requests
  500, // Internal Server Error
  502, // Bad Gateway
  503, // Service Unavailable
  504, // Gateway Timeout
];

/**
 * Check if a status code should trigger a retry
 */
function isRetryableStatus(status: number): boolean {
  return RETRYABLE_STATUS_CODES.includes(status);
}

/**
 * Calculate delay with exponential backoff and jitter
 */
function calculateDelay(attempt: number, baseDelay: number, maxDelay: number): number {
  // Exponential backoff: baseDelay * 2^attempt
  const exponentialDelay = baseDelay * Math.pow(2, attempt);
  // Add jitter (±20%) to prevent thundering herd
  const jitter = exponentialDelay * (0.8 + Math.random() * 0.4);
  // Cap at max delay
  return Math.min(jitter, maxDelay);
}

/**
 * Sleep for a specified duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch with automatic retry on failure
 *
 * @param url - URL to fetch
 * @param init - Fetch init options
 * @param options - Retry configuration
 * @returns Response on success
 * @throws Error after all retries exhausted
 */
export async function fetchWithRetry(
  url: string,
  init?: RequestInit,
  options: RetryOptions = {}
): Promise<Response> {
  const { maxRetries, baseDelay, maxDelay } = { ...DEFAULT_OPTIONS, ...options };
  const { onRetry } = options;

  let lastError: Error | null = null;
  let lastResponse: Response | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    // Wait before retry (skip first attempt)
    if (attempt > 0) {
      const delay = calculateDelay(attempt - 1, baseDelay, maxDelay);
      await sleep(delay);
    }

    try {
      const response = await fetch(url, init);

      // Success - return immediately
      if (response.ok) {
        return response;
      }

      // Non-retryable error - return immediately
      if (!isRetryableStatus(response.status)) {
        return response;
      }

      // Retryable error - try again
      lastResponse = response;

      if (attempt < maxRetries && onRetry) {
        onRetry(attempt + 1, response);
      }
    } catch (error) {
      // Network error - retry
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxRetries && onRetry) {
        onRetry(attempt + 1, lastError);
      }
    }
  }

  // All retries exhausted
  if (lastResponse) {
    return lastResponse;
  }

  throw lastError ?? new Error('Fetch failed after all retries');
}

/**
 * Create a fetch wrapper with pre-configured retry options
 */
export function createRetryFetch(defaultOptions: RetryOptions = {}) {
  return (url: string, init?: RequestInit, options: RetryOptions = {}) =>
    fetchWithRetry(url, init, { ...defaultOptions, ...options });
}

/**
 * Error messages for user display
 */
export const FETCH_ERROR_MESSAGES = {
  network: 'Unable to connect. Please check your internet connection and try again.',
  timeout: 'The request timed out. The server may be busy - please try again.',
  serverError: 'The server is experiencing issues. Please try again later.',
  tooManyRequests: 'Too many requests. Please wait a moment before trying again.',
  unknown: 'An unexpected error occurred. Please try again.',
} as const;

/**
 * Get user-friendly error message based on error or response
 */
export function getUserFriendlyError(errorOrResponse: Error | Response): string {
  if (errorOrResponse instanceof Response) {
    switch (errorOrResponse.status) {
      case 429:
        return FETCH_ERROR_MESSAGES.tooManyRequests;
      case 408:
      case 504:
        return FETCH_ERROR_MESSAGES.timeout;
      case 500:
      case 502:
      case 503:
        return FETCH_ERROR_MESSAGES.serverError;
      default:
        return FETCH_ERROR_MESSAGES.unknown;
    }
  }

  // Network error
  if (errorOrResponse.message.includes('fetch') || errorOrResponse.message.includes('network')) {
    return FETCH_ERROR_MESSAGES.network;
  }

  return FETCH_ERROR_MESSAGES.unknown;
}
