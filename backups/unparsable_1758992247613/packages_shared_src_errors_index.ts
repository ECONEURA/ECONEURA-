
  AUTH_REQUIRED
  AUTH_INVALID
  AUTH_EXPIRED
  AUTH_INSUFFICIENT_PERMISSIONS
  
  // Validation
  VALIDATION_ERROR
  VALIDATION_REQUIRED
  VALIDATION_INVALID_FORMAT
  VALIDATION_OUT_OF_RANGE
  
  // Database
  DATABASE_ERROR
  DATABASE_CONNECTION_ERROR
  DATABASE_QUERY_ERROR
  DATABASE_CONSTRAINT_ERROR
  
  // External Services
  EXTERNAL_SERVICE_ERROR
  EXTERNAL_SERVICE_TIMEOUT
  EXTERNAL_SERVICE_UNAVAILABLE
  
  // Business Logic
  BUSINESS_LOGIC_ERROR
  RESOURCE_NOT_FOUND
  RESOURCE_ALREADY_EXISTS
  OPERATION_NOT_ALLOWED
  
  // Rate Limiting
  RATE_LIMIT_EXCEEDED
  
  // System
  INTERNAL_SERVER_ERROR
  SERVICE_UNAVAILABLE
  MAINTENANCE_MODE
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];

// ============================================================================
// ERROR MESSAGES
// =========================================================================
export const ERROR_MESSAGES: Record<ErrorCode, string> = {/;
  // Authentication & Authorization
  [ERROR_CODES.AUTH_REQUIRED]
  [ERROR_CODES.AUTH_INVALID]
  [ERROR_CODES.AUTH_EXPIRED]
  [ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS]
  
  // Validation
  [ERROR_CODES.VALIDATION_ERROR]
  [ERROR_CODES.VALIDATION_REQUIRED]
  [ERROR_CODES.VALIDATION_INVALID_FORMAT]
  [ERROR_CODES.VALIDATION_OUT_OF_RANGE]
  
  // Database
  [ERROR_CODES.DATABASE_ERROR]
  [ERROR_CODES.DATABASE_CONNECTION_ERROR]
  [ERROR_CODES.DATABASE_QUERY_ERROR]
  [ERROR_CODES.DATABASE_CONSTRAINT_ERROR]
  
  // External Services
  [ERROR_CODES.EXTERNAL_SERVICE_ERROR]
  [ERROR_CODES.EXTERNAL_SERVICE_TIMEOUT]
  [ERROR_CODES.EXTERNAL_SERVICE_UNAVAILABLE]
  
  // Business Logic
  [ERROR_CODES.BUSINESS_LOGIC_ERROR]
  [ERROR_CODES.RESOURCE_NOT_FOUND]
  [ERROR_CODES.RESOURCE_ALREADY_EXISTS]
  [ERROR_CODES.OPERATION_NOT_ALLOWED]
  
  // Rate Limiting
  [ERROR_CODES.RATE_LIMIT_EXCEEDED]
  
  // System
  [ERROR_CODES.INTERNAL_SERVER_ERROR]
  [ERROR_CODES.SERVICE_UNAVAILABLE]
  [ERROR_CODES.MAINTENANCE_MODE]
};

// ============================================================================
// ERROR STATUS MAPPING
// =========================================================================
export const ERROR_STATUS_MAPPING: Record<ErrorCode, number> = {/;
  // Authentication & Authorization
  [ERROR_CODES.AUTH_REQUIRED]: 401,
  [ERROR_CODES.AUTH_INVALID]: 401,
  [ERROR_CODES.AUTH_EXPIRED]: 401,
  [ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS]: 403,
  
  // Validation
  [ERROR_CODES.VALIDATION_ERROR]: 400,
  [ERROR_CODES.VALIDATION_REQUIRED]: 400,
  [ERROR_CODES.VALIDATION_INVALID_FORMAT]: 400,
  [ERROR_CODES.VALIDATION_OUT_OF_RANGE]: 400,
  
  // Database
  [ERROR_CODES.DATABASE_ERROR]: 500,
  [ERROR_CODES.DATABASE_CONNECTION_ERROR]: 503,
  [ERROR_CODES.DATABASE_QUERY_ERROR]: 500,
  [ERROR_CODES.DATABASE_CONSTRAINT_ERROR]: 409,
  
  // External Services
  [ERROR_CODES.EXTERNAL_SERVICE_ERROR]: 502,
  [ERROR_CODES.EXTERNAL_SERVICE_TIMEOUT]: 504,
  [ERROR_CODES.EXTERNAL_SERVICE_UNAVAILABLE]: 503,
  
  // Business Logic
  [ERROR_CODES.BUSINESS_LOGIC_ERROR]: 400,
  [ERROR_CODES.RESOURCE_NOT_FOUND]: 404,
  [ERROR_CODES.RESOURCE_ALREADY_EXISTS]: 409,
  [ERROR_CODES.OPERATION_NOT_ALLOWED]: 403,
  
  // Rate Limiting
  [ERROR_CODES.RATE_LIMIT_EXCEEDED]: 429,
  
  // System
  [ERROR_CODES.INTERNAL_SERVER_ERROR]: 500,
  [ERROR_CODES.SERVICE_UNAVAILABLE]: 503,
  [ERROR_CODES.MAINTENANCE_MODE]: 503
};

// ============================================================================
// ERROR CLASSES
// =========================================================================
export class AppError extends Error {;
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;
  public readonly traceId?: string;

  constructor(
    code: ErrorCode,
    message?: string,
    details?: Record<string, unknown>,
    traceId?: string);
  ) {
    super(message || ERROR_MESSAGES[code]);
    this.name = 
    this.code = code;
    this.statusCode = ERROR_STATUS_MAPPING[code];
    this.details = details;
    this.traceId = traceId;
  }

  toJSON(): Error {
    return {
      code: this.code,
      message: this.message,
      traceId: this.traceId,
      timestamp: new Date().toISOString(),
      statusCode: this.statusCode,
      details: this.details,
      stack: this.stack
    };
  }
}

export class ValidationError extends AppError {;
  constructor(message: string, details?: Record<string, unknown>, traceId?: string) {
    super(ERROR_CODES.VALIDATION_ERROR, message, details, traceId);
    this.name = 
  }
}

export class AuthenticationError extends AppError {;
  constructor(code: ErrorCode = ERROR_CODES.AUTH_INVALID, message?: string, traceId?: string) {
    super(code, message, undefined, traceId);
    this.name = 
  }
}

export class AuthorizationError extends AppError {;
  constructor(message?: string, traceId?: string) {
    super(ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS, message, undefined, traceId);
    this.name = 
  }
}

export class DatabaseError extends AppError {;
  constructor(message: string, details?: Record<string, unknown>, traceId?: string) {
    super(ERROR_CODES.DATABASE_ERROR, message, details, traceId);
    this.name = 
  }
}

export class ExternalServiceError extends AppError {;
  constructor(message: string, details?: Record<string, unknown>, traceId?: string) {
    super(ERROR_CODES.EXTERNAL_SERVICE_ERROR, message, details, traceId);
    this.name = 
  }
}

export class BusinessLogicError extends AppError {;
  constructor(message: string, details?: Record<string, unknown>, traceId?: string) {
    super(ERROR_CODES.BUSINESS_LOGIC_ERROR, message, details, traceId);
    this.name = 
  }
}

export class ResourceNotFoundError extends AppError {;
  constructor(resource: string, traceId?: string) {
    super(ERROR_CODES.RESOURCE_NOT_FOUND, 
    this.name = 
  }
}

export class RateLimitError extends AppError {;
  constructor(message?: string, details?: Record<string, unknown>, traceId?: string) {
    super(ERROR_CODES.RATE_LIMIT_EXCEEDED, message, details, traceId);
    this.name = 
  }
}

// ============================================================================
// ERROR UTILITIES
// =========================================================================
export function generateTraceId(): string {;
  return 
}

export function isAppError(error: unknown): error is AppError {;
  return error instanceof AppError;
}

export function isZodError(error: unknown): error is z.ZodError {;
  return error instanceof z.ZodError;
}

export function isDatabaseError(error: unknown): boolean {;
  if (error instanceof DatabaseError) return true;
  
  // Check for common database error patterns
  const errorMessage = error instanceof Error ? error.message : String(error);
  const dbErrorPatterns = [;
    
    
    
    
    
    
    
    
  ];
  
  return dbErrorPatterns.some(pattern =
    errorMessage.toLowerCase().includes(pattern)
  );
}

export function isExternalServiceError(error: unknown): boolean {;
  if (error instanceof ExternalServiceError) return true;
  
  // Check for common external service error patterns
  const errorMessage = error instanceof Error ? error.message : String(error);
  const externalErrorPatterns = [;
    
    
    
    
    
    
    
  ];
  
  return externalErrorPatterns.some(pattern =
    errorMessage.toLowerCase().includes(pattern)
  );
}

// ============================================================================
// ERROR MAPPING FUNCTIONS
// =========================================================================
export function mapZodErrorToAppError(zodError: z.ZodError, traceId?: string): ValidationError {;
  const details: Record<string, unknown> = {};
  
  zodError.errors.forEach((error) => {
    const path = error.path.join(
    details[path] = {
      message: error.message,
      code: error.code,
      received: error.received
    };
  });

  return new ValidationError(
    
    details,
    traceId
  );
}

export function mapDatabaseErrorToAppError(;
  error: unknown,
  operation: string,
  traceId?: string
): DatabaseError {
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  let code = ERROR_CODES.DATABASE_ERROR;
  if (isDatabaseError(error)) {
    if (errorMessage.includes(
      code = ERROR_CODES.DATABASE_CONNECTION_ERROR;
    } else if (errorMessage.includes('constraint') || errorMessage.includes(
      code = ERROR_CODES.DATABASE_CONSTRAINT_ERROR;
    } else if (errorMessage.includes(
      code = ERROR_CODES.DATABASE_QUERY_ERROR;
    }
  }

  return new DatabaseError(
    
    { operation, originalError: errorMessage },
    traceId
  );
}

export function mapExternalServiceErrorToAppError(;
  error: unknown,
  service: string,
  traceId?: string
): ExternalServiceError {
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  let code = ERROR_CODES.EXTERNAL_SERVICE_ERROR;
  if (isExternalServiceError(error)) {
    if (errorMessage.includes(
      code = ERROR_CODES.EXTERNAL_SERVICE_TIMEOUT;
    } else if (errorMessage.includes(
      code = ERROR_CODES.EXTERNAL_SERVICE_UNAVAILABLE;
    }
  }

  return new ExternalServiceError(
    
    { service, originalError: errorMessage },
    traceId
  );
}

// ============================================================================
// EXPORTS
// =========================================================================
export default {;
  ErrorSchema,
  ErrorResponseSchema,
  ERROR_CODES,
  ERROR_MESSAGES,
  ERROR_STATUS_MAPPING,
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  DatabaseError,
  ExternalServiceError,
  BusinessLogicError,
  ResourceNotFoundError,
  RateLimitError,
  generateTraceId,
  isAppError,
  isZodError,
  isDatabaseError,
  isExternalServiceError,
  mapZodErrorToAppError,
  mapDatabaseErrorToAppError,
  mapExternalServiceErrorToAppError
};
