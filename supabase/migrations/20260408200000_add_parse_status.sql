ALTER TABLE public.invoices
ADD COLUMN IF NOT EXISTS parse_status TEXT
    CHECK (parse_status IS NULL OR parse_status IN ('pending', 'parsing', 'completed', 'failed'));