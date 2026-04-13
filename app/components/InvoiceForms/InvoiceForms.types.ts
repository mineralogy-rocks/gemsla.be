export interface InvoiceFormData {
	id: string;
	invoice_number: string;
	original_invoice_number: string;
	order_number: string;
	supplier: string;
	invoice_date: string;
	price_usd: string;
	price_eur: string;
	shipment_usd: string;
	shipment_eur: string;
	vat_rate: string;
	vat_usd: string;
	vat_eur: string;
	gross_usd: string;
	gross_eur: string;
}

export interface StoneFormData {
	_id: string;
	name: string;
	description: string;
	stone_type: string;
	color: string;
	cut: string;
	weight_carats: string;
	dimensions: string;
	country: string;
	price_usd: string;
	price_eur: string;
	shipment_usd: string;
	shipment_eur: string;
	vat_usd: string;
	vat_eur: string;
	gross_usd: string;
	gross_eur: string;
	errors: Record<string, string>;
}

export interface ItemFormData {
	_id: string;
	item_number: string;
	name: string;
	description: string;
	carat_weight: string;
	dimensions: string;
	shape: string;
	color: string;
	treatment: string;
	origin: string;
	piece_count: string;
	price_usd: string;
	price_eur: string;
	shipment_usd: string;
	shipment_eur: string;
	vat_usd: string;
	vat_eur: string;
	gross_usd: string;
	gross_eur: string;
}
