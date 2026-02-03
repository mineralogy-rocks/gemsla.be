import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAdminUser } from "@/lib/supabase/admin";
import { ReportFormClient } from "../../add/ReportFormClient";
import type { Report } from "../../../api/reports/types";

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
		title: `Edit ${report.title} | GemsLaBe`,
		description: "Edit gem lab report",
	};
}

export default async function EditReportPage({ params }: PageProps) {
	const adminUser = await getAdminUser();

	if (!adminUser) {
		redirect("/auth/sign-in");
	}

	const { uuid } = await params;
	if (!uuid) notFound();

	const report = await getReport(uuid);
	if (!report) notFound();

	return <ReportFormClient mode="edit" initialData={report} />;
}
