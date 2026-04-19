import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function escapeIlike(input: string): string {
	return input.replace(/[\\%_]/g, (c) => `\\${c}`);
}

export async function GET(request: NextRequest) {
	try {
		const supabase = await createClient();
		const { data: { user } } = await supabase.auth.getUser();

		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}
		if (user.app_metadata?.role !== "admin") {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		const searchParams = request.nextUrl.searchParams;
		const q = (searchParams.get("q") ?? "").trim();
		const limitParam = parseInt(searchParams.get("limit") || "20", 10);
		const limit = Math.min(50, Math.max(1, Number.isFinite(limitParam) ? limitParam : 20));

		let query = supabase
			.from("reports")
			.select("id, title, stone, created_at")
			.order("created_at", { ascending: false })
			.limit(limit);

		if (q) {
			const safe = escapeIlike(q);
			const pattern = `%${safe}%`;
			const clauses = [
				`title.ilike.${pattern}`,
				`stone.ilike.${pattern}`,
			];

			if (UUID_RE.test(q)) {
				clauses.push(`id.eq.${q}`);
			}

			query = query.or(clauses.join(","));
		}

		const { data, error } = await query;

		if (error) {
			console.error("Reports search failed", { endpoint: "/api/reports/search", q, error });
			return NextResponse.json({ error: "Search failed" }, { status: 500 });
		}

		return NextResponse.json({ results: data || [] });
	} catch (error) {
		console.error("Reports search error", { endpoint: "/api/reports/search", error });
		return NextResponse.json({ error: "Search failed" }, { status: 500 });
	}
}
