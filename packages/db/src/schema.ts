/**
 * Database Schema for ECONEURA
 * PostgreSQL with Drizzle ORM
 * 
 * Tables:
 * - users: User accounts with multi-tenant support
 * - agents: AI agent configurations
 * - executions: Execution history with costs
 * - approvals: HITL (Human-in-the-Loop) approval workflow
 */

import { pgTable, uuid, text, timestamp, jsonb, boolean, integer, numeric } from 'drizzle-orm/pg-core';

/**
 * Users table
 * Multi-tenant user accounts with role-based access
 */
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  tenantId: uuid('tenant_id').notNull(),
  role: text('role').notNull().default('viewer'),
  // Roles: 'admin', 'manager', 'analyst', 'viewer'
  enabled: boolean('enabled').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

/**
 * Agents table
 * AI agent configurations and metadata
 */
export const agents = pgTable('agents', {
  id: text('id').primaryKey(), // neura-1, neura-2, etc.
  title: text('title').notNull(),
  department: text('department').notNull(),
  // Departments: analytics, cdo, cfo, chro, ciso, cmo, cto, legal, reception, research, support
  description: text('description'),
  config: jsonb('config'), // Agent-specific configuration
  webhookUrl: text('webhook_url'), // Make.com webhook URL
  enabled: boolean('enabled').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

/**
 * Executions table
 * History of agent executions with performance and cost tracking
 */
export const executions = pgTable('executions', {
  id: uuid('id').primaryKey().defaultRandom(),
  agentId: text('agent_id').notNull().references(() => agents.id),
  userId: uuid('user_id').notNull().references(() => users.id),
  tenantId: uuid('tenant_id').notNull(),
  correlationId: text('correlation_id'), // X-Correlation-Id from request
  input: jsonb('input').notNull(),
  output: jsonb('output'),
  status: text('status').notNull().default('pending'),
  // Status: pending, running, completed, failed, cancelled
  error: text('error'), // Error message if failed
  startedAt: timestamp('started_at').notNull().defaultNow(),
  completedAt: timestamp('completed_at'),
  durationMs: integer('duration_ms'),
  costEur: numeric('cost_eur', { precision: 10, scale: 4 }), // Cost in EUR with 4 decimal places
  tokensUsed: integer('tokens_used'), // For AI models
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

/**
 * Approvals table
 * HITL (Human-in-the-Loop) approval workflow
 * Used for high-risk operations that require human approval
 */
export const approvals = pgTable('approvals', {
  id: uuid('id').primaryKey().defaultRandom(),
  executionId: uuid('execution_id').notNull().references(() => executions.id),
  approverId: uuid('approver_id').references(() => users.id), // null until approved/rejected
  status: text('status').notNull().default('pending'),
  // Status: pending, approved, rejected
  reason: text('reason'), // Reason for approval/rejection
  riskLevel: text('risk_level').notNull().default('medium'),
  // Risk levels: low, medium, high
  requestedAt: timestamp('requested_at').notNull().defaultNow(),
  decidedAt: timestamp('decided_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

/**
 * Type exports for TypeScript
 */
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Agent = typeof agents.$inferSelect;
export type NewAgent = typeof agents.$inferInsert;

export type Execution = typeof executions.$inferSelect;
export type NewExecution = typeof executions.$inferInsert;

export type Approval = typeof approvals.$inferSelect;
export type NewApproval = typeof approvals.$inferInsert;
