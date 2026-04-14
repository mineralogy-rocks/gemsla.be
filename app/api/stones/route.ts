import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/supabase/admin";
import { createStoneSchema, type PaginatedStonesResponse, type StoneListItem } from "./types";

export async function GET(request: NextRequest) {
	try {
		const admin = await isAdmin();
		if (!admin) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const searchParams = request.nextUrl.searchParams;
		const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
		const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "12", 10)));
		const search = searchParams.get("q") || "";
		const minPrice = searchParams.get("min_price");
		const maxPrice = searchParams.get("max_price");
		const showSold = searchParams.get("show_sold");
		const sortBy = searchParams.get("sort_by") || "";
		const sortDir = searchParams.get("sort_dir") || "";

		const validSortColumns = ["name", "color", "weight_carats", "selling_price", "sold_price", "country", "created_at"];
		const validatedSortBy = validSortColumns.includes(sortBy) ? sortBy : "created_at";
		const ascending = sortDir === "asc";

		const supabase = await createClient();

		let query = supabase
			.from("stones")
			.select("id, name, stone_type, color, cut, weight_carats, dimensions, description, country, selling_price, sold_price, sold_at, gross_eur, gross_usd, adjusted_price_eur, is_sold, item_number, created_at", { count: "exact" });

		if (search) {
			const sanitized = search.replace(/[%_,().]/g, "\\$&");
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

		if (showSold === "sold" || showSold === "1") {
			query = query.eq("is_sold", true);
		} else if (showSold !== "all") {
			query = query.eq("is_sold", false);
		}

		const offset = (page - 1) * limit;
		const { data, count, error } = await query
			.order(validatedSortBy, { ascending })
			.range(offset, offset + limit - 1);

		if (error) {
			console.error("Error fetching stones:", error);
			return NextResponse.json({ error: "Failed to fetch stones" }, { status: 500 });
		}

		const items: StoneListItem[] = (data || []).map((stone) => ({
			id: stone.id,
			name: stone.name,
			stone_type: stone.stone_type,
			color: stone.color,
			cut: stone.cut,
			weight_carats: stone.weight_carats,
			dimensions: stone.dimensions,
			description: stone.description,
			country: stone.country,
			selling_price: stone.selling_price,
			sold_price: stone.sold_price,
			sold_at: stone.sold_at,
			gross_eur: stone.gross_eur,
			gross_usd: stone.gross_usd,
			adjusted_price_eur: stone.adjusted_price_eur,
			is_sold: stone.is_sold,
			item_number: stone.item_number,
			created_at: stone.created_at,
		}));

		const response: PaginatedStonesResponse = {
			data: items,
			total: count || 0,
			page,
			limit,
			totalPages: Math.ceil((count || 0) / limit),
		};

		return NextResponse.json(response);
	} catch (error) {
		console.error("Stones GET error:", error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}

export async function POST(request: NextRequest) {
	try {
		const admin = await isAdmin();
		if (!admin) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = await request.json();
		const invoiceId: string | undefined = body.invoice_id;
		const validation = createStoneSchema.safeParse(body);

		if (!validation.success) {
			return NextResponse.json(
				{ error: "Validation failed", details: validation.error.flatten() },
				{ status: 400 }
			);
		}

		const supabase = await createClient();

		const { data: stone, error } = await supabase
			.from("stones")
			.insert(validation.data)
			.select()
			.single();

		if (error) {
			console.error("Error creating stone:", error);
			return NextResponse.json({ error: "Failed to create stone" }, { status: 500 });
		}

		if (invoiceId) {
			try {
				const junctionRecords: { stone_id: string; invoice_id: string }[] = [
					{ stone_id: stone.id, invoice_id: invoiceId },
				];

				const { data: creditNotes } = await supabase
					.from("invoices")
					.select("id")
					.eq("refund_of", invoiceId);

				if (creditNotes?.length) {
					for (const cn of creditNotes) {
						junctionRecords.push({ stone_id: stone.id, invoice_id: cn.id });
					}
				}

				await supabase.from("stone_invoices").insert(junctionRecords);
			} catch (err) {
				console.error("Failed to create stone_invoices junction records:", err);
			}
		}

		return NextResponse.json(stone, { status: 201 });
	} catch (error) {
		console.error("Stones POST error:", error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}
