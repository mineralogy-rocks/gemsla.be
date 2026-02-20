import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/supabase/admin";
import { createBlogTagSchema } from "../types";

export async function GET() {
	try {
		const supabase = await createClient();

		const { data, error } = await supabase
			.from("blog_tags")
			.select("*")
			.order("name", { ascending: true });

		if (error) {
			console.error("Error fetching blog tags:", error);
			return NextResponse.json(
				{ error: "Failed to fetch tags" },
				{ status: 500 }
			);
		}

		return NextResponse.json(data || []);
	} catch (error) {
		console.error("Blog tags GET error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}

export async function POST(request: NextRequest) {
	try {
		const admin = await isAdmin();
		if (!admin) {
			return NextResponse.json(
				{ error: "Unauthorized" },
				{ status: 401 }
			);
		}

		const body = await request.json();
		const validation = createBlogTagSchema.safeParse(body);

		if (!validation.success) {
			return NextResponse.json(
				{ error: "Validation failed", details: validation.error.flatten() },
				{ status: 400 }
			);
		}

		const supabase = await createClient();

		const { data: tag, error } = await supabase
			.from("blog_tags")
			.insert(validation.data)
			.select()
			.single();

		if (error) {
			if (error.code === "23505") {
				return NextResponse.json(
					{ error: "A tag with this name or slug already exists" },
					{ status: 409 }
				);
			}
			console.error("Error creating blog tag:", error);
			return NextResponse.json(
				{ error: "Failed to create tag" },
				{ status: 500 }
			);
		}

		return NextResponse.json(tag, { status: 201 });
	} catch (error) {
		console.error("Blog tags POST error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
