Coverage aggregator

What it does:

- Runs a quick aggregation over project packages to decide PASS/WARN/NO-METRICS.
- Writes a single CI artifact: `.artifacts/STATUS_COV_DIFF.txt` (human summary).
- Writes diagnostics: `.artifacts/STATUS_COV_DIFF_RAW.txt` (JSON) and
  `.artifacts/STATUS_COV_DIFF_DIAG.txt` (per-file breakdown).

How to run (Windows PowerShell):

powershell -NoProfile -ExecutionPolicy Bypass -File ONE_SHOT_100_v13.ps1

Exit codes:

- 0: PASS (gate satisfied)
- 1: WARN (metrics found but below gate)
- 2: NO-METRICS (no coverage data found)

CI integration:

- Use the artifact `.artifacts/STATUS_COV_DIFF.txt` for human-readable pass/fail
  and the JSON RAW for programmatic checks.

Notes:

- The script checks `coverage/coverage-summary.json`, `coverage/lcov.info`, and
  `coverage/coverage-final.json` (c8/v8) in that order.
- You can set environment variables: `COV_STMTS_MIN`, `COV_FUNCS_MIN`, `TARGETS`
  (comma-separated), `FORCE_GEN=1` to attempt local generation.

Contact:

- If you need a Linux/Bash wrapper or to add more targets, ask and I will create
  it.
