# 🚀 Express Velocity Mode - Quick Start Guide

## What is Express Velocity Mode?

Express Velocity Mode is a **zero-blocker, maximum-speed workflow** for ECONEURA development. Instead of waiting for manual dev container rebuilds or complex setup procedures, you get **immediate results**.

## Why Use Express Velocity?

❌ **OLD WAY:**
- Wait for dev container rebuilds (10+ minutes)
- Manual GUI steps (Ctrl+Shift+P → "Rebuild Container")
- Blocked on Docker-in-Docker issues
- Excessive preparation without execution

✅ **EXPRESS WAY:**
- Works with current environment immediately
- Automated, scripted workflows
- Docker + Node.js already available
- Action-first, no blockers

## Quick Start (30 seconds)

```bash
# 1. Check current status
./scripts/express-status.sh

# 2. Run full velocity mode
./scripts/express-velocity.sh

# 3. Start coding immediately
```

## What Express Velocity Does

### Phase 0: Express Environment Check
- ✅ Verifies Docker, Node.js, pnpm, Git
- ✅ Shows versions and availability
- ✅ **1 second**

### Phase 1: Express Dependency Installation
- ✅ Installs all workspace dependencies
- ✅ Handles lockfile issues automatically
- ✅ **~2 minutes**

### Phase 2: Express Validation
- ✅ Checks TypeScript configuration
- ✅ Checks ESLint configuration
- ✅ **5 seconds**

### Phase 3: Express Cleanup
- ✅ Analyzes repository size
- ✅ Cleans temporary files
- ✅ Shows before/after metrics
- ✅ **10 seconds**

### Phase 4: Express Docker Services
- ✅ Starts PostgreSQL and Redis
- ✅ Verifies service health
- ✅ **30 seconds**

### Phase 5: Express Metrics Report
- ✅ Counts all project files
- ✅ Shows comprehensive stats
- ✅ **5 seconds**

**Total Time: ~3 minutes**

## Available Commands

### Status Dashboard
```bash
./scripts/express-status.sh
```
Real-time view of:
- System tools (Docker, Node, pnpm)
- Repository status
- Project metrics
- Docker services
- Dependencies

### Full Velocity Run
```bash
./scripts/express-velocity.sh
```
Complete setup and validation in one command.

### Individual Operations
```bash
# Install dependencies
pnpm install

# Start services
docker-compose -f docker-compose.dev.yml up -d

# Check services
docker-compose -f docker-compose.dev.yml ps

# Stop services
docker-compose -f docker-compose.dev.yml down

# Start web app
pnpm -C apps/web dev

# Start API
pnpm -C apps/api_py dev
```

## Current Environment

Based on the status check:

✅ **Available:**
- Docker 28.0.4
- Node.js v20.19.5
- pnpm 8.15.5
- Git 2.51.0

✅ **Project Stats:**
- 121 TypeScript files
- 37 JavaScript files
- 21 Python files
- 57 Test files
- 615MB total size
- 833 npm packages installed

## Common Workflows

### Starting Development
```bash
# 1. Check status
./scripts/express-status.sh

# 2. Start services
docker-compose -f docker-compose.dev.yml up -d postgres redis

# 3. Start web app (in new terminal)
pnpm -C apps/web dev

# 4. Start API (in new terminal)
pnpm -C apps/api_py dev
```

### Quick Health Check
```bash
# Services
docker-compose -f docker-compose.dev.yml ps

# Web app
curl http://localhost:3000

# API
curl http://localhost:3101/health
```

### Cleanup
```bash
# Stop services
docker-compose -f docker-compose.dev.yml down

# Clean node_modules (if needed)
rm -rf node_modules

# Reinstall
pnpm install
```

## Troubleshooting

### "Docker Compose not found"
Use `docker compose` (v2) instead:
```bash
docker compose -f docker-compose.dev.yml up -d
```

### "Permission denied"
Make scripts executable:
```bash
chmod +x scripts/*.sh
```

### "Module not found"
Reinstall dependencies:
```bash
rm -rf node_modules
pnpm install --no-frozen-lockfile
```

### "Port already in use"
Find and kill process:
```bash
lsof -ti:3000 | xargs kill -9
lsof -ti:3101 | xargs kill -9
```

## Success Metrics

After running Express Velocity, you should see:

✅ **100% of critical tools available**
✅ **All dependencies installed**
✅ **PostgreSQL and Redis running**
✅ **Zero blockers to development**
✅ **Complete in <5 minutes**

## Next Steps

Once Express Velocity completes:

1. **Review the summary** - check success rate and speed
2. **Start services** - web app on :3000, API on :3101
3. **Begin development** - all tools ready
4. **Run tests** - `pnpm test`
5. **Deploy** - when ready

## Philosophy

Express Velocity Mode embodies:

1. **Action > Preparation** - Execute first, perfect later
2. **Automation > Manual** - Scripts over GUI clicks
3. **Speed > Completeness** - Fast iterations over perfect setup
4. **Results > Process** - Working code over documentation
5. **Unblock > Wait** - Always find a way forward

## Comparison: Traditional vs Express

| Aspect | Traditional | Express |
|--------|-------------|---------|
| Setup Time | 10-30 min | 3 min |
| Manual Steps | 5-10 | 0 |
| Blockers | Frequent | Zero |
| Feedback | Slow | Immediate |
| Dependencies | Manual | Automatic |
| Validation | Missing | Built-in |
| Metrics | None | Real-time |
| Rollback | Difficult | Easy |

## Support

If Express Velocity fails:

1. **Check status**: `./scripts/express-status.sh`
2. **Review logs**: Last 20 lines show issues
3. **Try manual steps**: Follow error messages
4. **Report issue**: Include full output

## Updates

Check for updates:
```bash
git pull origin main
chmod +x scripts/*.sh
./scripts/express-velocity.sh
```

---

**Remember: Express Velocity is about SPEED and ACTION. Don't get blocked. Don't wait. Just execute.**

🚀 **Ready? Run `./scripts/express-velocity.sh` now!** 🚀
