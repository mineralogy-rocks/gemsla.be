import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/supabase/admin";
import { markStonesSoldSchema } from "@/app/api/stones/types";

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
		const validation = markStonesSoldSchema.safeParse(body);

		if (!validation.success) {
			return NextResponse.json(
				{ error: "Validation failed", details: validation.error.flatten() },
				{ status: 400 },
			);
		}

		const { stones } = validation.data;

		if (stones.length === 0) {
			return NextResponse.json({ updated: 0, errors: [] });
		}

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
				{ error: "Marking stones as sold only available for issued invoices" },
				{ status: 400 },
			);
		}

		const stoneIds = stones.map((s) => s.stone_id);
		const { data: junctionRecords, error: junctionError } = await supabase
			.from("stone_invoices")
			.select("stone_id")
			.eq("invoice_id", invoiceId)
			.in("stone_id", stoneIds);

		if (junctionError) {
			console.error("Error checking stone_invoices:", junctionError);
			return NextResponse.json({ error: "Failed to verify stone links" }, { status: 500 });
		}

		const linkedStoneIds = new Set((junctionRecords || []).map((r) => r.stone_id));
		const unlinkedStones = stoneIds.filter((id) => !linkedStoneIds.has(id));

		if (unlinkedStones.length > 0) {
			return NextResponse.json(
				{ error: `Stone ${unlinkedStones[0]} is not linked to this invoice` },
				{ status: 400 },
			);
		}

		let updated = 0;
		const errors: string[] = [];
		const now = new Date().toISOString();

		for (const stone of stones) {
			const { error: updateError } = await supabase
				.from("stones")
				.update({
					is_sold: true,
					sold_at: now,
					sold_price: stone.sold_price ?? null,
				})
				.eq("id", stone.stone_id);

			if (updateError) {
				console.error(`Failed to update stone ${stone.stone_id}:`, updateError);
				errors.push(`Failed to update stone ${stone.stone_id}`);
			} else {
				updated++;
			}
		}

		return NextResponse.json({ updated, errors });
	} catch (error) {
		console.error("Mark stones sold error:", error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}
