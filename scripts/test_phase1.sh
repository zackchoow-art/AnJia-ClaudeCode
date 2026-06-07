#!/bin/bash
# ============================================================================
# REDP Phase 1 Integration Tests
# Test all T01-T04 functions with mock fallback mode
# ============================================================================

set -e

echo "=========================================="
echo "REDP Phase 1 Integration Tests"
echo "=========================================="

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Load environment variables
ENV_FILE="$PROJECT_DIR/.env"
if [ -f "$ENV_FILE" ]; then
  export $(grep -v '^#' "$ENV_FILE" | grep -v '^$' | xargs)
else
  echo "Error: .env file not found"
  exit 1
fi

SUPABASE_URL="${SUPABASE_URL:-https://bdonljxgltkhbiheljdi.supabase.co}"
SERVICE_KEY="$SUPABASE_SERVICE_ROLE_KEY"
BASE_URL="$SUPABASE_URL/functions/v1"

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

pass() {
  echo -e "${GREEN}✓ PASS${NC}: $1"
  ((TESTS_PASSED++))
}

fail() {
  echo -e "${RED}✗ FAIL${NC}: $1"
  ((TESTS_FAILED++))
}

info() {
  echo -e "${YELLOW}→ INFO${NC}: $1"
}

# ============================================================================
# Test T01: AI Contract Review
# ============================================================================
echo ""
echo "Testing T01: AI Contract Review"
echo "-------------------------------------------"

CONTRACT_ID="c1111111-1111-1111-1111-111111111111"

info "Test 1.1: Review existing contract"
RESPONSE=$(curl -s -X POST "$BASE_URL/ai_contract_review" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"contract_id\": \"$CONTRACT_ID\"}")

if echo "$RESPONSE" | grep -q '"success":true'; then
  pass "T01.1: Contract review returned success"

  REVIEW_ID=$(echo "$RESPONSE" | grep -o '"review_id":"[^"]*"' | cut -d'"' -f4)
  if [ -n "$REVIEW_ID" ]; then
    pass "T01.2: Review ID returned"
  else
    fail "T01.2: No review_id in response"
  fi

  RISK_LEVEL=$(echo "$RESPONSE" | grep -o '"risk_level":"[^"]*"' | head -1)
  if [ -n "$RISK_LEVEL" ]; then
    pass "T01.3: Risk level returned: $RISK_LEVEL"
  else
    fail "T01.3: No risk_level in response"
  fi

  if echo "$RESPONSE" | grep -q '"key_findings":\['; then
    pass "T01.4: Key findings array returned"
  else
    info "T01.4: No key_findings (may use mock data)"
  fi

  if echo "$RESPONSE" | grep -q '"used_mock_data":true'; then
    pass "T01.5: Mock data mode confirmed"
  else
    info "T01.5: Not using mock data (AI may be configured)"
  fi

else
  fail "T01.1: Contract review failed"
  echo "$RESPONSE" | head -200
fi

# ============================================================================
# Test T02: Tax Risk Detection
# ============================================================================
echo ""
echo "Testing T02: Tax Risk Detection"
echo "-------------------------------------------"

PROJECT_ID="11111111-1111-1111-1111-111111111111"

info "Test 2.1: Calculate tax for project"
RESPONSE=$(curl -s -X POST "$BASE_URL/tax_risk_detection" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"project_id\": \"$PROJECT_ID\"}")

if echo "$RESPONSE" | grep -q '"success":true'; then
  pass "T02.1: Tax calculation returned success"

  if echo "$RESPONSE" | grep -q '"calculated_tax"'; then
    CALCULATED=$(echo "$RESPONSE" | grep -o '"calculated_tax":[0-9.]*' | head -1)
    pass "T02.2: Calculated tax found: $CALCULATED"
  else
    fail "T02.2: No calculated_tax in response"
  fi

  if echo "$RESPONSE" | grep -q '"risk_level"'; then
    RISK=$(echo "$RESPONSE" | grep -o '"risk_level":"[^"]*"' | head -1)
    pass "T02.3: Risk level found: $RISK"
  else
    fail "T02.3: No risk_level in response"
  fi

else
  fail "T02.1: Tax calculation failed"
  echo "$RESPONSE" | head -200
fi

# ============================================================================
# Test T03: Financial Planning
# ============================================================================
echo ""
echo "Testing T03: Financial Planning"
echo "-------------------------------------------"

info "Test 3.1: Generate financial plan"
RESPONSE=$(curl -s -X POST "$BASE_URL/financial_planning" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"project_id\": \"$PROJECT_ID\", \"plan_type\": \"MONTHLY\"}")

if echo "$RESPONSE" | grep -q '"success":true'; then
  pass "T03.1: Financial plan returned success"

  if echo "$RESPONSE" | grep -q '"payment_recommendations":\['; then
    pass "T03.2: Payment recommendations array returned"
  else
    info "T03.2: No payment_recommendations in response"
  fi

  if echo "$RESPONSE" | grep -q '"risk_alerts":\['; then
    pass "T03.3: Risk alerts array returned"
  else
    info "T03.3: No risk_alerts in response"
  fi

else
  fail "T03.1: Financial planning failed"
  echo "$RESPONSE" | head -200
fi

# ============================================================================
# Test T04: OCR Document
# ============================================================================
echo ""
echo "Testing T04: OCR Document"
echo "-------------------------------------------"

info "Test 4.1: Process OCR with mock data (no base64)"
RESPONSE=$(curl -s -X POST "$BASE_URL/ocr_document" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d "{}")

if echo "$RESPONSE" | grep -q '"success":true'; then
  pass "T04.1: OCR returned success"

  if echo "$RESPONSE" | grep -q '"extracted_data"'; then
    pass "T04.2: Extracted data returned"

    if echo "$RESPONSE" | grep -q '"invoice_number":"INV-'; then
      INVOICE=$(echo "$RESPONSE" | grep -o '"invoice_number":"[^"]*"' | head -1)
      pass "T04.3: Mock invoice number generated"
    else
      info "T04.3: No invoice_number in response"
    fi

  else
    fail "T04.2: No extracted_data in response"
  fi

else
  fail "T04.1: OCR processing failed"
  echo "$RESPONSE" | head -200
fi

# ============================================================================
# Summary
# ============================================================================
echo ""
echo "=========================================="
echo "Test Summary"
echo "=========================================="
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
  echo ""
  echo -e "${GREEN}All tests passed! Phase 1 functions are working correctly.${NC}"
  exit 0
else
  echo ""
  echo -e "${RED}Some tests failed. Please check the output above.${NC}"
  exit 1
fi
