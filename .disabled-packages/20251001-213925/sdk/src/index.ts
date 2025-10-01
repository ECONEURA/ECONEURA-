// Main exports
export {
  ECONEURAClient,
  createECONEURAClient,
  econeuraClient,
  defaultConfig,
  ECONEURAError,
} from './client';

// Type exports
export type {
  ECONEURAClientConfig,
  MemoryPutRequest,
  MemoryPutResponse,
  MemoryQueryRequest,
  MemoryQueryResponse,
  MemoryStatsResponse,
  MemoryCleanupResponse,
  ProblemDetails,
} from './client';

// Schema exports
export {
  MemoryPutRequestSchema,
  MemoryPutResponseSchema,
  MemoryQueryRequestSchema,
  MemoryQueryResponseSchema,
  MemoryStatsResponseSchema,
  MemoryCleanupResponseSchema,
  ProblemDetailsSchema,
} from './client.js';
