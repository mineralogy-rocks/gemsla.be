-- Migration: Rename invoice columns and add invoice_type enum
-- Date: 2026-04-07
-- Purpose: Rename invoice_number -> original_invoice_number,
--          credit_note_number -> invoice_number,
--          and add type column with invoice_type enum (received, issued, credit_note)
-- Rollback: See bottom of file

BEGIN;

	-- Step 1: Create enum type
	DO $$
	BEGIN
		IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'invoice_type') THEN
			CREATE TYPE public.invoice_type AS ENUM ('received', 'issued', 'credit_note');
		END IF;
	END $$;

	-- Step 2: Rename columns (use temp name to avoid conflict)
	ALTER TABLE public.invoices RENAME COLUMN invoice_number TO original_invoice_number;
	ALTER TABLE public.invoices RENAME COLUMN credit_note_number TO invoice_number;

	-- Step 3: Add type column
	ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS type public.invoice_type NOT NULL DEFAULT 'received';

COMMIT;

-- ============================================
-- ROLLBACK INSTRUCTIONS
-- ============================================
-- BEGIN;
--   ALTER TABLE public.invoices DROP COLUMN IF EXISTS type;
--   ALTER TABLE public.invoices RENAME COLUMN invoice_number TO credit_note_number;
--   ALTER TABLE public.invoices RENAME COLUMN original_invoice_number TO invoice_number;
--   DROP TYPE IF EXISTS public.invoice_type;
-- COMMIT;
