# @econeura/db

Database package for ECONEURA monorepo. Provides PostgreSQL schema, client, and migrations using Drizzle ORM.

## 📦 Features

- **PostgreSQL 16** with Drizzle ORM
- **4 core tables**: users, agents, executions, approvals
- **Multi-tenant** support with Row Level Security (RLS) ready
- **Type-safe** queries with TypeScript
- **Migrations** with Drizzle Kit
- **Seed data** for development

## 🗄️ Schema

### Tables

1. **users** - User accounts with roles (admin, manager, analyst, viewer)
2. **agents** - AI agent configurations (neura-1 through neura-11)
3. **executions** - Execution history with performance metrics and costs
4. **approvals** - HITL (Human-in-the-Loop) approval workflow

### Entity Relationships

```
users (1) ──< (N) executions
agents (1) ──< (N) executions
executions (1) ──< (1) approvals
users (1) ──< (N) approvals (as approver)
```

## 🚀 Quick Start

### 1. Start PostgreSQL

```bash
# From repo root
docker-compose -f docker-compose.dev.yml up -d postgres
```

### 2. Set Environment Variable

```bash
export DATABASE_URL="postgresql://econeura:econeura123@localhost:5432/econeura_dev"
```

### 3. Generate Migration

```bash
cd packages/db
pnpm db:generate
```

### 4. Run Migrations

```bash
pnpm db:migrate
```

### 5. Seed Data (optional)

```bash
pnpm db:seed
```

## 📝 Usage

### Import the Client

```typescript
import { getDbClient, users, agents } from '@econeura/db';

const db = getDbClient();

// Query users
const allUsers = await db.select().from(users);

// Insert agent
await db.insert(agents).values({
  id: 'neura-12',
  title: 'Custom Agent',
  department: 'custom',
  enabled: true,
});
```

### Type-Safe Queries

```typescript
import type { User, NewUser, Execution } from '@econeura/db';

// Type for SELECT query result
const user: User = await db.query.users.findFirst();

// Type for INSERT payload
const newUser: NewUser = {
  email: 'test@example.com',
  name: 'Test User',
  tenantId: crypto.randomUUID(),
  role: 'viewer',
};
```

### Health Check

```typescript
import { checkDbHealth } from '@econeura/db';

const isHealthy = await checkDbHealth();
if (!isHealthy) {
  console.error('Database is not available');
}
```

## 🔧 Scripts

| Script | Description |
|--------|-------------|
| `pnpm db:generate` | Generate migration files from schema |
| `pnpm db:migrate` | Apply pending migrations |
| `pnpm db:seed` | Populate database with test data |
| `pnpm db:studio` | Launch Drizzle Studio (web UI) |

## 🧪 Development

### Generate New Migration

After modifying `src/schema.ts`:

```bash
pnpm db:generate
```

This creates a new migration file in `migrations/` directory.

### Reset Database

```bash
# Drop and recreate database
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up -d postgres
sleep 5
pnpm db:migrate
pnpm db:seed
```

## 🔒 Security

### Multi-Tenancy

All queries should filter by `tenantId` to ensure data isolation:

```typescript
const userExecutions = await db
  .select()
  .from(executions)
  .where(eq(executions.tenantId, currentTenantId));
```

### Row Level Security (Phase 7)

RLS policies will be added in Phase 7 to enforce tenant isolation at the database level.

## 📊 Example Queries

### Get User's Execution History

```typescript
import { eq, desc } from 'drizzle-orm';

const history = await db
  .select()
  .from(executions)
  .where(eq(executions.userId, userId))
  .orderBy(desc(executions.createdAt))
  .limit(10);
```

### Calculate Total Cost by Tenant

```typescript
import { sum, eq } from 'drizzle-orm';

const totalCost = await db
  .select({ total: sum(executions.costEur) })
  .from(executions)
  .where(eq(executions.tenantId, tenantId));
```

### Get Pending Approvals

```typescript
const pending = await db
  .select()
  .from(approvals)
  .where(eq(approvals.status, 'pending'))
  .innerJoin(executions, eq(approvals.executionId, executions.id));
```

## 🐛 Troubleshooting

### Connection Error

```
Error: DATABASE_URL environment variable is not set
```

**Solution:** Set `DATABASE_URL` in `.env` or export it:

```bash
export DATABASE_URL="postgresql://econeura:econeura123@localhost:5432/econeura_dev"
```

### Migration Failed

```
❌ Migration failed: relation "users" already exists
```

**Solution:** Database already migrated. If you want to reset:

```bash
pnpm db:reset  # Will be added in Phase 7
```

### Port 5432 Already in Use

```
Error: bind: address already in use
```

**Solution:** Stop existing PostgreSQL:

```bash
sudo systemctl stop postgresql  # Linux
brew services stop postgresql   # macOS
```

## 🔗 Related

- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- Phase 6: Database Foundation (docs/ACTION_PLAN_PHASE5_TO_100.md)

## 📄 License

MIT
