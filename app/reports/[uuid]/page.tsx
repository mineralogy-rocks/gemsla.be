import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/supabase/admin";
import { ReportDetailClient } from "./ReportDetailClient";
import type { Report } from "../../api/reports/types";

interface PageProps {
	params: Promise<{ uuid: string }>;
}

export async function generateMetadata({ params }: PageProps) {
	const { uuid } = await params;
	const supabase = await createClient();

	const { data: report } = await supabase
		.from("reports")
		.select("title, first_name, last_name")
		.eq("id", uuid)
		.single();

	if (!report) {
		return {
			title: "Report Not Found | GemsLaBe",
		};
	}

	return {
		title: `${report.title} | GemsLaBe`,
		description: `Gem report for ${report.first_name} ${report.last_name}`,
	};
}

export default async function ReportDetailPage({ params }: PageProps) {
	const { uuid } = await params;

	if (!uuid) {
		notFound();
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
		notFound();
	}

	// Check access: admin can view all, public can only view public reports
	if (!report.public && !admin) {
		notFound();
	}

	// Sort images by display_order
	if (report.report_images) {
		report.report_images.sort((a: { display_order: number }, b: { display_order: number }) =>
			a.display_order - b.display_order
		);
	}

	return <ReportDetailClient report={report as Report} isAdmin={admin} />;
}
