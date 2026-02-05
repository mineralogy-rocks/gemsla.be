import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/supabase/admin";
import { updateReportSchema } from "../types";
import { moveImagesToReportFolder } from "../storage-utils";

interface RouteParams {
	params: Promise<{ uuid: string }>;
}

/**
 * GET /api/reports/[uuid]
 * Get a single report (public if report.public=true, otherwise admin only)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
	try {
		const { uuid } = await params;

		if (!uuid) {
			return NextResponse.json(
				{ error: "Report ID is required" },
				{ status: 400 }
			);
		}

		const supabase = await createClient();
		const admin = await isAdmin();

		// Fetch report with images
		const { data: report, error } = await supabase
			.from("reports")
			.select("*, report_images(*)")
			.eq("id", uuid)
			.single();

		if (error || !report) {
			return NextResponse.json(
				{ error: "Report not found" },
				{ status: 404 }
			);
		}

		// Check access: admin can view all, public can only view public reports
		if (!report.public && !admin) {
			return NextResponse.json(
				{ error: "Access denied" },
				{ status: 403 }
			);
		}

		// Sort images by display_order
		if (report.report_images) {
			report.report_images.sort((a: { display_order: number }, b: { display_order: number }) =>
				a.display_order - b.display_order
			);
		}

		return NextResponse.json(report);
	} catch (error) {
		console.error("Report GET error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}

/**
 * PATCH /api/reports/[uuid]
 * Update a report (admin only)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
	try {
		const admin = await isAdmin();
		if (!admin) {
			return NextResponse.json(
				{ error: "Unauthorized" },
				{ status: 401 }
			);
		}

		const { uuid } = await params;

		if (!uuid) {
			return NextResponse.json(
				{ error: "Report ID is required" },
				{ status: 400 }
			);
		}

		const body = await request.json();
		const validation = updateReportSchema.safeParse(body);

		if (!validation.success) {
			return NextResponse.json(
				{ error: "Validation failed", details: validation.error.flatten() },
				{ status: 400 }
			);
		}

		const { images, ...reportData } = validation.data;

		const supabase = await createClient();

		// Check if report exists
		const { data: existingReport, error: findError } = await supabase
			.from("reports")
			.select("id")
			.eq("id", uuid)
			.single();

		if (findError || !existingReport) {
			return NextResponse.json(
				{ error: "Report not found" },
				{ status: 404 }
			);
		}

		// Update report if there are fields to update
		if (Object.keys(reportData).length > 0) {
			const { error: updateError } = await supabase
				.from("reports")
				.update(reportData)
				.eq("id", uuid);

			if (updateError) {
				console.error("Error updating report:", updateError);
				return NextResponse.json(
					{ error: "Failed to update report" },
					{ status: 500 }
				);
			}
		}

		// Handle images if provided
		if (images !== undefined) {
			// Delete existing images
			const { error: deleteImagesError } = await supabase
				.from("report_images")
				.delete()
				.eq("report_id", uuid);

			if (deleteImagesError) {
				console.error("Error deleting images:", deleteImagesError);
			}

			// Insert new images
			if (images.length > 0) {
				const imageRecords = images.map((img, index) => ({
					report_id: uuid,
					image_url: img.image_url,
					display_order: img.display_order ?? index,
				}));

				const { error: insertImagesError } = await supabase
					.from("report_images")
					.insert(imageRecords);

				if (insertImagesError) {
					console.error("Error inserting images:", insertImagesError);
				}

				// Move images from temp/ to report folder
				const tempImageUrls = images
					.map((img) => img.image_url)
					.filter((url) => url.includes("/temp/"));

				if (tempImageUrls.length > 0) {
					const urlMap = await moveImagesToReportFolder(
						supabase,
						uuid,
						tempImageUrls
					);

					for (const [oldUrl, newUrl] of urlMap) {
						await supabase
							.from("report_images")
							.update({ image_url: newUrl })
							.eq("report_id", uuid)
							.eq("image_url", oldUrl);
					}
				}
			}
		}

		// Fetch updated report with images
		const { data: updatedReport, error: fetchError } = await supabase
			.from("reports")
			.select("*, report_images(*)")
			.eq("id", uuid)
			.single();

		if (fetchError) {
			return NextResponse.json(
				{ error: "Failed to fetch updated report" },
				{ status: 500 }
			);
		}

		// Sort images by display_order
		if (updatedReport.report_images) {
			updatedReport.report_images.sort((a: { display_order: number }, b: { display_order: number }) =>
				a.display_order - b.display_order
			);
		}

		return NextResponse.json(updatedReport);
	} catch (error) {
		console.error("Report PATCH error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}

/**
 * DELETE /api/reports/[uuid]
 * Delete a report and its images (admin only)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
	try {
		const admin = await isAdmin();
		if (!admin) {
			return NextResponse.json(
				{ error: "Unauthorized" },
				{ status: 401 }
			);
		}

		const { uuid } = await params;

		if (!uuid) {
			return NextResponse.json(
				{ error: "Report ID is required" },
				{ status: 400 }
			);
		}

		const supabase = await createClient();

		// Get report with images to delete storage files
		const { data: report, error: findError } = await supabase
			.from("reports")
			.select("*, report_images(*)")
			.eq("id", uuid)
			.single();

		if (findError || !report) {
			return NextResponse.json(
				{ error: "Report not found" },
				{ status: 404 }
			);
		}

		// Delete storage files for images
		if (report.report_images && report.report_images.length > 0) {
			const filePaths = report.report_images
				.map((img: { image_url: string }) => {
					// Extract path from full URL
					const url = new URL(img.image_url);
					const pathMatch = url.pathname.match(/\/storage\/v1\/object\/public\/reports\/(.+)/);
					return pathMatch ? pathMatch[1] : null;
				})
				.filter(Boolean);

			if (filePaths.length > 0) {
				const { error: storageError } = await supabase.storage
					.from("reports")
					.remove(filePaths);

				if (storageError) {
					console.error("Error deleting storage files:", storageError);
					// Continue with report deletion even if storage cleanup fails
				}
			}
		}

		// Delete report (images will be cascade deleted)
		const { error: deleteError } = await supabase
			.from("reports")
			.delete()
			.eq("id", uuid);

		if (deleteError) {
			console.error("Error deleting report:", deleteError);
			return NextResponse.json(
				{ error: "Failed to delete report" },
				{ status: 500 }
			);
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Report DELETE error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
