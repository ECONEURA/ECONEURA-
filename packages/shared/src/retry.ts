// Retry configuration
export interface RetryOptions {
  maxAttempts: number;
  delayMs: number;
  backoffMultiplier: number;
  maxDelayMs: number;
  retryCondition?: (_error: Error) => boolean;
}

// Default retry options
export const defaultRetryOptions: RetryOptions = {
  maxAttempts: 3,
  delayMs: 1000,
  backoffMultiplier: 2,
  maxDelayMs: 30000,
  retryCondition: (error: Error) => {
    // Retry on network errors, timeouts, and 5xx status codes
    return error.message.includes('network') ||
           error.message.includes('timeout') ||
           error.message.includes('ECONNRESET') ||
           error.message.includes('ENOTFOUND');
  }
};

// Sleep utility
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Retry wrapper function
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const opts = { ...defaultRetryOptions, ...options };
  let lastError: Error;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Don't retry if this is the last attempt
      if (attempt === opts.maxAttempts) {
        break;
      }

      // Check if we should retry this error
      if (opts.retryCondition && !opts.retryCondition(lastError)) {
        break;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(opts.delayMs * Math.pow(opts.backoffMultiplier, attempt - 1), opts.maxDelayMs);

      console.log(`Attempt ${attempt} failed, retrying in ${delay}ms:`, lastError.message);
      await sleep(delay);
    }
  }

  throw lastError!;
}

// Retry decorator for methods
export function retryable(options: Partial<RetryOptions> = {}) {
  return function (
    _target: unknown,
    _propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value!;

    descriptor.value = async function (...args: unknown[]) {
      return withRetry(() => originalMethod.apply(this, args), options);
    };

    return descriptor;
  };
}