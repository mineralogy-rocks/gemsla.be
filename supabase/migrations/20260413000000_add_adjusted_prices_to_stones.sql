ALTER TABLE public.stones
    ADD COLUMN IF NOT EXISTS adjusted_price_eur NUMERIC(12,2),
    ADD COLUMN IF NOT EXISTS adjusted_price_usd NUMERIC(12,2);
