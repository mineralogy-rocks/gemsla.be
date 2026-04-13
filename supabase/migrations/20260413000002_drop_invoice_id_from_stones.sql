-- Migration: Drop invoice_id FK from stones
-- Date: 2026-04-13
-- Reason: Replaced by stone_invoices junction table

ALTER TABLE public.stones DROP COLUMN IF EXISTS invoice_id;
