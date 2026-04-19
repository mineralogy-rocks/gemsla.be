/**
 * SINGLE-WRITER INVARIANT: reports.stone_id is owned by exactly two routes:
 *   - PATCH /api/reports/[uuid]           (this file; report-side link)
 *   - PUT   /api/stones/[id]/linked-report (stone-side link)
 * Both write to the same column (reports.stone_id). No other route or trigger
 * mutates it. Keep both handlers aligned on schema, 23505 handling, and admin
 * gating.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/supabase/admin";
import { updateReportSchema, ADMIN_ONLY_FIELDS } from "../types";
import { moveImagesToReportFolder, generateSignedImageUrls } from "../storage-utils";

interface PgErrorLike {
	code?: string;
	message?: string;
	details?: string;
	constraint?: string;
}

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

			// Generate signed URLs
			const paths = report.report_images.map(
				(img: { image_url: string }) => img.image_url
			);
			const signedUrls = await generateSignedImageUrls(supabase, paths);
			report.report_images = report.report_images.map(
				(img: { image_url: string }) => ({
					...img,
					signed_url: signedUrls.get(img.image_url) || null,
				})
			);
		}

		// Strip admin-only fields for non-admin users
		if (!admin) {
			for (const field of ADMIN_ONLY_FIELDS) {
				delete report[field];
			}
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

		// Resolve owner_id if owner_email is being updated
		if (reportData.owner_email) {
			const { data: userId } = await supabase.rpc("get_user_id_by_email", {
				lookup_email: reportData.owner_email,
			});
			(reportData as Record<string, unknown>).owner_id = userId || null;
		}

		// Update report if there are fields to update
		if (Object.keys(reportData).length > 0) {
			const { error: updateError } = await supabase
				.from("reports")
				.update(reportData)
				.eq("id", uuid);

			if (updateError) {
				const pg = updateError as PgErrorLike;
				if (
					pg.code === "23505" &&
					(pg.constraint === "reports_stone_id_unique" ||
						(pg.message && pg.message.includes("reports_stone_id_unique")))
				) {
					const stoneIdValue = (reportData as Record<string, unknown>).stone_id;
					let conflictingId: string | null = null;
					let conflictingTitle: string | null = null;
					if (typeof stoneIdValue === "string" && stoneIdValue.length > 0) {
						const { data: conflict } = await supabase
							.from("reports")
							.select("id, title")
							.eq("stone_id", stoneIdValue)
							.neq("id", uuid)
							.maybeSingle();
						if (conflict) {
							conflictingId = conflict.id;
							conflictingTitle = conflict.title;
						}
					}
					return NextResponse.json(
						{
							error: "STONE_ALREADY_LINKED",
							linked_report_id: conflictingId,
							linked_report_title: conflictingTitle,
						},
						{ status: 409 }
					);
				}

				if (pg.code === "23503") {
					return NextResponse.json(
						{ error: "Not found" },
						{ status: 404 }
					);
				}

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
					title: img.title || null,
					caption: img.caption || null,
					is_headline: img.is_headline || false,
				}));

				const { error: insertImagesError } = await supabase
					.from("report_images")
					.insert(imageRecords);

				if (insertImagesError) {
					console.error("Error inserting images:", insertImagesError);
				}

				// Move images from temp/ to report folder
				const tempPaths = images
					.map((img) => img.image_url)
					.filter((path) => path.startsWith("temp/"));

				if (tempPaths.length > 0) {
					const pathMap = await moveImagesToReportFolder(
						supabase,
						uuid,
						tempPaths
					);

					for (const [oldPath, newPath] of pathMap) {
						await supabase
							.from("report_images")
							.update({ image_url: newPath })
							.eq("report_id", uuid)
							.eq("image_url", oldPath);
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

		// Sort images by display_order and generate signed URLs
		if (updatedReport.report_images) {
			updatedReport.report_images.sort((a: { display_order: number }, b: { display_order: number }) =>
				a.display_order - b.display_order
			);

			const paths = updatedReport.report_images.map(
				(img: { image_url: string }) => img.image_url
			);
			const signedUrls = await generateSignedImageUrls(supabase, paths);
			updatedReport.report_images = updatedReport.report_images.map(
				(img: { image_url: string }) => ({
					...img,
					signed_url: signedUrls.get(img.image_url) || null,
				})
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

		// Delete storage files for images (image_url is now a storage path)
		if (report.report_images && report.report_images.length > 0) {
			const filePaths = report.report_images
				.map((img: { image_url: string }) => img.image_url)
				.filter(Boolean);

			if (filePaths.length > 0) {
				const { error: storageError } = await supabase.storage
					.from("reports")
					.remove(filePaths);

				if (storageError) {
					console.error("Error deleting storage files:", storageError);
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
