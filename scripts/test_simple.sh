#!/bin/bash
# Simple Phase 1 test - just check if functions are accessible

echo "Phase 1 Function Tests"
echo "======================"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_DIR/.env"

if [ -f "$ENV_FILE" ]; then
  export $(grep -v '^#' "$ENV_FILE" | grep -v '^$' | xargs)
fi

SUPABASE_URL="${SUPABASE_URL:-https://bdonljxgltkhbiheljdi.supabase.co}"
SERVICE_KEY="$SUPABASE_SERVICE_ROLE_KEY"
BASE_URL="$SUPABASE_URL/functions/v1"

echo ""
echo "Test 1: T01 - AI Contract Review"
curl -s -X POST "$BASE_URL/ai_contract_review" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"contract_id": "c1111111-1111-1111-1111-111111111111"}' | head -c 500
echo ""

echo ""
echo "Test 2: T02 - Tax Risk Detection"
curl -s -X POST "$BASE_URL/tax_risk_detection" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"project_id": "11111111-1111-1111-1111-111111111111"}' | head -c 500
echo ""

echo ""
echo "Test 3: T03 - Financial Planning"
curl -s -X POST "$BASE_URL/financial_planning" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"project_id": "11111111-1111-1111-1111-111111111111", "plan_type": "MONTHLY"}' | head -c 500
echo ""

echo ""
echo "Test 4: T04 - OCR Document (mock data)"
curl -s -X POST "$BASE_URL/ocr_document" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{}' | head -c 500
echo ""

echo ""
echo "All tests completed!"
