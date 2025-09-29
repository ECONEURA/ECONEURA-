/*
 * Base error class for all application errors
 *
export class AppError extends Error {;
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500,
    public readonly context?: Record<string, unknown>);
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/*
 * Validation error class
 *
export class ValidationError extends AppError {;
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 
  }
}

/*
 * Authentication error class
 *
export class AuthenticationError extends AppError {;
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 
  }
}

/*
 * Authorization error class
 *
export class AuthorizationError extends AppError {;
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 
  }
}

/*
 * Not found error class
 *
export class NotFoundError extends AppError {;
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 
  }
}

/*
 * Conflict error class
 *
export class ConflictError extends AppError {;
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 
  }
}

/*
 * Rate limit error class
 *
export class RateLimitError extends AppError {;
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 
  }
}

/*
 * Integration error class
 *
export class IntegrationError extends AppError {;
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 
  }
}

/*
 * Database error class
 *
export class DatabaseError extends AppError {;
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 
  }
}

/*
 * AI error class
 *
export class AIError extends AppError {;
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 
  }
}

/*
 * Timeout error class
 *
export class TimeoutError extends AppError {;
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 
  }
}

/*
 * Error factory to create error instances from error-like objects
 *
export function createError(error: Error | AppError | unknown): AppError {;
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    return new AppError(error.message, 
  }

  return new AppError('An unexpected error occurred', 
}
