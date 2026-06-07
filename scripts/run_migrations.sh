#!/bin/bash
# REDP Phase 1 Database Migration Script

set -e

echo "=========================================="
echo "REDP Phase 1 Database Migration"
echo "=========================================="

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

if [ -f "$PROJECT_DIR/.env" ]; then
  export $(grep -v '^#' "$PROJECT_DIR/.env" | xargs)
  echo "Loaded environment variables from .env"
else
  echo "Error: .env file not found in project directory"
  exit 1
fi

if [ -z "$SUPABASE_CONNECTION_STRING" ]; then
  echo "Error: SUPABASE_CONNECTION_STRING not set in .env"
  exit 1
fi

echo ""
echo "[Step 1/4] Running database migrations..."
psql "$SUPABASE_CONNECTION_STRING" -f "$SCRIPT_DIR/run_phase1_migrations.sql"

echo ""
echo "[Step 2/4] Verifying migrations..."
psql "$SUPABASE_CONNECTION_STRING" -c "
SELECT version_number, migration_name
FROM schema_version
WHERE version_number >= '0.3.0'
ORDER BY id DESC;
"

echo ""
echo "=========================================="
echo "Migration completed successfully!"
echo "=========================================="
echo ""
echo "New tables created:"
echo "  - contract_reviews (T01)"
echo "  - tax_calculations (T02)"
echo "  - financial_plans (T03)"
echo "  - ocr_jobs (T04)"
echo ""
echo "Next steps:"
echo "1. Deploy Edge Functions"
echo "2. Configure NVIDIA_API_KEY in Supabase dashboard"
echo "3. Run tests to verify functionality"
