#!/bin/bash

# 🚀 Complete STEP 6 Testing Pipeline
# AI Agent Platform - A/B Testing & Baseline Regression Protection

set -e  # Exit on any error

echo "🧪 Starting Complete STEP 6 Testing Pipeline..."
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results tracking
TESTS_PASSED=0
TESTS_FAILED=0

run_test() {
    local test_name="$1"
    local test_command="$2"
    
    echo ""
    echo -e "${BLUE}🔍 Running: $test_name${NC}"
    echo "----------------------------------------"
    
    if eval "$test_command"; then
        echo -e "${GREEN}✅ PASSED: $test_name${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}❌ FAILED: $test_name${NC}"
        ((TESTS_FAILED++))
    fi
}

# Ensure we're in the right directory
cd "$(dirname "$0")"

echo "📍 Current directory: $(pwd)"
echo "🔧 Node version: $(node --version)"

# Step 1: Environment Check
run_test "Environment Setup Check" "node -e 'console.log(\"Node.js environment OK\")'"

# Step 2: Dependencies Check  
run_test "Dependencies Verification" "npm list --depth=0 > /dev/null || npm install"

# Step 3: Basic Lab Functions Test
run_test "Lab Directory Structure" "ls -la lab/ > /dev/null"

# Step 4: Coverage Acceptance Test (20项验收)
run_test "20-Item Coverage Acceptance Test" "node lab/coverage_acceptance_test.js"

# Step 5: Go-Live Checklist (8门全绿)
run_test "Final Go-Live Checklist (8 Gates)" "node lab/final_go_live_checklist.js"

# Step 6: A/B Experiment Pipeline Test
run_test "A/B Experiment Framework Test" "node lab/test_ab_pipeline.js"

# Step 7: Decision Engine Test
run_test "Statistical Decision Engine Test" "node lab/decision_engine.js --test_mode=true"

# Step 8: Post-Launch Operations Test
run_test "Post-Launch Operations Test" "node lab/post_launch_operations.js --day=0 --test_mode=true"

# Step 9: Data Quality & Templates
run_test "Template Files Validation" "ls lab/templates/*.json lab/templates/*.csv lab/templates/*.md > /dev/null"

# Step 10: Documentation Completeness
run_test "Documentation Check" "ls lab/runbook_*.md lab/optimization_playbook.md lab/README_LAB.md > /dev/null"

echo ""
echo "=================================================="
echo "🏁 Test Pipeline Complete!"
echo "=================================================="
echo -e "✅ Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "❌ Tests Failed: ${RED}$TESTS_FAILED${NC}"
echo -e "📊 Success Rate: $(( TESTS_PASSED * 100 / (TESTS_PASSED + TESTS_FAILED) ))%"

if [ $TESTS_FAILED -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 ALL TESTS PASSED! Ready for Production!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Run live A/B experiment: node lab/run_ab_experiment.js"
    echo "2. Monitor with: node lab/post_launch_operations.js --day=0"
    echo "3. Check results: node lab/decision_engine.js --experiment_id=ab001"
    exit 0
else
    echo ""
    echo -e "${RED}🚨 Some tests failed. Please fix before production deployment.${NC}"
    exit 1
fi