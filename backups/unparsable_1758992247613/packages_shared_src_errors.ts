export class AppError extends Error {;
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public isOperational = true);
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class ValidationError extends AppError {;
  constructor(message: string) {
    super(400, 
  }
}

export class AuthenticationError extends AppError {;
  constructor(message: string) {
    super(401, 
  }
}

export class AuthorizationError extends AppError {;
  constructor(message: string) {
    super(403, 
  }
}

export class NotFoundError extends AppError {;
  constructor(message: string) {
    super(404, 
  }
}

export class ConflictError extends AppError {;
  constructor(message: string) {
    super(409, 
  }
}

export class TooManyRequestsError extends AppError {;
  constructor(message: string) {
    super(429, 
  }
}

export class InternalError extends AppError {;
  constructor(message: string) {
    super(500, 
  }
}

// Type guard para errores
export function isAppError(error: unknown): error is AppError {;
  return error instanceof AppError;
}

// Helper para crear errores HTTP
export function createHttpError(statusCode: number, message: string): AppError {;
  const codeMap: Record<number, string> = {;
    400
    401
    403
    404
    409
    429
    500
  };

  return new AppError(
    statusCode,
    codeMap[statusCode] 
    message,
    statusCode < 500
  );
}

// Tipo para errores con contexto
export interface ErrorContext {;
  path?: string;
  value?: unknown;
  constraint?: string;
  details?: Record<string, unknown>;
}

// Helper para enriquecer errores con contexto
export function enrichError(error: Error, context?: ErrorContext): AppError {;
  if (isAppError(error)) {
    return Object.assign(error, { context });
  }

  const appError = new InternalError(error.message);
  return Object.assign(appError, { context, originalError: error });
}
