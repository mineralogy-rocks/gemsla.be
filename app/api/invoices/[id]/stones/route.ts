import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/supabase/admin";

const linkStoneSchema = z.object({
	stone_id: z.string().uuid(),
});

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const admin = await isAdmin();
		if (!admin) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { id: invoiceId } = await params;
		const body = await request.json();
		const validation = linkStoneSchema.safeParse(body);

		if (!validation.success) {
			return NextResponse.json(
				{ error: "Validation failed", details: validation.error.flatten() },
				{ status: 400 },
			);
		}

		const { stone_id } = validation.data;
		const supabase = await createClient();

		const { data: invoice, error: invoiceError } = await supabase
			.from("invoices")
			.select("id, type")
			.eq("id", invoiceId)
			.single();

		if (invoiceError || !invoice) {
			return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
		}

		if (invoice.type !== "issued") {
			return NextResponse.json(
				{ error: "Only issued invoices support stone linking" },
				{ status: 400 },
			);
		}

		const { data: stone, error: stoneError } = await supabase
			.from("stones")
			.select("id")
			.eq("id", stone_id)
			.single();

		if (stoneError || !stone) {
			return NextResponse.json({ error: "Stone not found" }, { status: 400 });
		}

		const { error: insertError } = await supabase
			.from("stone_invoices")
			.upsert(
				{ stone_id, invoice_id: invoiceId },
				{ onConflict: "stone_id,invoice_id" },
			);

		if (insertError) {
			console.error("Error linking stone:", insertError);
			return NextResponse.json({ error: "Failed to link stone" }, { status: 500 });
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Stone link error:", error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}

export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const admin = await isAdmin();
		if (!admin) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { id: invoiceId } = await params;
		const body = await request.json();
		const validation = linkStoneSchema.safeParse(body);

		if (!validation.success) {
			return NextResponse.json(
				{ error: "Validation failed", details: validation.error.flatten() },
				{ status: 400 },
			);
		}

		const { stone_id } = validation.data;
		const supabase = await createClient();

		const { data: invoice, error: invoiceError } = await supabase
			.from("invoices")
			.select("id, type")
			.eq("id", invoiceId)
			.single();

		if (invoiceError || !invoice) {
			return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
		}

		if (invoice.type !== "issued") {
			return NextResponse.json(
				{ error: "Only issued invoices support stone unlinking" },
				{ status: 400 },
			);
		}

		const { error: deleteError } = await supabase
			.from("stone_invoices")
			.delete()
			.eq("stone_id", stone_id)
			.eq("invoice_id", invoiceId);

		if (deleteError) {
			console.error("Error unlinking stone:", deleteError);
			return NextResponse.json({ error: "Failed to unlink stone" }, { status: 500 });
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Stone unlink error:", error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}
