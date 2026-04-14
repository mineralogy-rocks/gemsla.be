import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/supabase/admin";
import type { StoneListItem } from "../types";

export async function POST(request: NextRequest) {
	try {
		const admin = await isAdmin();
		if (!admin) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = await request.json();
		const ids: string[] = body.ids ?? [];

		if (ids.length === 0) {
			return NextResponse.json({ found: [], not_found: [] });
		}

		const supabase = await createClient();

		const { data, error } = await supabase
			.from("stones")
			.select("id, name, stone_type, color, cut, weight_carats, dimensions, description, country, selling_price, sold_price, sold_at, gross_eur, gross_usd, adjusted_price_eur, is_sold, item_number, created_at")
			.in("id", ids);

		if (error) {
			console.error("Error validating stones:", error);
			return NextResponse.json({ error: "Failed to validate stones" }, { status: 500 });
		}

		const foundIds = new Set((data || []).map((s) => s.id));
		const notFound = ids.filter((id) => !foundIds.has(id));

		const found: StoneListItem[] = (data || []).map((stone) => ({
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

		return NextResponse.json({ found, not_found: notFound });
	} catch (error) {
		console.error("Stones validate error:", error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}
