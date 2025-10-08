/**
 * Main entry point for @econeura/db package
 */

export { getDbClient, closeDbClient, checkDbHealth } from './client';
export * from './schema';
export type { User, NewUser, Agent, NewAgent, Execution, NewExecution, Approval, NewApproval } from './schema';
