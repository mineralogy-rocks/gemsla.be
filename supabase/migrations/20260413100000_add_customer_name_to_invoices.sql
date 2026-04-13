-- Migration: Add customer_name column to invoices
-- Date: 2026-04-13
-- Purpose: Support issued invoices by storing the customer name
-- Rollback: See bottom of file

BEGIN;

	ALTER TABLE public.invoices
		ADD COLUMN IF NOT EXISTS customer_name TEXT;

COMMIT;

-- ============================================
-- ROLLBACK INSTRUCTIONS
-- ============================================
-- BEGIN;
--   ALTER TABLE public.invoices DROP COLUMN IF EXISTS customer_name;
-- COMMIT;
