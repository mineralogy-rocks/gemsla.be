import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAdminUser } from "@/lib/supabase/admin";
import { ReportFormClient } from "../../add/ReportFormClient";
import type { Report } from "../../../api/reports/types";

interface PageProps {
	params: Promise<{ uuid: string }>;
}

export async function generateMetadata({ params }: PageProps) {
	const { uuid } = await params;
	const supabase = await createClient();

	const { data: report } = await supabase
		.from("reports")
		.select("title")
		.eq("id", uuid)
		.single();

	if (!report) {
		return {
			title: "Report Not Found | GemsLaBe",
		};
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

	if (!uuid) {
		notFound();
	}

	const supabase = await createClient();

	// Fetch report with images
	const { data: report, error } = await supabase
		.from("reports")
		.select("*, report_images(*)")
		.eq("id", uuid)
		.single();

	if (error || !report) {
		notFound();
	}

	// Sort images by display_order
	if (report.report_images) {
		report.report_images.sort((a: { display_order: number }, b: { display_order: number }) =>
			a.display_order - b.display_order
		);
	}

	return <ReportFormClient mode="edit" initialData={report as Report} />;
}
