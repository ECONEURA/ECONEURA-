#!/usr/bin/env tsx
/**
 * Database Migration Runner
 * Applies pending migrations to the database
 */

import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { getDbClient, closeDbClient } from './client';

async function runMigrations() {
  console.log('🔄 Running database migrations...');
  
  try {
    const db = getDbClient();
    
    await migrate(db, { 
      migrationsFolder: './migrations',
    });
    
    console.log('✅ Migrations completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await closeDbClient();
  }
}

runMigrations();
