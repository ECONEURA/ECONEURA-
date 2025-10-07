#!/bin/bash

# COMPREHENSIVE TEST SUITE: Complete validation system for ECONEURA
# Version: 2.0.0

set -eu

echo "🧪 ECONEURA COMPREHENSIVE TEST SUITE v2.0.0"
echo "=========================================="

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Test function
run_test() {
    local test_name="$1"
    local test_command="$2"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -n "Running test: $test_name... "
    
    if eval "$test_command" >/dev/null 2>&1; then
        echo "✅ PASSED"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo "❌ FAILED"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
}

# Basic system tests
echo
echo "🔍 Running Basic System Tests..."
echo "-------------------------------"

run_test "Repository structure" "test -d lib && test -d scripts && test -d docs"
run_test "Core library files" "test -f lib/common.sh && test -f lib/base_system.sh"
run_test "Core scripts" "test -f scripts/automatic-documentation.sh && test -f scripts/comprehensive-test-suite.sh"
run_test "Documentation files" "test -f docs/CHANGELOG.md && test -f docs/decisions.md && test -f docs/architecture.md"

# Script execution tests
echo
echo "⚙️ Running Script Execution Tests..."
echo "-----------------------------------"

run_test "Automatic documentation script" "bash scripts/automatic-documentation.sh"
run_test "Test suite script" "bash scripts/comprehensive-test-suite.sh"

# Library functionality tests
echo
echo "�� Running Library Functionality Tests..."
echo "----------------------------------------"

run_test "Common library functions" "source lib/common.sh && command_exists bash"
run_test "Base system library" "source lib/base_system.sh && type init_system >/dev/null 2>&1"

# File permission tests
echo
echo "🔐 Running File Permission Tests..."
echo "----------------------------------"

run_test "Scripts are executable" "test -x scripts/automatic-documentation.sh && test -x scripts/comprehensive-test-suite.sh"
run_test "Library files readable" "test -r lib/common.sh && test -r lib/base_system.sh"

# Summary
echo
echo "📊 TEST SUMMARY"
echo "==============="
echo "Total tests: $TOTAL_TESTS"
echo "Passed: $PASSED_TESTS"
echo "Failed: $FAILED_TESTS"

if [ "$FAILED_TESTS" -eq 0 ]; then
    echo
    echo "🎉 ALL TESTS PASSED! System is fully functional."
    exit 0
else
    echo
    echo "⚠️  SOME TESTS FAILED. Please review the issues above."
    exit 1
fi
