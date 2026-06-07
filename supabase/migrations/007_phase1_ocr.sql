-- ============================================================================
-- REDP Phase 1: Document OCR Integration (T04)
-- Created: 2026-06-07
-- ============================================================================

SET client_encoding = 'UTF8';

-- ============================================================================
-- MODIFY TABLE: cost_ledger
-- Add OCR extracted data columns
-- ============================================================================

ALTER TABLE cost_ledger
  ADD COLUMN IF NOT EXISTS ocr_extracted_data JSONB,
  /*
  {
    "invoice_number": "INV-2026-001",
    "invoice_date": "2026-06-01",
    "vendor_name": "新疆建材公司",
    "total_amount": 85000.00,
    "tax_amount": 11050.00,
    "items": [{"description": "水泥", "qty": 100, "unit_price": 850, "amount": 85000}],
    "ocr_confidence": 0.92,
    "ocr_model": "nvidia/nemotron-3-super-120b-a12b",
    "needs_review": false
  }
  */
  ADD COLUMN IF NOT EXISTS ocr_status TEXT DEFAULT 'NOT_PROCESSED'
    CHECK (ocr_status IN ('NOT_PROCESSED', 'PROCESSING', 'COMPLETED', 'FAILED', 'NEEDS_REVIEW'));

-- ============================================================================
-- NEW TABLE: ocr_jobs (for tracking batch processing)
-- ============================================================================

CREATE TABLE IF NOT EXISTS ocr_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cost_ledger_id UUID REFERENCES cost_ledger(id),
  file_path TEXT NOT NULL,
  job_status TEXT NOT NULL DEFAULT 'PENDING'
    CHECK (job_status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')),
  ocr_result JSONB,
  error_message TEXT,
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE ocr_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY ocr_jobs_finance_all ON ocr_jobs
  FOR ALL TO finance USING (true) WITH CHECK (true);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_ocr_jobs_cost_ledger ON ocr_jobs(cost_ledger_id);
CREATE INDEX IF NOT EXISTS idx_ocr_jobs_status ON ocr_jobs(job_status);

-- ============================================================================
-- RECORD MIGRATION
-- ============================================================================

INSERT INTO schema_version (version_number, migration_name, migration_file, rollback_strategy)
VALUES (
  '0.3.3',
  'Phase 1 - Document OCR Integration (T04)',
  '007_phase1_ocr.sql',
  'ALTER TABLE cost_ledger DROP COLUMN ocr_extracted_data, DROP COLUMN ocr_status; DROP TABLE ocr_jobs CASCADE;'
);
