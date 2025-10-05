#!/usr/bin/env bash
set -eo pipefail

ROOT_DIR=$(cd "$(dirname "$0")/.." && pwd)
ART=${ROOT_DIR}/.artifacts
mkdir -p "$ART"

echo "1) Ensuring coverage tmp dirs..."
node "$ROOT_DIR/scripts/ensure-coverage-tmp.js"

echo "2) Running vitest coverage in serial (smoke) to detect races"
# serial run: limit workers to 1 to avoid file-write races; if this fails, parallel will likely fail too
pnpm -w exec vitest run --coverage --maxWorkers 1 2>&1 | tee "$ART/vitest-coverage-serial.log"
SERIAL_EXIT=${PIPESTATUS[0]}
if [ "$SERIAL_EXIT" -ne 0 ]; then
  echo "Serial coverage run failed (exit $SERIAL_EXIT). See $ART/vitest-coverage-serial.log"
  exit $SERIAL_EXIT
fi

echo "Serial run passed — attempting a parallel run to validate stability"
PARALLEL_TRIES=3
for i in $(seq 1 $PARALLEL_TRIES); do
  echo "Parallel try #$i"
  timestamp=$(date +%s)
  pnpm -w exec vitest run --coverage 2>&1 | tee "$ART/vitest-coverage-parallel-${timestamp}.log"
  EXIT=${PIPESTATUS[0]}
  if [ "$EXIT" -eq 0 ]; then
    echo "Parallel run #$i passed"
    exit 0
  else
    echo "Parallel run #$i failed (exit $EXIT). See $ART/vitest-coverage-parallel-${timestamp}.log"
    # ensure tmp dirs again before retry
    node "$ROOT_DIR/scripts/ensure-coverage-tmp.js"
    sleep 0.5
  fi
done

echo "All parallel tries failed. Check logs in $ART"
exit 1
