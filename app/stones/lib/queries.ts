import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { PaginatedStonesResponse, StoneListItem, Stone, Invoice, StoneInvoice } from "@/app/api/stones/types";

type SortColumn = "name" | "color" | "weight_carats" | "selling_price" | "sold_price" | "country" | "created_at";

const VALID_SORT_COLUMNS: SortColumn[] = ["name", "color", "weight_carats", "selling_price", "sold_price", "country", "created_at"];

interface FetchStonesParams {
	page?: number;
	limit?: number;
	q?: string;
	minPrice?: string;
	maxPrice?: string;
	showSold?: "all" | "sold" | "unsold";
	sortBy?: string;
	sortDir?: string;
}

export const fetchStones = cache(async ({
	page = 1,
	limit = 12,
	q = "",
	minPrice = "",
	maxPrice = "",
	showSold = "all",
	sortBy = "",
	sortDir = "",
}: FetchStonesParams): Promise<PaginatedStonesResponse> => {
	const supabase = await createClient();

	let query = supabase
		.from("stones")
		.select("id, name, stone_type, color, weight_carats, country, selling_price, sold_price, sold_at, gross_eur, is_sold, item_number, created_at", { count: "exact" });

	if (q) {
		const sanitized = q.replace(/[%_,().]/g, "\\$&");
		query = query.or(
			`name.ilike.%${sanitized}%,description.ilike.%${sanitized}%,country.ilike.%${sanitized}%,stone_type.ilike.%${sanitized}%,color.ilike.%${sanitized}%`
		);
	}

	if (minPrice) {
		const min = parseFloat(minPrice);
		if (!isNaN(min)) {
			query = query.gte("selling_price", min);
		}
	}

	if (maxPrice) {
		const max = parseFloat(maxPrice);
		if (!isNaN(max)) {
			query = query.lte("selling_price", max);
		}
	}

	if (showSold === "sold") {
		query = query.eq("is_sold", true);
	} else if (showSold === "unsold") {
		query = query.eq("is_sold", false);
	}

	const validatedSortBy = VALID_SORT_COLUMNS.includes(sortBy as SortColumn) ? sortBy : "created_at";
	const ascending = sortDir === "asc";

	const offset = (page - 1) * limit;
	const { data, count, error } = await query
		.order(validatedSortBy, { ascending })
		.range(offset, offset + limit - 1);

	if (error) {
		console.error("Error fetching stones:", error);
		return { data: [], total: 0, page, limit, totalPages: 0 };
	}

	const items: StoneListItem[] = (data || []).map((stone) => ({
		id: stone.id,
		name: stone.name,
		stone_type: stone.stone_type,
		color: stone.color,
		weight_carats: stone.weight_carats,
		country: stone.country,
		selling_price: stone.selling_price,
		sold_price: stone.sold_price,
		sold_at: stone.sold_at,
		gross_eur: stone.gross_eur,
		is_sold: stone.is_sold,
		item_number: stone.item_number,
		created_at: stone.created_at,
	}));

	return {
		data: items,
		total: count || 0,
		page,
		limit,
		totalPages: Math.ceil((count || 0) / limit),
	};
});

export const fetchStoneById = cache(async (id: string): Promise<Stone | null> => {
	const supabase = await createClient();

	const { data, error } = await supabase
		.from("stones")
		.select("*, stone_invoices(invoice_id, invoices(*))")
		.eq("id", id)
		.single();

	if (error || !data) {
		return null;
	}

	if (data.stone_invoices?.length) {
		for (const si of data.stone_invoices as { invoices: Invoice & { signed_url?: string; file_path?: string } }[]) {
			if (si.invoices?.file_path) {
				const { data: urlData } = await supabase.storage
					.from("invoices")
					.createSignedUrl(si.invoices.file_path, 3600);
				si.invoices.signed_url = urlData?.signedUrl ?? undefined;
			}
		}
	}

	return data as Stone;
});

export const fetchInvoices = cache(async (): Promise<Invoice[]> => {
	const supabase = await createClient();

	const { data, error } = await supabase
		.from("invoices")
		.select("*")
		.order("created_at", { ascending: false });

	if (error) {
		console.error("Error fetching invoices:", error);
		return [];
	}

	return data || [];
});
