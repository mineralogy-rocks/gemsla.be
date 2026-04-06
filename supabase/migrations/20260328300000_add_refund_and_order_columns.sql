-- Drop is_refund boolean in favor of refund_of FK
ALTER TABLE invoices DROP COLUMN IF EXISTS is_refund;

-- Add order_number for tracking original order references
ALTER TABLE invoices ADD COLUMN order_number TEXT;

-- Self-referencing FK: if set, this invoice is a credit note for the referenced invoice
ALTER TABLE invoices ADD COLUMN refund_of UUID REFERENCES invoices(id) ON DELETE SET NULL;

-- Index for efficient lookup of credit notes linked to an invoice
CREATE INDEX idx_invoices_refund_of ON invoices(refund_of) WHERE refund_of IS NOT NULL;
