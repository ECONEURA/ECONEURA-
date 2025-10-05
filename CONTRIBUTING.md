Contributing
============

Quick guide to get your environment ready and validate PRs locally.

1) Install Node 20 and pnpm 8.15.5
   - See `./scripts/setup_dev_env.sh` for convenience commands per OS.

2) Verify your environment
   ```bash
   ./scripts/check_env.sh
   ```

3) Install deps and bootstrap
   ```bash
   pnpm install --frozen-lockfile
   pnpm run bootstrap
   ```

4) Validate changes before opening PR
   ```bash
   pnpm -w run lint
   pnpm -w run typecheck
   pnpm -w run test:fast
   ```

5) If you want coverage feedback, open a PR and the `Coverage Gate (staging)` workflow will annotate the PR with a coverage summary (non-blocking).

6) Use the PR template `.github/PULL_REQUEST_TEMPLATE.md` to help reviewers.

If anything fails, paste the terminal output in the PR and tag the maintainers listed in CODEOWNERS.
