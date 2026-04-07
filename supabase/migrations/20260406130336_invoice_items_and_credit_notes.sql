-- Migration: Add items JSONB and credit note support
-- Date: 2026-04-06
-- Purpose: Add items JSONB to invoices for storing parsed line items,
--          credit_note_number for credit notes, item_number to stones,
--          and drop >= 0 CHECK constraints on invoice pricing (credit notes have negative values).
-- Rollback: See bottom of file

BEGIN;

	-- ============================================
	-- INVOICES TABLE
	-- ============================================

	ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS items JSONB;

	ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS credit_note_number TEXT
		CHECK (credit_note_number IS NULL OR LENGTH(TRIM(credit_note_number)) > 0);

	-- Drop >= 0 CHECK constraints on invoice pricing columns
	-- These are unnamed inline constraints, so we find them dynamically
	DO $$
	DECLARE
		r RECORD;
	BEGIN
		FOR r IN
			SELECT con.conname
			FROM pg_catalog.pg_constraint con
			JOIN pg_catalog.pg_class rel ON rel.oid = con.conrelid
			JOIN pg_catalog.pg_namespace nsp ON nsp.oid = rel.relnamespace
			WHERE nsp.nspname = 'public'
				AND rel.relname = 'invoices'
				AND con.contype = 'c'
				AND (
					pg_get_constraintdef(con.oid) LIKE '%price_usd%>=%0%'
					OR pg_get_constraintdef(con.oid) LIKE '%price_eur%>=%0%'
					OR pg_get_constraintdef(con.oid) LIKE '%vat_usd%>=%0%'
					OR pg_get_constraintdef(con.oid) LIKE '%vat_eur%>=%0%'
					OR pg_get_constraintdef(con.oid) LIKE '%shipment_usd%>=%0%'
					OR pg_get_constraintdef(con.oid) LIKE '%shipment_eur%>=%0%'
					OR pg_get_constraintdef(con.oid) LIKE '%gross_usd%>=%0%'
					OR pg_get_constraintdef(con.oid) LIKE '%gross_eur%>=%0%'
				)
		LOOP
			EXECUTE format('ALTER TABLE public.invoices DROP CONSTRAINT %I', r.conname);
		END LOOP;
	END $$;

	-- ============================================
	-- STONES TABLE
	-- ============================================

	ALTER TABLE public.stones ADD COLUMN IF NOT EXISTS item_number TEXT;

	-- Composite index for looking up stones by invoice + item_number
	CREATE INDEX IF NOT EXISTS idx_stones_invoice_item
		ON public.stones(invoice_id, item_number);

COMMIT;

-- ============================================
-- ROLLBACK INSTRUCTIONS
-- ============================================
-- BEGIN;
--   DROP INDEX IF EXISTS idx_stones_invoice_item;
--   ALTER TABLE public.stones DROP COLUMN IF EXISTS item_number;
--   ALTER TABLE public.invoices DROP COLUMN IF EXISTS credit_note_number;
--   ALTER TABLE public.invoices DROP COLUMN IF EXISTS items;
--   -- Re-add CHECK constraints on invoice pricing columns:
--   ALTER TABLE public.invoices ADD CHECK (price_usd IS NULL OR price_usd >= 0);
--   ALTER TABLE public.invoices ADD CHECK (price_eur IS NULL OR price_eur >= 0);
--   ALTER TABLE public.invoices ADD CHECK (vat_usd IS NULL OR vat_usd >= 0);
--   ALTER TABLE public.invoices ADD CHECK (vat_eur IS NULL OR vat_eur >= 0);
--   ALTER TABLE public.invoices ADD CHECK (shipment_usd IS NULL OR shipment_usd >= 0);
--   ALTER TABLE public.invoices ADD CHECK (shipment_eur IS NULL OR shipment_eur >= 0);
--   ALTER TABLE public.invoices ADD CHECK (gross_usd IS NULL OR gross_usd >= 0);
--   ALTER TABLE public.invoices ADD CHECK (gross_eur IS NULL OR gross_eur >= 0);
-- COMMIT;
