import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  fetchWithRetry,
  getUserFriendlyError,
  FETCH_ERROR_MESSAGES,
  createRetryFetch,
} from './fetchWithRetry';

describe('fetchWithRetry', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('returns response on successful fetch', async () => {
    const mockResponse = new Response(JSON.stringify({ data: 'test' }), { status: 200 });
    global.fetch = vi.fn().mockResolvedValue(mockResponse);

    const promise = fetchWithRetry('https://api.example.com/test');
    await vi.runAllTimersAsync();
    const response = await promise;

    expect(response.ok).toBe(true);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('retries on 500 error', async () => {
    const errorResponse = new Response('Server Error', { status: 500 });
    const successResponse = new Response(JSON.stringify({ data: 'test' }), { status: 200 });

    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(errorResponse)
      .mockResolvedValueOnce(successResponse);

    const promise = fetchWithRetry('https://api.example.com/test');
    await vi.runAllTimersAsync();
    const response = await promise;

    expect(response.ok).toBe(true);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('retries on 429 rate limit', async () => {
    const rateLimitResponse = new Response('Too Many Requests', { status: 429 });
    const successResponse = new Response(JSON.stringify({ data: 'test' }), { status: 200 });

    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(rateLimitResponse)
      .mockResolvedValueOnce(successResponse);

    const promise = fetchWithRetry('https://api.example.com/test');
    await vi.runAllTimersAsync();
    const response = await promise;

    expect(response.ok).toBe(true);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('retries on network error', async () => {
    const successResponse = new Response(JSON.stringify({ data: 'test' }), { status: 200 });

    global.fetch = vi
      .fn()
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce(successResponse);

    const promise = fetchWithRetry('https://api.example.com/test');
    await vi.runAllTimersAsync();
    const response = await promise;

    expect(response.ok).toBe(true);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('does not retry on 404 error', async () => {
    const notFoundResponse = new Response('Not Found', { status: 404 });
    global.fetch = vi.fn().mockResolvedValue(notFoundResponse);

    const promise = fetchWithRetry('https://api.example.com/test');
    await vi.runAllTimersAsync();
    const response = await promise;

    expect(response.status).toBe(404);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('does not retry on 401 error', async () => {
    const unauthorizedResponse = new Response('Unauthorized', { status: 401 });
    global.fetch = vi.fn().mockResolvedValue(unauthorizedResponse);

    const promise = fetchWithRetry('https://api.example.com/test');
    await vi.runAllTimersAsync();
    const response = await promise;

    expect(response.status).toBe(401);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('respects maxRetries option', async () => {
    const errorResponse = new Response('Server Error', { status: 503 });
    global.fetch = vi.fn().mockResolvedValue(errorResponse);

    const promise = fetchWithRetry('https://api.example.com/test', undefined, {
      maxRetries: 2,
    });
    await vi.runAllTimersAsync();
    const response = await promise;

    expect(response.status).toBe(503);
    expect(global.fetch).toHaveBeenCalledTimes(3); // Initial + 2 retries
  });

  it('calls onRetry callback on each retry', async () => {
    const errorResponse = new Response('Server Error', { status: 500 });
    const successResponse = new Response(JSON.stringify({ data: 'test' }), { status: 200 });
    const onRetry = vi.fn();

    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(errorResponse)
      .mockResolvedValueOnce(errorResponse)
      .mockResolvedValueOnce(successResponse);

    const promise = fetchWithRetry('https://api.example.com/test', undefined, {
      onRetry,
      maxRetries: 4,
    });
    await vi.runAllTimersAsync();
    await promise;

    expect(onRetry).toHaveBeenCalledTimes(2);
    expect(onRetry).toHaveBeenCalledWith(1, errorResponse);
    expect(onRetry).toHaveBeenCalledWith(2, errorResponse);
  });

  it('exhausts retries and returns last error response', async () => {
    // Use a retryable status that returns a response (not a thrown error)
    const errorResponse = new Response('Service Unavailable', { status: 503 });
    global.fetch = vi.fn().mockResolvedValue(errorResponse);

    const promise = fetchWithRetry('https://api.example.com/test', undefined, {
      maxRetries: 2,
      baseDelay: 100,
    });
    await vi.runAllTimersAsync();
    const response = await promise;

    // After all retries exhausted, returns the last response
    expect(response.status).toBe(503);
    expect(global.fetch).toHaveBeenCalledTimes(3); // Initial + 2 retries
  });
});

describe('getUserFriendlyError', () => {
  it('returns network message for fetch errors', () => {
    const error = new Error('fetch failed');
    expect(getUserFriendlyError(error)).toBe(FETCH_ERROR_MESSAGES.network);
  });

  it('returns rate limit message for 429', () => {
    const response = new Response('', { status: 429 });
    expect(getUserFriendlyError(response)).toBe(FETCH_ERROR_MESSAGES.tooManyRequests);
  });

  it('returns timeout message for 408', () => {
    const response = new Response('', { status: 408 });
    expect(getUserFriendlyError(response)).toBe(FETCH_ERROR_MESSAGES.timeout);
  });

  it('returns timeout message for 504', () => {
    const response = new Response('', { status: 504 });
    expect(getUserFriendlyError(response)).toBe(FETCH_ERROR_MESSAGES.timeout);
  });

  it('returns server error message for 500', () => {
    const response = new Response('', { status: 500 });
    expect(getUserFriendlyError(response)).toBe(FETCH_ERROR_MESSAGES.serverError);
  });

  it('returns server error message for 502', () => {
    const response = new Response('', { status: 502 });
    expect(getUserFriendlyError(response)).toBe(FETCH_ERROR_MESSAGES.serverError);
  });

  it('returns server error message for 503', () => {
    const response = new Response('', { status: 503 });
    expect(getUserFriendlyError(response)).toBe(FETCH_ERROR_MESSAGES.serverError);
  });

  it('returns unknown message for other errors', () => {
    const response = new Response('', { status: 418 });
    expect(getUserFriendlyError(response)).toBe(FETCH_ERROR_MESSAGES.unknown);
  });
});

describe('createRetryFetch', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('creates a fetch wrapper with default options', async () => {
    const successResponse = new Response(JSON.stringify({ data: 'test' }), { status: 200 });
    global.fetch = vi.fn().mockResolvedValue(successResponse);

    const customFetch = createRetryFetch({ maxRetries: 2 });
    const promise = customFetch('https://api.example.com/test');
    await vi.runAllTimersAsync();
    const response = await promise;

    expect(response.ok).toBe(true);
  });

  it('allows overriding default options per call', async () => {
    const errorResponse = new Response('Server Error', { status: 500 });
    global.fetch = vi.fn().mockResolvedValue(errorResponse);

    const customFetch = createRetryFetch({ maxRetries: 3 });
    const promise = customFetch('https://api.example.com/test', undefined, { maxRetries: 1 });
    await vi.runAllTimersAsync();
    await promise;

    expect(global.fetch).toHaveBeenCalledTimes(2); // Initial + 1 retry (overridden)
  });
});
