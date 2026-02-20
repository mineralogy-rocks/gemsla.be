import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAdminUser } from "@/lib/supabase/admin";
import { generateSignedImageUrls } from "../../../api/reports/storage-utils";
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

	return report as Report;
});

export async function generateMetadata({ params }: PageProps) {
	const { uuid } = await params;
	const report = await getReport(uuid);

	if (!report) {
		return { title: "Report Not Found" };
	}

	return {
		title: `Edit ${report.title}`,
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
