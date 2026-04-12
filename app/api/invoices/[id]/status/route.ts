import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/supabase/admin";

interface RouteParams {
	params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
	try {
		const admin = await isAdmin();
		if (!admin) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { id } = await params;
		const supabase = await createClient();

		const { data, error } = await supabase
			.from("invoices")
			.select("parse_status, is_parsed")
			.eq("id", id)
			.single();

		if (error || !data) {
			return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
		}

		return NextResponse.json(data);
	} catch {
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}