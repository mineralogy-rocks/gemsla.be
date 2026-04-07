import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/supabase/admin";

const bulkArchiveSchema = z.object({
	ids: z.array(z.string().uuid()).min(1).max(100),
});

export async function POST(request: NextRequest) {
	try {
		const admin = await isAdmin();
		if (!admin) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = await request.json();
		const validation = bulkArchiveSchema.safeParse(body);

		if (!validation.success) {
			return NextResponse.json(
				{ error: "Validation failed", details: validation.error.flatten() },
				{ status: 400 },
			);
		}

		const { ids } = validation.data;
		const supabase = await createClient();

		const { error } = await supabase
			.from("invoices")
			.update({ is_archived: true })
			.in("id", ids);

		if (error) {
			console.error("Error bulk archiving invoices:", error);
			return NextResponse.json({ error: "Failed to archive invoices" }, { status: 500 });
		}

		return NextResponse.json({ archived: ids.length });
	} catch (error) {
		console.error("Bulk archive error:", error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}
