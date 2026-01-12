import { toast } from '@/stores/toastStore';

/**
 * Centralized error handler that shows toast notification and logs to console
 *
 * @param error - The error to handle
 * @param context - Optional context string for the error message
 *
 * @example
 * try {
 *   await saveData();
 * } catch (error) {
 *   handleError(error, 'Failed to save data');
 * }
 */
export function handleError(error: unknown, context?: string): void {
  const message = error instanceof Error ? error.message : 'An unexpected error occurred';
  const title = context ?? 'Error';

  // Log to console for debugging
  console.error(`[${title}]`, error);

  // Show user-facing toast
  toast.error(title, message);
}

/**
 * Wrap an async function with error handling
 *
 * @param fn - The async function to wrap
 * @param context - Optional context string for error messages
 * @returns The wrapped function
 *
 * @example
 * const safeSave = withErrorHandling(saveData, 'Failed to save');
 * await safeSave();
 */
export function withErrorHandling<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  context?: string
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      handleError(error, context);
      throw error; // Re-throw so caller can handle if needed
    }
  }) as T;
}

/**
 * Execute an async operation with automatic error handling and success toast
 *
 * @param operation - The async operation to execute
 * @param options - Success/error messages
 * @returns Promise resolving to [data, error]
 *
 * @example
 * const [result, error] = await safeAsync(
 *   () => api.save(data),
 *   { successMessage: 'Saved successfully!', errorContext: 'Failed to save' }
 * );
 */
export async function safeAsync<T>(
  operation: () => Promise<T>,
  options?: {
    successMessage?: string;
    successTitle?: string;
    errorContext?: string;
  }
): Promise<[T | null, Error | null]> {
  try {
    const result = await operation();
    if (options?.successMessage || options?.successTitle) {
      toast.success(options.successTitle ?? 'Success', options.successMessage);
    }
    return [result, null];
  } catch (error) {
    handleError(error, options?.errorContext);
    return [null, error instanceof Error ? error : new Error(String(error))];
  }
}
