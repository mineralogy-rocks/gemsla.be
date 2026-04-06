-- Stones: rename pricing columns
ALTER TABLE stones RENAME COLUMN purchase_price_usd TO price_usd;
ALTER TABLE stones RENAME COLUMN purchase_price_eur TO price_eur;
ALTER TABLE stones RENAME COLUMN shipping_usd TO shipment_usd;
ALTER TABLE stones RENAME COLUMN shipping_eur TO shipment_eur;

-- Stones: add new pricing columns
ALTER TABLE stones ADD COLUMN vat_usd NUMERIC(12, 2);
ALTER TABLE stones ADD COLUMN vat_eur NUMERIC(12, 2);
ALTER TABLE stones ADD COLUMN gross_usd NUMERIC(12, 2);
ALTER TABLE stones ADD COLUMN gross_eur NUMERIC(12, 2);

-- Invoices: rename shipping columns
ALTER TABLE invoices RENAME COLUMN shipping_usd TO shipment_usd;
ALTER TABLE invoices RENAME COLUMN shipping_eur TO shipment_eur;

-- Invoices: add gross columns
ALTER TABLE invoices ADD COLUMN gross_usd NUMERIC(12, 2);
ALTER TABLE invoices ADD COLUMN gross_eur NUMERIC(12, 2);