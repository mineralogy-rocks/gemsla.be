-- Migration: Add shipping, status, and VAT rate columns
-- Date: 2026-03-25
-- Purpose: Add shipping_usd/shipping_eur to invoices and stones,
--          add is_paid/is_processed/vat_rate to invoices.
-- Rollback: See bottom of file

BEGIN;

	-- ============================================
	-- INVOICES TABLE
	-- ============================================

	ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS shipping_usd NUMERIC(12,2)
		CHECK (shipping_usd IS NULL OR shipping_usd >= 0);

	ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS shipping_eur NUMERIC(12,2)
		CHECK (shipping_eur IS NULL OR shipping_eur >= 0);

	ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS vat_rate NUMERIC(5,2)
		CHECK (vat_rate IS NULL OR vat_rate >= 0);

	ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS is_paid BOOLEAN NOT NULL DEFAULT FALSE;

	ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS is_processed BOOLEAN NOT NULL DEFAULT FALSE;

	-- ============================================
	-- STONES TABLE
	-- ============================================

	ALTER TABLE public.stones ADD COLUMN IF NOT EXISTS shipping_usd NUMERIC(12,2)
		CHECK (shipping_usd IS NULL OR shipping_usd >= 0);

	ALTER TABLE public.stones ADD COLUMN IF NOT EXISTS shipping_eur NUMERIC(12,2)
		CHECK (shipping_eur IS NULL OR shipping_eur >= 0);

COMMIT;

-- ============================================
-- ROLLBACK INSTRUCTIONS
-- ============================================
-- BEGIN;
--   ALTER TABLE public.stones DROP COLUMN IF EXISTS shipping_eur;
--   ALTER TABLE public.stones DROP COLUMN IF EXISTS shipping_usd;
--   ALTER TABLE public.invoices DROP COLUMN IF EXISTS is_processed;
--   ALTER TABLE public.invoices DROP COLUMN IF EXISTS is_paid;
--   ALTER TABLE public.invoices DROP COLUMN IF EXISTS vat_rate;
--   ALTER TABLE public.invoices DROP COLUMN IF EXISTS shipping_eur;
--   ALTER TABLE public.invoices DROP COLUMN IF EXISTS shipping_usd;
-- COMMIT;
