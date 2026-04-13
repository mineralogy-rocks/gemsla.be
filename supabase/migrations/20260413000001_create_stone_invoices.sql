CREATE TABLE IF NOT EXISTS public.stone_invoices (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stone_id   UUID NOT NULL REFERENCES public.stones(id) ON DELETE CASCADE,
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(stone_id, invoice_id)
);

CREATE INDEX IF NOT EXISTS idx_stone_invoices_stone_id ON public.stone_invoices(stone_id);
CREATE INDEX IF NOT EXISTS idx_stone_invoices_invoice_id ON public.stone_invoices(invoice_id);

ALTER TABLE public.stone_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access on stone_invoices"
ON public.stone_invoices
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());
