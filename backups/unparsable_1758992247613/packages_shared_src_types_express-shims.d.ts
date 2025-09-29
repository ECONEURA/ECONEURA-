// Augment Express types with application-specific fields used across the API
// This file is a safe shim to reduce 

// Also export NextFunction from the 
// `import { NextFunction } from 
declare module 
  export type NextFunction = (err?: any) => void;
}
