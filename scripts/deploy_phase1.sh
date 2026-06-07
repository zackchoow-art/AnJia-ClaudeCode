#!/bin/bash
# ============================================================================
# REDP Phase 1 Deployment Script
# Deploy migrations and Edge Functions for T01-T04
# ============================================================================

set -e

echo "=========================================="
echo "REDP Phase 1 Deployment"
echo "=========================================="

# Load environment variables
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

# Validate environment
if [ -z "$SUPABASE_CONNECTION_STRING" ]; then
  echo "ERROR: SUPABASE_CONNECTION_KEY not set in .env"
  exit 1
fi

echo ""
echo "[Step 1/4] Running database migrations..."
echo "------------------------------------------"

# Run migrations in order
migrations=(
  "004_phase1_contract_review.sql"
  "005_phase1_tax_detection.sql"
  "006_phase1_financial_planning.sql"
  "007_phase1_ocr.sql"
)

for migration in "${migrations[@]}"; do
  echo "Running: $migration"
  psql "$SUPABASE_CONNECTION_STRING" -f "supabase/migrations/$migration"
  echo ""
done

echo "[Step 2/4] Deploying Edge Functions..."
echo "------------------------------------------"

# Deploy T01: AI Contract Review
echo "Deploying ai_contract_review function..."
supabase functions deploy ai_contract_review \
  --project-ref bdonljxgltkhbiheljdi \
  --auth-token "$SUPABASE_SERVICE_ROLE_KEY" 2>/dev/null || {
  echo "Note: supabase CLI not available. Manual deployment required."
  echo "Run: cd supabase/functions/ai_contract_review && supabase functions deploy"
}

# Deploy T02: Tax Risk Detection
echo "Deploying tax_risk_detection function..."
supabase functions deploy tax_risk_detection \
  --project-ref bdonljxgltkhbiheljdi \
  --auth-token "$SUPABASE_SERVICE_ROLE_KEY" 2>/dev/null || {
  echo "Note: supabase CLI not available. Manual deployment required."
}

# Deploy T03: Financial Planning
echo "Deploying financial_planning function..."
supabase functions deploy financial_planning \
  --project-ref bdonljxgltkhbiheljdi \
  --auth-token "$SUPABASE_SERVICE_ROLE_KEY" 2>/dev/null || {
  echo "Note: supabase CLI not available. Manual deployment required."
}

# Deploy T04: OCR Document
echo "Deploying ocr_document function..."
supabase functions deploy ocr_document \
  --project-ref bdonljxgltkhbiheljdi \
  --auth-token "$SUPABASE_SERVICE_ROLE_KEY" 2>/dev/null || {
  echo "Note: supabase CLI not available. Manual deployment required."
}

echo ""
echo "[Step 3/4] Verifying deployments..."
echo "------------------------------------------"

# Check migrations were applied
echo "Checking schema version..."
psql "$SUPABASE_CONNECTION_STRING" -c "
SELECT version_number, migration_name
FROM schema_version
WHERE version_number >= '0.3.0'
ORDER BY version_number DESC;
"

echo ""
echo "[Step 4/4] Setup complete!"
echo "=========================================="
echo "Deployed:"
echo "  - T01: AI Contract Review (contract_reviews table)"
echo "  - T02: Tax Risk Detection (tax_calculations table)"
echo "  - T03: Financial Planning (financial_plans table)"
echo "  - T04: Document OCR (cost_ledger ocr_* columns, ocr_jobs table)"
echo ""
echo "Environment variables to verify:"
echo "  - NVIDIA_API_KEY (for AI/OCR services)"
echo ""
echo "Functions endpoints:"
echo "  - https://bdonljxgltkhbiheljdi.supabase.co/functions/v1/ai_contract_review"
echo "  - https://bdonljxgltkhbiheljdi.supabase.co/functions/v1/tax_risk_detection"
echo "  - https://bdonljxgltkhbiheljdi.supabase.co/functions/v1/financial_planning"
echo "  - https://bdonljxgltkhbiheljdi.supabase.co/functions/v1/ocr_document"
