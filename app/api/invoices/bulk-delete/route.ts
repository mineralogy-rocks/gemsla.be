import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/supabase/admin";
import { z } from "zod";

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

		const { data: invoices, error: fetchError } = await supabase
			.from("invoices")
			.select("id, file_path")
			.in("id", ids);

		if (fetchError) {
			console.error("Error fetching invoices for bulk delete:", fetchError);
			return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 });
		}

		const filePaths = (invoices || [])
			.map((inv) => inv.file_path)
			.filter((p): p is string => !!p);

		if (filePaths.length > 0) {
			const { error: storageError } = await supabase.storage
				.from("invoices")
				.remove(filePaths);

			if (storageError) {
				console.error("Error deleting invoice files:", storageError);
			}
		}

		const { error: deleteError } = await supabase
			.from("invoices")
			.delete()
			.in("id", ids);

		if (deleteError) {
			console.error("Error bulk deleting invoices:", deleteError);
			return NextResponse.json({ error: "Failed to delete invoices" }, { status: 500 });
		}

		return NextResponse.json({ deleted: ids.length });
	} catch (error) {
		console.error("Bulk delete error:", error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}
