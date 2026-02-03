import { cache } from "react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/supabase/admin";
import { ReportDetailClient } from "./ReportDetailClient";
import type { Report } from "../../api/reports/types";

interface PageProps {
	params: Promise<{ uuid: string }>;
}

// Cached query - runs once per request even if called multiple times
const getReport = cache(async (uuid: string) => {
	const supabase = await createClient();
	const { data: report, error } = await supabase
		.from("reports")
		.select("*, report_images(*)")
		.eq("id", uuid)
		.single();

	if (error || !report) return null;

	// Sort images by display_order
	if (report.report_images) {
		report.report_images.sort(
			(a: { display_order: number }, b: { display_order: number }) =>
				a.display_order - b.display_order
		);
	}

	return report as Report;
});

export async function generateMetadata({ params }: PageProps) {
	const { uuid } = await params;
	const report = await getReport(uuid);

	if (!report) {
		return { title: "Report Not Found | GemsLaBe" };
	}

	return {
		title: `${report.title} | GemsLaBe`,
		description: `Gem report for ${report.first_name} ${report.last_name}`,
	};
}

export default async function ReportDetailPage({ params }: PageProps) {
	const { uuid } = await params;
	if (!uuid) notFound();

	const [report, admin] = await Promise.all([getReport(uuid), isAdmin()]);

	if (!report) notFound();
	if (!report.public && !admin) notFound();

	return <ReportDetailClient report={report} isAdmin={admin} />;
}
