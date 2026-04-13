import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/supabase/admin";

const bulkDeleteSchema = z.object({
	ids: z.array(z.string().uuid()).min(1).max(100),
});

export async function POST(request: NextRequest) {
	try {
		const admin = await isAdmin();
		if (!admin) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = await request.json();
		const validation = bulkDeleteSchema.safeParse(body);

		if (!validation.success) {
			return NextResponse.json(
				{ error: "Validation failed", details: validation.error.flatten() },
				{ status: 400 },
			);
		}

		const { ids } = validation.data;
		const supabase = await createClient();

		const { error: deleteError } = await supabase
			.from("stones")
			.delete()
			.in("id", ids);

		if (deleteError) {
			console.error("Error bulk deleting stones:", deleteError);
			return NextResponse.json({ error: "Failed to delete stones" }, { status: 500 });
		}

		return NextResponse.json({ deleted: ids.length });
	} catch (error) {
		console.error("Bulk delete stones error:", error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}
