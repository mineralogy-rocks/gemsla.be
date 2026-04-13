import { z } from "zod";

export const invoiceItemSchema = z.object({
	item_number: z.string().optional().nullable(),
	name: z.string().min(1),
	description: z.string().optional().nullable(),
	carat_weight: z.number().optional().nullable(),
	dimensions: z.string().optional().nullable(),
	shape: z.string().optional().nullable(),
	color: z.string().optional().nullable(),
	treatment: z.string().optional().nullable(),
	origin: z.string().optional().nullable(),
	piece_count: z.number().int().default(1),
	price_usd: z.number().optional().nullable(),
	price_eur: z.number().optional().nullable(),
	shipment_usd: z.number().optional().nullable(),
	shipment_eur: z.number().optional().nullable(),
	vat_usd: z.number().optional().nullable(),
	vat_eur: z.number().optional().nullable(),
	gross_usd: z.number().optional().nullable(),
	gross_eur: z.number().optional().nullable(),
});

export const createStoneSchema = z.object({
	name: z.string().min(1, "Name is required").max(255),
	description: z.string().optional().nullable(),
	stone_type: z.string().max(100).optional().nullable(),
	color: z.string().max(100).optional().nullable(),
	cut: z.string().max(100).optional().nullable(),
	weight_carats: z.number().positive("Weight must be positive").optional().nullable(),
	dimensions: z.string().max(200).optional().nullable(),
	country: z.string().max(100).optional().nullable(),
	price_usd: z.number().min(0).optional().nullable(),
	price_eur: z.number().min(0).optional().nullable(),
	shipment_usd: z.number().min(0).optional().nullable(),
	shipment_eur: z.number().min(0).optional().nullable(),
	vat_usd: z.number().min(0).optional().nullable(),
	vat_eur: z.number().min(0).optional().nullable(),
	gross_usd: z.number().min(0).optional().nullable(),
	gross_eur: z.number().min(0).optional().nullable(),
	selling_price: z.number().min(0).optional().nullable(),
	is_sold: z.boolean().default(false),
	sold_at: z.string().datetime({ offset: true }).optional().nullable(),
	sold_price: z.number().min(0).optional().nullable(),
	notes: z.string().optional().nullable(),
	invoice_id: z.string().uuid().optional().nullable(),
	item_number: z.string().max(100).optional().nullable(),
});

export const updateStoneSchema = createStoneSchema.partial();

export const parseStatusSchema = z.enum(["pending", "parsing", "completed", "failed"]).nullable().optional();

export type ParseStatus = "pending" | "parsing" | "completed" | "failed" | null;

export const createInvoiceSchema = z.object({
	invoice_number: z.string().max(100).optional().nullable(),
	original_invoice_number: z.string().max(100).optional().nullable(),
	type: z.enum(["received", "issued", "credit_note"]).default("received").optional(),
	supplier: z.string().max(255).optional().nullable(),
	invoice_date: z.string().optional().nullable(),
	price_usd: z.number().optional().nullable(),
	price_eur: z.number().optional().nullable(),
	vat_usd: z.number().optional().nullable(),
	shipment_usd: z.number().optional().nullable(),
	shipment_eur: z.number().optional().nullable(),
	vat_rate: z.number().min(0).optional().nullable(),
	vat_eur: z.number().optional().nullable(),
	gross_usd: z.number().optional().nullable(),
	gross_eur: z.number().optional().nullable(),
	file_path: z.string().optional().nullable(),
	notes: z.string().optional().nullable(),
	order_number: z.string().max(100).optional().nullable(),
	refund_of: z.string().uuid().optional().nullable(),
	is_paid: z.boolean().optional(),
	is_parsed: z.boolean().optional(),
	is_validated: z.boolean().optional(),
	is_archived: z.boolean().optional(),
	items: z.array(invoiceItemSchema).optional().nullable(),
	parse_metadata: z.object({
		raw_response: z.string(),
		confidence: z.record(z.string(), z.number()),
		model: z.string(),
		parsed_at: z.string(),
	}).optional().nullable(),
	parse_status: parseStatusSchema,
});

export type CreateStoneInput = z.infer<typeof createStoneSchema>;
export type UpdateStoneInput = z.infer<typeof updateStoneSchema>;
export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type InvoiceItem = z.infer<typeof invoiceItemSchema>;

export type InvoiceType = "received" | "issued" | "credit_note";

export type Confidence = Partial<Record<string, number>>;

export interface ParseMetadata {
	raw_response: string;
	confidence: Record<string, number>;
	model: string;
	parsed_at: string;
}

export interface Issue {
	severity: "error" | "warning" | "info";
	code: string;
	field?: string;
	message: string;
	fix?: string;
}

export interface Invoice {
	id: string;
	invoice_number: string | null;
	original_invoice_number: string | null;
	type: InvoiceType;
	supplier: string | null;
	invoice_date: string | null;
	price_usd: number | null;
	price_eur: number | null;
	shipment_usd: number | null;
	shipment_eur: number | null;
	vat_rate: number | null;
	vat_usd: number | null;
	vat_eur: number | null;
	gross_usd: number | null;
	gross_eur: number | null;
	order_number: string | null;
	refund_of: string | null;
	is_paid: boolean;
	is_parsed: boolean;
	is_validated: boolean;
	is_archived: boolean;
	parse_status: ParseStatus;
	file_path: string | null;
	notes: string | null;
	items: InvoiceItem[] | null;
	parse_metadata: ParseMetadata | null;
	created_at: string;
	updated_at: string;
}

export interface InvoiceListItem extends Invoice {
	stone_count: number;
}

export interface InvoiceDetail extends Invoice {
	signed_url?: string;
	stones: StoneListItem[];
	parent_invoice?: {
		id: string;
		invoice_number: string | null;
		original_invoice_number: string | null;
		price_eur: number | null;
		price_usd: number | null;
		shipment_eur: number | null;
		shipment_usd: number | null;
		vat_eur: number | null;
		vat_usd: number | null;
		gross_eur: number | null;
		gross_usd: number | null;
	} | null;
	refund_invoices?: {
		id: string;
		invoice_number: string | null;
		original_invoice_number: string | null;
		price_eur: number | null;
		price_usd: number | null;
		shipment_eur: number | null;
		shipment_usd: number | null;
		vat_rate: number | null;
		vat_eur: number | null;
		vat_usd: number | null;
		gross_eur: number | null;
		gross_usd: number | null;
		invoice_date: string | null;
		items: InvoiceItem[] | null;
		signed_url?: string;
	}[];
}

export interface PaginatedInvoicesResponse {
	data: InvoiceListItem[];
	creditNotes?: Record<string, InvoiceListItem[]>;
	total: number;
	page: number;
	limit: number;
	totalPages: number;
}

export interface InvoiceStats {
	total_eur: number;
	total_revenue: number;
	parsed_count: number;
	unparsed_count: number;
	validated_count: number;
}

export interface Stone {
	id: string;
	invoice_id: string | null;
	item_number: string | null;
	name: string;
	description: string | null;
	stone_type: string | null;
	color: string | null;
	cut: string | null;
	weight_carats: number | null;
	dimensions: string | null;
	country: string | null;
	price_usd: number | null;
	price_eur: number | null;
	shipment_usd: number | null;
	shipment_eur: number | null;
	vat_usd: number | null;
	vat_eur: number | null;
	gross_usd: number | null;
	gross_eur: number | null;
	selling_price: number | null;
	is_sold: boolean;
	sold_at: string | null;
	sold_price: number | null;
	notes: string | null;
	created_at: string;
	updated_at: string;
	invoices?: Invoice | null;
}

export interface StoneListItem {
	id: string;
	name: string;
	stone_type: string | null;
	color: string | null;
	weight_carats: number | null;
	country: string | null;
	selling_price: number | null;
	is_sold: boolean;
	item_number: string | null;
	created_at: string;
}

export interface PaginatedStonesResponse {
	data: StoneListItem[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
}
