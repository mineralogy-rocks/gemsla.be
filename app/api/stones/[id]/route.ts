import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/supabase/admin";
import { updateStoneSchema } from "../types";

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
			return NextResponse.json({ error: "Stone ID is required" }, { status: 400 });
		}

		const supabase = await createClient();

		const { data: stone, error } = await supabase
			.from("stones")
			.select("*, invoices(*)")
			.eq("id", id)
			.single();

		if (error || !stone) {
			return NextResponse.json({ error: "Stone not found" }, { status: 404 });
		}

		if (stone.invoices?.file_path) {
			const { data: urlData } = await supabase.storage
				.from("invoices")
				.createSignedUrl(stone.invoices.file_path, 3600);
			stone.invoices.signed_url = urlData?.signedUrl || null;
		}

		return NextResponse.json(stone);
	} catch (error) {
		console.error("Stone GET error:", error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
	try {
		const admin = await isAdmin();
		if (!admin) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { id } = await params;
		if (!id) {
			return NextResponse.json({ error: "Stone ID is required" }, { status: 400 });
		}

		const body = await request.json();
		const validation = updateStoneSchema.safeParse(body);

		if (!validation.success) {
			return NextResponse.json(
				{ error: "Validation failed", details: validation.error.flatten() },
				{ status: 400 }
			);
		}

		const supabase = await createClient();

		const { data: existing, error: findError } = await supabase
			.from("stones")
			.select("id")
			.eq("id", id)
			.single();

		if (findError || !existing) {
			return NextResponse.json({ error: "Stone not found" }, { status: 404 });
		}

		const { data: stone, error: updateError } = await supabase
			.from("stones")
			.update(validation.data)
			.eq("id", id)
			.select("*, invoices(*)")
			.single();

		if (updateError) {
			console.error("Error updating stone:", updateError);
			return NextResponse.json({ error: "Failed to update stone" }, { status: 500 });
		}

		return NextResponse.json(stone);
	} catch (error) {
		console.error("Stone PUT error:", error);
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
			return NextResponse.json({ error: "Stone ID is required" }, { status: 400 });
		}

		const supabase = await createClient();

		const { data: stone, error: findError } = await supabase
			.from("stones")
			.select("id")
			.eq("id", id)
			.single();

		if (findError || !stone) {
			return NextResponse.json({ error: "Stone not found" }, { status: 404 });
		}

		const { error: deleteError } = await supabase
			.from("stones")
			.delete()
			.eq("id", id);

		if (deleteError) {
			console.error("Error deleting stone:", deleteError);
			return NextResponse.json({ error: "Failed to delete stone" }, { status: 500 });
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Stone DELETE error:", error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}
