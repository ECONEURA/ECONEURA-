# Branches inventory (local + remote tracked)

Generated list of local branches with last commit:

- backup/pre-cleanup-20251001-223705 (commit: ccf91e94bb8461ce74c458a7027ff68caf41dc8b, date: 2025-09-30)
- backup/pre-cleanup-20251001-223728 (commit: ccf91e94bb8461ce74c458a7027ff68caf41dc8b, date: 2025-09-30)
- chore/coverage-gate-95 (commit: 4b71b915e6d4e3c47644684a8269a28ddf9f09ee, date: 2025-10-04)
- chore/enforce-coverage-cleanup (commit: f744d90b8ffe86b2dcd6929bde22c41dec2b42fd, date: 2025-10-03)
- chore/remove-dead-workflows-2 (commit: e0e76cc5ce493d6c2be79a993da419f6cb48c163, date: 2025-10-04)
- copilot/fix-657799ca-2680-455b-a2f1-7d3a394cb2fb (commit: 45ec47e19581155c8ba94efb97baa9c56e89e576, date: 2025-09-29)
- copilot/fix-ddcf7cbb-496c-46f8-9393-e85c2615fa63 (commit: 261168fee30ba76cde602ac315229d88383f453b, date: 2025-09-29)
- local-wip-autosave (commit: 95c84792c7b9bd06928dd723350d6c063362797f, date: 2025-10-04)
- main (commit: 322e6d997c5d3de08a6436b6a1e0fd7e0989dfbd, date: 2025-10-04)

## Cleanup actions

- Removed complex and flaky workflows and consolidated to a single minimal `.github/workflows/ci.yml` that runs lint, typecheck and fast smoke tests. This simplifies CI and reduces false negatives for contributors.

- Added `coverage-gate-staging` workflow that annotates PRs with coverage (non-blocking) so the team can iterate the gate without blocking merges.
- Added `CONTRIBUTING.md` and a PR template to standardize checks before opening PRs.

## Quick test change for PR creation

This small entry is intentionally added to allow creating a test PR from `work/ci-fixes-2` so CI can be triggered and validated in a clean run. Remove after verification.
