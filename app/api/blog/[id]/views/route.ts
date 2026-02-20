import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface RouteParams {
	params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
	try {
		const { id } = await params;
		const supabase = await createClient();

		const { error } = await supabase.rpc("increment_blog_post_views", {
			post_id: id,
		});

		if (error) {
			console.error("Error incrementing views:", error);
			return NextResponse.json(
				{ error: "Failed to increment views" },
				{ status: 500 }
			);
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Blog views POST error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
