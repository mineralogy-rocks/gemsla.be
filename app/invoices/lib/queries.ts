import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import type { InvoiceDetail, InvoiceListItem, InvoiceStats, MonthlyInvoiceStat, PaginatedInvoicesResponse } from "@/app/api/stones/types";

const VALID_SORT_COLUMNS = ["invoice_number", "original_invoice_number", "invoice_date", "supplier", "price_eur", "price_usd", "created_at"] as const;
type SortColumn = typeof VALID_SORT_COLUMNS[number];

interface FetchInvoicesParams {
	page?: number;
	limit?: number;
	sortBy?: string;
	sortDir?: string;
	q?: string;
	isArchived?: boolean;
	type?: string;
	unlinkedOnly?: boolean;
}

export const fetchInvoices = cache(async ({
	page = 1,
	limit = 20,
	sortBy = "created_at",
	sortDir = "desc",
	q = "",
	isArchived = false,
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
		.select("*, stone_invoices(count)", { count: "exact" })
		.eq("is_archived", isArchived);

	if (unlinkedOnly) {
		query = query.is("refund_of", null);
	} else {
		query = query.is("refund_of", null);
	}

	if (type) {
		query = query.eq("type", type);
	}

	if (q) {
		const sanitized = q.replace(/[%_,().]/g, "\\$&");
		query = query.or(
			`invoice_number.ilike.%${sanitized}%,original_invoice_number.ilike.%${sanitized}%,supplier.ilike.%${sanitized}%`
		);
	}

	const offset = (page - 1) * limit;
	const { data, count, error } = await query
		.order(column, { ascending })
		.range(offset, offset + limit - 1);

	if (error) {
		console.error("Error fetching invoices:", error);
		return { data: [], total: 0, page, limit, totalPages: 0 };
	}

	const items: InvoiceListItem[] = (data || []).map(({ stone_invoices, ...invoice }) => ({
		...invoice,
		stone_count: stone_invoices?.[0]?.count ?? 0,
	}));

	const parentIds = items.map((inv) => inv.id);
	const creditNotes: Record<string, InvoiceListItem[]> = {};

	if (parentIds.length > 0) {
		const { data: cnData } = await supabase
			.from("invoices")
			.select("*, stone_invoices(count)")
			.in("refund_of", parentIds)
			.eq("is_archived", isArchived)
			.order("created_at", { ascending: false });

		for (const { stone_invoices, ...cn } of cnData || []) {
			const parentId = cn.refund_of!;
			if (!creditNotes[parentId]) creditNotes[parentId] = [];
			creditNotes[parentId].push({ ...cn, stone_count: stone_invoices?.[0]?.count ?? 0 });
		}
	}

	return {
		data: items,
		creditNotes,
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
		.select("*, stone_invoices(stones(id, name, stone_type, color, weight_carats, selling_price, sold_price, sold_at, gross_eur, is_sold, item_number, created_at))")
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

	const { stone_invoices, ...invoice } = data;
	const stones = (stone_invoices || []).map((si: { stones: unknown }) => si.stones).filter(Boolean);
	return {
		...invoice,
		signed_url: signedUrl,
		stones,
		parent_invoice: parentInvoice,
		refund_invoices: refundInvoices,
	} as InvoiceDetail;
});


export const fetchInvoiceStats = cache(async (): Promise<InvoiceStats> => {
	const supabase = await createClient();

	const [invoiceAgg, parsedCount, unparsedCount, validatedCount, revenueAgg] = await Promise.all([
		supabase
			.from("invoices")
			.select("gross_eur")
			.eq("is_parsed", true)
			.eq("is_paid", true)
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
			.from("invoices")
			.select("gross_eur")
			.eq("type", "issued")
			.eq("is_archived", false)
			.eq("is_paid", true),
	]);

	return {
		total_eur: (invoiceAgg.data ?? []).reduce((sum, row) => sum + (row.gross_eur ?? 0), 0),
		total_revenue: (revenueAgg.data ?? []).reduce((sum, row) => sum + (row.gross_eur ?? 0), 0),
		parsed_count: parsedCount.count ?? 0,
		unparsed_count: unparsedCount.count ?? 0,
		validated_count: validatedCount.count ?? 0,
	};
});


export const fetchMonthlyInvoiceStats = cache(async (): Promise<MonthlyInvoiceStat[]> => {
	const supabase = await createClient();

	const { data } = await supabase
		.from("invoices")
		.select("invoice_date, created_at, gross_eur, is_paid, type")
		.eq("is_archived", false)
		.neq("type", "credit_note");

	if (!data) return [];

	const map = new Map<string, MonthlyInvoiceStat>();
	for (const row of data) {
		const dateStr = (row.invoice_date ?? row.created_at) as string;
		const month = dateStr.slice(0, 7);
		if (!map.has(month)) {
			map.set(month, { month, invested_paid: 0, invested_all: 0, revenue_paid: 0, revenue_all: 0 });
		}
		const entry = map.get(month)!;
		const gross = row.gross_eur ?? 0;
		if (row.type === "received") {
			entry.invested_all += gross;
			if (row.is_paid) entry.invested_paid += gross;
		} else if (row.type === "issued") {
			entry.revenue_all += gross;
			if (row.is_paid) entry.revenue_paid += gross;
		}
	}

	return Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month));
});