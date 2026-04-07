import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/supabase/admin";
import { createInvoiceSchema } from "@/app/api/stones/types";

export async function GET(request: NextRequest) {
	try {
		const admin = await isAdmin();
		if (!admin) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const searchParams = request.nextUrl.searchParams;
		const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
		const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));

		const supabase = await createClient();

		const offset = (page - 1) * limit;
		const { data, count, error } = await supabase
			.from("invoices")
			.select("*, stones(count)", { count: "exact" })
			.order("created_at", { ascending: false })
			.range(offset, offset + limit - 1);

		if (error) {
			console.error("Error fetching invoices:", error);
			return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 });
		}

		const items = (data || []).map(({ stones, ...invoice }) => ({
			...invoice,
			stone_count: stones?.[0]?.count ?? 0,
		}));

		return NextResponse.json({
			data: items,
			total: count || 0,
			page,
			limit,
			totalPages: Math.ceil((count || 0) / limit),
		});
	} catch (error) {
		console.error("Invoices GET error:", error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}

export async function POST(request: NextRequest) {
	try {
		const admin = await isAdmin();
		if (!admin) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const contentType = request.headers.get("content-type") || "";
		const supabase = await createClient();

		if (contentType.includes("multipart/form-data")) {
			const formData = await request.formData();
			const file = formData.get("file") as File | null;

			if (!file || file.type !== "application/pdf") {
				return NextResponse.json({ error: "PDF file is required" }, { status: 400 });
			}

			const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
			const filePath = `uploads/${fileName}`;

			const arrayBuffer = await file.arrayBuffer();
			const { error: uploadError } = await supabase.storage
				.from("invoices")
				.upload(filePath, arrayBuffer, {
					contentType: "application/pdf",
					upsert: false,
				});

			if (uploadError) {
				console.error("Error uploading invoice:", uploadError);
				return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
			}

			const invoiceData: Record<string, unknown> = { file_path: filePath };
			const invoiceNumber = formData.get("invoice_number");
			const originalInvoiceNumber = formData.get("original_invoice_number");
			const supplier = formData.get("supplier");
			const invoiceDate = formData.get("invoice_date");
			const priceUsd = formData.get("price_usd");
			const priceEur = formData.get("price_eur");
			const vatUsd = formData.get("vat_usd");
			const vatEur = formData.get("vat_eur");
			const notes = formData.get("notes");

			if (invoiceNumber) invoiceData.invoice_number = invoiceNumber;
			if (originalInvoiceNumber) invoiceData.original_invoice_number = originalInvoiceNumber;
			if (supplier) invoiceData.supplier = supplier;
			if (invoiceDate) invoiceData.invoice_date = invoiceDate;
			if (priceUsd) invoiceData.price_usd = parseFloat(priceUsd as string);
			if (priceEur) invoiceData.price_eur = parseFloat(priceEur as string);
			if (vatUsd) invoiceData.vat_usd = parseFloat(vatUsd as string);
			if (vatEur) invoiceData.vat_eur = parseFloat(vatEur as string);
			if (notes) invoiceData.notes = notes;

			const { data: invoice, error: insertError } = await supabase
				.from("invoices")
				.insert(invoiceData)
				.select()
				.single();

			if (insertError) {
				console.error("Error creating invoice:", insertError);
				await supabase.storage.from("invoices").remove([filePath]);
				return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 });
			}

			return NextResponse.json(invoice, { status: 201 });
		}

		const body = await request.json();
		const validation = createInvoiceSchema.safeParse(body);

		if (!validation.success) {
			return NextResponse.json(
				{ error: "Validation failed", details: validation.error.flatten() },
				{ status: 400 }
			);
		}

		const { data: invoice, error: insertError } = await supabase
			.from("invoices")
			.insert(validation.data)
			.select()
			.single();

		if (insertError) {
			console.error("Error creating invoice:", insertError);
			return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 });
		}

		return NextResponse.json(invoice, { status: 201 });
	} catch (error) {
		console.error("Invoices POST error:", error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}
