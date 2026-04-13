import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/supabase/admin";

interface RouteParams {
	params: Promise<{ id: string }>;
}

export async function POST(_request: NextRequest, { params }: RouteParams) {
	try {
		const admin = await isAdmin();
		if (!admin) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { id } = await params;
		const supabase = await createClient();

		const { data: invoice, error: fetchError } = await supabase
			.from("invoices")
			.select("id, file_path, parse_status")
			.eq("id", id)
			.single();

		if (fetchError || !invoice) {
			return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
		}

		if (!invoice.file_path) {
			return NextResponse.json({ error: "No PDF file attached" }, { status: 400 });
		}

		if (invoice.parse_status === "pending" || invoice.parse_status === "parsing") {
			return NextResponse.json({ error: "Parsing already in progress" }, { status: 409 });
		}

		const { error: updateError } = await supabase
			.from("invoices")
			.update({ parse_status: "pending" })
			.eq("id", id);

		if (updateError) {
			return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
		}

		const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
		const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

		if (supabaseUrl && serviceRoleKey) {
			fetch(`${supabaseUrl}/functions/v1/parse-invoice`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"Authorization": `Bearer ${serviceRoleKey}`,
				},
				body: JSON.stringify({ invoice_id: id }),
			}).catch((err) => {
				console.error("Failed to invoke Edge Function:", err);
			});
		}

		return NextResponse.json({ parse_status: "pending" });
	} catch {
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}