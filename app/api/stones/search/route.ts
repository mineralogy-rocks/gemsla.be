import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
	try {
		const admin = await isAdmin();
		if (!admin) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const searchParams = request.nextUrl.searchParams;
		const q = searchParams.get("q")?.trim() || "";
		const limit = Math.min(20, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)));

		if (!q) {
			return NextResponse.json({ stones: [] });
		}

		const supabase = await createClient();

		const { data, error } = await supabase
			.from("stones")
			.select("id, name, color, weight_carats, is_sold")
			.ilike("name", `%${q}%`)
			.order("created_at", { ascending: false })
			.limit(limit);

		if (error) {
			console.error("Stone search error:", error);
			return NextResponse.json({ error: "Failed to search stones" }, { status: 500 });
		}

		return NextResponse.json({ stones: data || [] });
	} catch (error) {
		console.error("Stones search error:", error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}
