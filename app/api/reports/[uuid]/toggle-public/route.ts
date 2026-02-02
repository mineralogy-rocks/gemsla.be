import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/supabase/admin";

interface RouteParams {
	params: Promise<{ uuid: string }>;
}

/**
 * PATCH /api/reports/[uuid]/toggle-public
 * Toggle the public status of a report (admin only)
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

		const supabase = await createClient();

		// Get current public status
		const { data: report, error: findError } = await supabase
			.from("reports")
			.select("id, public")
			.eq("id", uuid)
			.single();

		if (findError || !report) {
			return NextResponse.json(
				{ error: "Report not found" },
				{ status: 404 }
			);
		}

		// Toggle public status
		const newPublicStatus = !report.public;

		const { data: updatedReport, error: updateError } = await supabase
			.from("reports")
			.update({ public: newPublicStatus })
			.eq("id", uuid)
			.select("*, report_images(*)")
			.single();

		if (updateError) {
			console.error("Error toggling public status:", updateError);
			return NextResponse.json(
				{ error: "Failed to toggle public status" },
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
		console.error("Toggle public error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
