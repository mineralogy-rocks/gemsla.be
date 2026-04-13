import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/supabase/admin";
import { z } from "zod";

const bulkUpdateSchema = z.object({
	ids: z.array(z.string().uuid()).min(1).max(100),
	data: z.object({
		is_paid: z.boolean().optional(),
		is_parsed: z.boolean().optional(),
		is_validated: z.boolean().optional(),
	}).refine((d) => Object.keys(d).length > 0, { message: "At least one field is required" }),
});

export async function POST(request: NextRequest) {
	try {
		const admin = await isAdmin();
		if (!admin) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = await request.json();
		const validation = bulkUpdateSchema.safeParse(body);

		if (!validation.success) {
			return NextResponse.json(
				{ error: "Validation failed", details: validation.error.flatten() },
				{ status: 400 },
			);
		}

		const { ids, data } = validation.data;
		const supabase = await createClient();

		const { error: updateError } = await supabase
			.from("invoices")
			.update(data)
			.in("id", ids);

		if (updateError) {
			console.error("Error bulk updating invoices:", updateError);
			return NextResponse.json({ error: "Failed to update invoices" }, { status: 500 });
		}

		return NextResponse.json({ updated: ids.length });
	} catch (error) {
		console.error("Bulk update error:", error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}
