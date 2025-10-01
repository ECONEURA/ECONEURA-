
// Re-export commonly used modules from the shared package to provide a stable
// surface for other workspace packages that import '@econeura/shared'.
export { loadConfig, config as serverConfig, getRequiredConfig, getOptionalConfig } from '../config.js';
export type { Config as ConfigType } from '../config.js';
export * from '../logging/index.js';

// Minimal re-exports that are safe for isolatedModules
export type { Placeholder as TypesPlaceholder } from '../types/index.js';
export { metricsAvailable } from '../metrics/index.js';
export { schemasAvailable } from '../schemas/index.js';





