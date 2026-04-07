ALTER TABLE public.invoices RENAME COLUMN is_processed TO is_parsed;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS is_validated BOOLEAN NOT NULL DEFAULT FALSE;
