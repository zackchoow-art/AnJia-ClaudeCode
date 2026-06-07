#!/bin/bash
# ============================================================================
# REDP Phase 1 Test Script
# Run tests for T01-T04 deployed functions
# ============================================================================

set -e

echo "=========================================="
echo "REDP Phase 1 Integration Tests"
echo "=========================================="

# Load environment variables
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

SUPABASE_URL="${SUPABASE_URL:-https://bdonljxgltkhbiheljdi.supabase.co}"
SERVICE_KEY="$SUPABASE_SERVICE_ROLE_KEY"

BASE_URL="$SUPABASE_URL/functions/v1"

echo ""
echo "Testing T01: AI Contract Review"
echo "------------------------------------------"
# Test with a sample contract_id (replace with actual test data)
curl -s -X POST "$BASE_URL/ai_contract_review" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"contract_id": "test-contract-id"}' || echo "T01: Function not yet deployed or test data missing"

echo ""
echo ""
echo "Testing T02: Tax Risk Detection"
echo "------------------------------------------"
curl -s -X POST "$BASE_URL/tax_risk_detection" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"project_id": "test-project-id"}' || echo "T02: Function not yet deployed or test data missing"

echo ""
echo ""
echo "Testing T03: Financial Planning"
echo "------------------------------------------"
curl -s -X POST "$BASE_URL/financial_planning" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"project_id": "test-project-id"}' || echo "T03: Function not yet deployed or test data missing"

echo ""
echo ""
echo "Testing T04: OCR Document"
echo "------------------------------------------"
# Note: This requires a base64 encoded image
curl -s -X POST "$BASE_URL/ocr_document" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"file_base64": ""}' || echo "T04: Function not yet deployed"

echo ""
echo "=========================================="
echo "Test completed. Check output above for results."
