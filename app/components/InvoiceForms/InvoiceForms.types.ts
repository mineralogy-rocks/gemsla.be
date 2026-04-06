export interface InvoiceFormData {
	id: string;
	invoice_number: string;
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
	is_refund: boolean;
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
