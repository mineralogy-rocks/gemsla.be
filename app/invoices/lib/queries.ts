import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { InvoiceDetail, InvoiceListItem, InvoiceStats, PaginatedInvoicesResponse } from "@/app/api/stones/types";

const VALID_SORT_COLUMNS = ["invoice_number", "original_invoice_number", "invoice_date", "supplier", "price_eur", "price_usd", "created_at"] as const;
type SortColumn = typeof VALID_SORT_COLUMNS[number];

interface FetchInvoicesParams {
	page?: number;
	limit?: number;
	sortBy?: string;
	sortDir?: string;
	q?: string;
	isParsed?: boolean;
	isUnparsed?: boolean;
	isPaid?: boolean;
	isValidated?: boolean;
	showRefunds?: boolean;
	type?: string;
	unlinkedOnly?: boolean;
}

export const fetchInvoices = cache(async ({
	page = 1,
	limit = 12,
	sortBy = "created_at",
	sortDir = "desc",
	q = "",
	isParsed = false,
	isUnparsed = false,
	isPaid = false,
	isValidated = false,
	showRefunds = false,
	type,
	unlinkedOnly = false,
}: FetchInvoicesParams): Promise<PaginatedInvoicesResponse> => {
	const supabase = await createClient();

	const column: SortColumn = VALID_SORT_COLUMNS.includes(sortBy as SortColumn)
		? (sortBy as SortColumn)
		: "created_at";
	const ascending = sortDir === "asc";

	let query = supabase
		.from("invoices")
		.select("*, stones(count)", { count: "exact" })
		.eq("is_archived", false);

	if (q) {
		const sanitized = q.replace(/[%_,().]/g, "\\$&");
		query = query.or(
			`invoice_number.ilike.%${sanitized}%,original_invoice_number.ilike.%${sanitized}%,supplier.ilike.%${sanitized}%`
		);
	}

	if (isParsed) {
		query = query.eq("is_parsed", true);
	} else if (isUnparsed) {
		query = query.eq("is_parsed", false);
	}

	if (isPaid) {
		query = query.eq("is_paid", true);
	}

	if (isValidated) {
		query = query.eq("is_validated", true);
	}

	if (unlinkedOnly) {
		query = query.is("refund_of", null);
	} else if (showRefunds) {
		query = query.not("refund_of", "is", null);
	} else {
		query = query.is("refund_of", null);
	}

	if (type) {
		query = query.eq("type", type);
	}

	const offset = (page - 1) * limit;
	const { data, count, error } = await query
		.order(column, { ascending })
		.range(offset, offset + limit - 1);

	if (error) {
		console.error("Error fetching invoices:", error);
		return { data: [], total: 0, page, limit, totalPages: 0 };
	}

	const items: InvoiceListItem[] = (data || []).map(({ stones, ...invoice }) => ({
		...invoice,
		stone_count: stones?.[0]?.count ?? 0,
	}));

	return {
		data: items,
		total: count || 0,
		page,
		limit,
		totalPages: Math.ceil((count || 0) / limit),
	};
});

export const fetchInvoiceById = cache(async (id: string): Promise<InvoiceDetail | null> => {
	const supabase = await createClient();

	const { data, error } = await supabase
		.from("invoices")
		.select("*, stones(id, name, stone_type, color, weight_carats, selling_price, is_sold, item_number, created_at)")
		.eq("id", id)
		.single();

	if (error || !data) {
		return null;
	}

	let signedUrl: string | undefined;
	if (data.file_path) {
		const { data: urlData } = await supabase.storage
			.from("invoices")
			.createSignedUrl(data.file_path, 3600);
		signedUrl = urlData?.signedUrl ?? undefined;
	}

	let parentInvoice: { id: string; invoice_number: string | null; original_invoice_number: string | null } | null = null;
	if (data.refund_of) {
		const { data: parent } = await supabase
			.from("invoices")
			.select("id, invoice_number, original_invoice_number, price_eur, price_usd, shipment_eur, shipment_usd, vat_eur, vat_usd, gross_eur, gross_usd")
			.eq("id", data.refund_of)
			.single();
		parentInvoice = parent ?? null;
	}

	const { data: refunds } = await supabase
		.from("invoices")
		.select("id, invoice_number, original_invoice_number, price_eur, price_usd, shipment_eur, shipment_usd, vat_rate, vat_eur, vat_usd, gross_eur, gross_usd, invoice_date, items, file_path")
		.eq("refund_of", id);

	const refundInvoices = await Promise.all(
		(refunds || []).map(async ({ file_path, ...rest }) => {
			let refundSignedUrl: string | undefined;
			if (file_path) {
				const { data: urlData } = await supabase.storage
					.from("invoices")
					.createSignedUrl(file_path, 3600);
				refundSignedUrl = urlData?.signedUrl ?? undefined;
			}
			return { ...rest, signed_url: refundSignedUrl };
		})
	);

	const { stones, ...invoice } = data;
	return {
		...invoice,
		signed_url: signedUrl,
		stones: stones || [],
		parent_invoice: parentInvoice,
		refund_invoices: refundInvoices,
	} as InvoiceDetail;
});


export const fetchInvoiceStats = cache(async (): Promise<InvoiceStats> => {
	const supabase = await createClient();

	const [invoiceAgg, parsedCount, unparsedCount, validatedCount, revenueAgg] = await Promise.all([
		supabase
			.from("invoices")
			.select("total_eur:gross_eur.sum()")
			.eq("is_parsed", true)
			.eq("is_archived", false),
		supabase
			.from("invoices")
			.select("id", { count: "exact", head: true })
			.eq("is_parsed", true)
			.eq("is_archived", false),
		supabase
			.from("invoices")
			.select("id", { count: "exact", head: true })
			.eq("is_parsed", false)
			.eq("is_archived", false),
		supabase
			.from("invoices")
			.select("id", { count: "exact", head: true })
			.eq("is_validated", true)
			.eq("is_archived", false),
		supabase
			.from("stones")
			.select("total_revenue:sold_price.sum()")
			.eq("is_sold", true),
	]);

	return {
		total_eur: invoiceAgg.data?.[0]?.total_eur ?? 0,
		total_revenue: revenueAgg.data?.[0]?.total_revenue ?? 0,
		parsed_count: parsedCount.count ?? 0,
		unparsed_count: unparsedCount.count ?? 0,
		validated_count: validatedCount.count ?? 0,
	};
});
