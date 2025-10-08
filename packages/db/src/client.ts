/**
 * Database Client for ECONEURA
 * Singleton connection pool to PostgreSQL
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

let client: ReturnType<typeof drizzle> | null = null;
let queryClient: ReturnType<typeof postgres> | null = null;

/**
 * Get database client (singleton pattern)
 * Automatically creates connection pool on first call
 * 
 * @returns Drizzle ORM client
 * @throws Error if DATABASE_URL is not set
 */
export function getDbClient() {
  if (!client) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    
    queryClient = postgres(connectionString, {
      max: 10, // Maximum pool size
      idle_timeout: 20, // Idle connection timeout (seconds)
      connect_timeout: 10, // Connection timeout (seconds)
    });
    
    client = drizzle(queryClient, { schema });
  }
  return client;
}

/**
 * Close database connection pool
 * Should be called on application shutdown
 */
export async function closeDbClient() {
  if (queryClient) {
    await queryClient.end();
    queryClient = null;
    client = null;
  }
}

/**
 * Check database connection health
 * 
 * @returns true if connection is healthy, false otherwise
 */
export async function checkDbHealth(): Promise<boolean> {
  try {
    const db = getDbClient();
    // Simple query to check connection
    await db.execute(postgres.unsafe('SELECT 1'));
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

/**
 * Export schema for direct use
 */
export * from './schema';
