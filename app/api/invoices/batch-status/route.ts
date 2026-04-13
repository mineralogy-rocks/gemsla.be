import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
	try {
		const admin = await isAdmin();
		if (!admin) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { ids } = await request.json();
		if (!Array.isArray(ids) || ids.length === 0) {
			return NextResponse.json({ error: "ids array is required" }, { status: 400 });
		}

		const supabase = await createClient();

		const { data, error } = await supabase
			.from("invoices")
			.select("id, parse_status, is_parsed")
			.in("id", ids);

		if (error) {
			return NextResponse.json({ error: "Failed to fetch statuses" }, { status: 500 });
		}

		return NextResponse.json(data);
	} catch {
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}