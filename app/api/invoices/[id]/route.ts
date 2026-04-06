import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/supabase/admin";
import { createInvoiceSchema } from "@/app/api/stones/types";

interface RouteParams {
	params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
	try {
		const admin = await isAdmin();
		if (!admin) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { id } = await params;
		if (!id) {
			return NextResponse.json({ error: "Invoice ID is required" }, { status: 400 });
		}

		const supabase = await createClient();

		const { data: invoice, error } = await supabase
			.from("invoices")
			.select("*, stones(id, name, stone_type, color, weight_carats, selling_price, is_sold, created_at)")
			.eq("id", id)
			.single();

		if (error || !invoice) {
			return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
		}

		let signedUrl: string | null = null;
		if (invoice.file_path) {
			const { data: urlData } = await supabase.storage
				.from("invoices")
				.createSignedUrl(invoice.file_path, 3600);
			signedUrl = urlData?.signedUrl || null;
		}

		const { stones, ...invoiceData } = invoice;
		return NextResponse.json({ ...invoiceData, signed_url: signedUrl, stones: stones || [] });
	} catch (error) {
		console.error("Invoice GET error:", error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
	try {
		const admin = await isAdmin();
		if (!admin) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { id } = await params;
		if (!id) {
			return NextResponse.json({ error: "Invoice ID is required" }, { status: 400 });
		}

		const body = await request.json();
		const validation = createInvoiceSchema.partial().safeParse(body);

		if (!validation.success) {
			return NextResponse.json(
				{ error: "Validation failed", details: validation.error.flatten() },
				{ status: 400 }
			);
		}

		const supabase = await createClient();

		const { data: invoice, error } = await supabase
			.from("invoices")
			.update(validation.data)
			.eq("id", id)
			.select()
			.single();

		if (error) {
			console.error("Error updating invoice:", error);
			return NextResponse.json({ error: "Failed to update invoice" }, { status: 500 });
		}

		return NextResponse.json(invoice);
	} catch (error) {
		console.error("Invoice PATCH error:", error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
	try {
		const admin = await isAdmin();
		if (!admin) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { id } = await params;
		if (!id) {
			return NextResponse.json({ error: "Invoice ID is required" }, { status: 400 });
		}

		const supabase = await createClient();

		const { data: invoice, error: findError } = await supabase
			.from("invoices")
			.select("id, file_path")
			.eq("id", id)
			.single();

		if (findError || !invoice) {
			return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
		}

		if (invoice.file_path) {
			const { error: storageError } = await supabase.storage
				.from("invoices")
				.remove([invoice.file_path]);

			if (storageError) {
				console.error("Error deleting invoice file:", storageError);
			}
		}

		const { error: deleteError } = await supabase
			.from("invoices")
			.delete()
			.eq("id", id);

		if (deleteError) {
			console.error("Error deleting invoice:", deleteError);
			return NextResponse.json({ error: "Failed to delete invoice" }, { status: 500 });
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Invoice DELETE error:", error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}
