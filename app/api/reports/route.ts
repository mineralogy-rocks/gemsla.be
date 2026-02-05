import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/supabase/admin";
import { createReportSchema, type PaginatedReportsResponse } from "./types";
import { moveImagesToReportFolder } from "./storage-utils";

/**
 * GET /api/reports
 * List all reports with pagination (admin only)
 */
export async function GET(request: NextRequest) {
	try {
		const admin = await isAdmin();
		if (!admin) {
			return NextResponse.json(
				{ error: "Unauthorized" },
				{ status: 401 }
			);
		}

		const searchParams = request.nextUrl.searchParams;
		const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
		const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)));
		const search = searchParams.get("search") || "";
		const filter = searchParams.get("filter") || "all"; // all, public, private

		const supabase = await createClient();

		// Build query
		let query = supabase
			.from("reports")
			.select("*, report_images(*)", { count: "exact" });

		// Apply search filter
		if (search) {
			query = query.or(
				`title.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%,owner_email.ilike.%${search}%`
			);
		}

		// Apply public/private filter
		if (filter === "public") {
			query = query.eq("public", true);
		} else if (filter === "private") {
			query = query.eq("public", false);
		}

		// Get total count and paginated data
		const offset = (page - 1) * limit;
		const { data, count, error } = await query
			.order("created_at", { ascending: false })
			.range(offset, offset + limit - 1);

		if (error) {
			console.error("Error fetching reports:", error);
			return NextResponse.json(
				{ error: "Failed to fetch reports" },
				{ status: 500 }
			);
		}

		const response: PaginatedReportsResponse = {
			data: data || [],
			total: count || 0,
			page,
			limit,
			totalPages: Math.ceil((count || 0) / limit),
		};

		return NextResponse.json(response);
	} catch (error) {
		console.error("Reports GET error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}

/**
 * POST /api/reports
 * Create a new report (admin only)
 */
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
		const validation = createReportSchema.safeParse(body);

		if (!validation.success) {
			return NextResponse.json(
				{ error: "Validation failed", details: validation.error.flatten() },
				{ status: 400 }
			);
		}

		const { images, ...reportData } = validation.data;

		const supabase = await createClient();

		// Get current user ID
		const { data: { user } } = await supabase.auth.getUser();

		// Create report
		const { data: report, error: reportError } = await supabase
			.from("reports")
			.insert({
				...reportData,
				owner_id: user?.id || null,
			})
			.select()
			.single();

		if (reportError) {
			console.error("Error creating report:", reportError);
			return NextResponse.json(
				{ error: "Failed to create report" },
				{ status: 500 }
			);
		}

		// Create report images if provided
		if (images && images.length > 0) {
			const imageRecords = images.map((img, index) => ({
				report_id: report.id,
				image_url: img.image_url,
				display_order: img.display_order ?? index,
			}));

			const { error: imagesError } = await supabase
				.from("report_images")
				.insert(imageRecords);

			if (imagesError) {
				console.error("Error creating report images:", imagesError);
			}

			// Move images from temp/ to report folder
			const tempImageUrls = images
				.map((img) => img.image_url)
				.filter((url) => url.includes("/temp/"));

			if (tempImageUrls.length > 0) {
				const urlMap = await moveImagesToReportFolder(
					supabase,
					report.id,
					tempImageUrls
				);

				for (const [oldUrl, newUrl] of urlMap) {
					await supabase
						.from("report_images")
						.update({ image_url: newUrl })
						.eq("report_id", report.id)
						.eq("image_url", oldUrl);
				}
			}
		}

		// Fetch complete report with images
		const { data: completeReport, error: fetchError } = await supabase
			.from("reports")
			.select("*, report_images(*)")
			.eq("id", report.id)
			.single();

		if (fetchError) {
			return NextResponse.json(report, { status: 201 });
		}

		return NextResponse.json(completeReport, { status: 201 });
	} catch (error) {
		console.error("Reports POST error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
