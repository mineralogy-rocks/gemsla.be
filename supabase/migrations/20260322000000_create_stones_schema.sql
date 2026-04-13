-- Migration: Create stones and invoices schema
-- Date: 2026-03-22
-- Purpose: Tables, RLS policies, indexes, and triggers for stone inventory management
-- Rollback: See bottom of file

BEGIN;

	-- ============================================
	-- EXTENSIONS
	-- ============================================

	CREATE EXTENSION IF NOT EXISTS pg_trgm;

	-- ============================================
	-- TABLES
	-- ============================================

	CREATE TABLE IF NOT EXISTS public.invoices (
		id				UUID PRIMARY KEY DEFAULT gen_random_uuid(),
		invoice_number	TEXT CHECK (invoice_number IS NULL OR LENGTH(TRIM(invoice_number)) > 0),
		supplier		TEXT CHECK (supplier IS NULL OR LENGTH(TRIM(supplier)) > 0),
		invoice_date	DATE,
		total_amount	NUMERIC(12,2) CHECK (total_amount IS NULL OR total_amount >= 0),
		currency		TEXT CHECK (currency IS NULL OR currency IN ('USD', 'EUR', 'UAH')),
		file_path		TEXT,
		notes			TEXT,
		created_at		TIMESTAMPTZ NOT NULL DEFAULT NOW(),
		updated_at		TIMESTAMPTZ NOT NULL DEFAULT NOW(),

		CONSTRAINT valid_invoice_dates CHECK (updated_at >= created_at)
	);

	CREATE TABLE IF NOT EXISTS public.stones (
		id				UUID PRIMARY KEY DEFAULT gen_random_uuid(),
		invoice_id		UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
		name			TEXT NOT NULL CHECK (LENGTH(TRIM(name)) > 0),
		description		TEXT,
		stone_type		TEXT,
		color			TEXT,
		cut				TEXT,
		weight_carats	NUMERIC(8,3) CHECK (weight_carats IS NULL OR weight_carats > 0),
		dimensions		TEXT,
		country			TEXT,
		purchase_price	NUMERIC(12,2) CHECK (purchase_price IS NULL OR purchase_price >= 0),
		selling_price	NUMERIC(12,2) CHECK (selling_price IS NULL OR selling_price >= 0),
		currency		TEXT CHECK (currency IS NULL OR currency IN ('USD', 'EUR', 'UAH')),
		is_sold			BOOLEAN NOT NULL DEFAULT FALSE,
		sold_at			TIMESTAMPTZ,
		sold_price		NUMERIC(12,2) CHECK (sold_price IS NULL OR sold_price >= 0),
		notes			TEXT,
		created_at		TIMESTAMPTZ NOT NULL DEFAULT NOW(),
		updated_at		TIMESTAMPTZ NOT NULL DEFAULT NOW(),

		CONSTRAINT valid_stone_dates CHECK (updated_at >= created_at),
		CONSTRAINT valid_sold_fields CHECK (
			(is_sold = FALSE AND sold_at IS NULL AND sold_price IS NULL)
			OR (is_sold = TRUE)
		)
	);

	-- ============================================
	-- INDEXES
	-- ============================================

	-- Fuzzy search GIN indexes on stones
	CREATE INDEX IF NOT EXISTS idx_stones_name_trgm
		ON public.stones USING GIN (name gin_trgm_ops);

	CREATE INDEX IF NOT EXISTS idx_stones_description_trgm
		ON public.stones USING GIN (description gin_trgm_ops);

	CREATE INDEX IF NOT EXISTS idx_stones_country_trgm
		ON public.stones USING GIN (country gin_trgm_ops);

	-- FK index
	CREATE INDEX IF NOT EXISTS idx_stones_invoice_id
		ON public.stones(invoice_id);

	-- Partial index for unsold stones
	CREATE INDEX IF NOT EXISTS idx_stones_unsold
		ON public.stones(id)
		WHERE is_sold = FALSE;

	-- Price range queries
	CREATE INDEX IF NOT EXISTS idx_stones_selling_price
		ON public.stones(selling_price);

	-- Invoices indexes
	CREATE INDEX IF NOT EXISTS idx_invoices_invoice_date
		ON public.invoices(invoice_date DESC);

	-- ============================================
	-- ROW LEVEL SECURITY
	-- ============================================

	ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
	ALTER TABLE public.stones ENABLE ROW LEVEL SECURITY;

	-- ============================================
	-- INVOICES POLICIES
	-- ============================================

	DROP POLICY IF EXISTS "Admin full access on invoices" ON public.invoices;
	CREATE POLICY "Admin full access on invoices"
		ON public.invoices
		FOR ALL
		TO authenticated
		USING (public.is_admin())
		WITH CHECK (public.is_admin());

	-- ============================================
	-- STONES POLICIES
	-- ============================================

	DROP POLICY IF EXISTS "Admin full access on stones" ON public.stones;
	CREATE POLICY "Admin full access on stones"
		ON public.stones
		FOR ALL
		TO authenticated
		USING (public.is_admin())
		WITH CHECK (public.is_admin());

	-- ============================================
	-- TRIGGERS
	-- ============================================

	DROP TRIGGER IF EXISTS update_invoices_updated_at ON public.invoices;
	CREATE TRIGGER update_invoices_updated_at
		BEFORE UPDATE ON public.invoices
		FOR EACH ROW
		EXECUTE FUNCTION public.update_updated_at_column();

	DROP TRIGGER IF EXISTS update_stones_updated_at ON public.stones;
	CREATE TRIGGER update_stones_updated_at
		BEFORE UPDATE ON public.stones
		FOR EACH ROW
		EXECUTE FUNCTION public.update_updated_at_column();

	-- ============================================
	-- GRANTS
	-- ============================================

	GRANT ALL ON TABLE public.invoices TO authenticated, service_role;
	GRANT ALL ON TABLE public.stones TO authenticated, service_role;

COMMIT;

-- ============================================
-- ROLLBACK INSTRUCTIONS
-- ============================================
-- BEGIN;
--   DROP TRIGGER IF EXISTS update_stones_updated_at ON public.stones;
--   DROP TRIGGER IF EXISTS update_invoices_updated_at ON public.invoices;
--   DROP POLICY IF EXISTS "Admin full access on stones" ON public.stones;
--   DROP POLICY IF EXISTS "Admin full access on invoices" ON public.invoices;
--   DROP INDEX IF EXISTS idx_invoices_invoice_date;
--   DROP INDEX IF EXISTS idx_stones_selling_price;
--   DROP INDEX IF EXISTS idx_stones_unsold;
--   DROP INDEX IF EXISTS idx_stones_invoice_id;
--   DROP INDEX IF EXISTS idx_stones_country_trgm;
--   DROP INDEX IF EXISTS idx_stones_description_trgm;
--   DROP INDEX IF EXISTS idx_stones_name_trgm;
--   DROP TABLE IF EXISTS public.stones;
--   DROP TABLE IF EXISTS public.invoices;
-- COMMIT;
