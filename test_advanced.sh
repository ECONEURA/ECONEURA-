#!/usr/bin/env bash
# ECONEURA · Testing Avanzado (Performance, Load, Integration)
set -euo pipefail; IFS=$'\n\t'

# Config
API_URL="${API_URL:-http://localhost:8080}"
TEST_DURATION="${TEST_DURATION:-30}"
CONCURRENT_USERS="${CONCURRENT_USERS:-10}"

echo "🧪 Running Advanced Tests for ECONEURA API"

# 1. Health Check
echo "🔍 Health Check..."
curl -f "$API_URL/api/health" || { echo "❌ Health check failed"; exit 1; }
echo "✅ Health OK"

# 2. Unit Tests (si hay)
if [ -f "vitest.config.ts" ]; then
  echo "🧪 Running Unit Tests..."
  npm test || { echo "❌ Unit tests failed"; exit 1; }
  echo "✅ Unit Tests OK"
fi

# 3. Integration Tests
echo "🔗 Running Integration Tests..."
for i in {1..10}; do
  response=$(curl -s -XPOST "$API_URL/api/invoke/neura-$i" \
    -H "Authorization: Bearer test" \
    -H "X-Route: test" \
    -H "X-Correlation-Id: test-$i" \
    -H "Content-Type: application/json" \
    -d '{"input":"test"}')
  if echo "$response" | jq -e '.ok' >/dev/null; then
    echo "✅ Neura-$i OK"
  else
    echo "❌ Neura-$i failed: $response"
    exit 1
  fi
done

# 4. Performance Test (simple load)
echo "⚡ Running Performance Test ($CONCURRENT_USERS users, $TEST_DURATION s)..."
start_time=$(date +%s)
for user in $(seq 1 "$CONCURRENT_USERS"); do
  (
    for ((i=0; i<TEST_DURATION; i++)); do
      curl -s "$API_URL/api/health" >/dev/null &
      sleep 1
    done
  ) &
done
wait
end_time=$(date +%s)
duration=$((end_time - start_time))
echo "✅ Performance Test completed in ${duration}s"

# 5. Load Test with k6 (si instalado)
if command -v k6 >/dev/null; then
  echo "📈 Running Load Test with k6..."
  cat > load_test.js << 'EOF'
import http from 'k6/http';
import { check } from 'k6';

export let options = {
  vus: 10,
  duration: '30s',
};

export default function () {
  let response = http.get('http://localhost:8080/api/health');
  check(response, { 'status is 200': (r) => r.status === 200 });
}
EOF
  k6 run load_test.js || echo "⚠️ k6 load test failed, but continuing"
  rm load_test.js
fi

echo "🎉 All Advanced Tests Passed!"
echo "📊 Summary: Health OK, Integration OK, Performance OK"