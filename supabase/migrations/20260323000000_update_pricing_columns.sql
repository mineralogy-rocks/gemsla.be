-- Migration: Update pricing columns on stones and invoices
-- Date: 2026-03-23
-- Purpose: Remove currency from stones, rename purchase_price to purchase_price_usd,
--          add purchase_price_eur. Remove total_amount and currency from invoices,
--          add price_usd, price_eur, vat_usd, vat_eur.

BEGIN;

	-- ============================================
	-- STONES TABLE
	-- ============================================

	ALTER TABLE public.stones DROP COLUMN IF EXISTS currency;

	ALTER TABLE public.stones RENAME COLUMN purchase_price TO purchase_price_usd;

	ALTER TABLE public.stones ADD COLUMN IF NOT EXISTS purchase_price_eur NUMERIC(12,2)
		CHECK (purchase_price_eur IS NULL OR purchase_price_eur >= 0);

	-- ============================================
	-- INVOICES TABLE
	-- ============================================

	ALTER TABLE public.invoices DROP COLUMN IF EXISTS total_amount;
	ALTER TABLE public.invoices DROP COLUMN IF EXISTS currency;

	ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS price_usd NUMERIC(12,2)
		CHECK (price_usd IS NULL OR price_usd >= 0);

	ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS price_eur NUMERIC(12,2)
		CHECK (price_eur IS NULL OR price_eur >= 0);

	ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS vat_usd NUMERIC(12,2)
		CHECK (vat_usd IS NULL OR vat_usd >= 0);

	ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS vat_eur NUMERIC(12,2)
		CHECK (vat_eur IS NULL OR vat_eur >= 0);

COMMIT;

-- Rollback:
-- BEGIN;
--   ALTER TABLE public.invoices DROP COLUMN IF EXISTS vat_eur;
--   ALTER TABLE public.invoices DROP COLUMN IF EXISTS vat_usd;
--   ALTER TABLE public.invoices DROP COLUMN IF EXISTS price_eur;
--   ALTER TABLE public.invoices DROP COLUMN IF EXISTS price_usd;
--   ALTER TABLE public.invoices ADD COLUMN currency TEXT CHECK (currency IS NULL OR currency IN ('USD', 'EUR', 'UAH'));
--   ALTER TABLE public.invoices ADD COLUMN total_amount NUMERIC(12,2) CHECK (total_amount IS NULL OR total_amount >= 0);
--   ALTER TABLE public.stones DROP COLUMN IF EXISTS purchase_price_eur;
--   ALTER TABLE public.stones RENAME COLUMN purchase_price_usd TO purchase_price;
--   ALTER TABLE public.stones ADD COLUMN currency TEXT CHECK (currency IS NULL OR currency IN ('USD', 'EUR', 'UAH'));
-- COMMIT;
