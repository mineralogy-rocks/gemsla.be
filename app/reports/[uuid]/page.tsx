import { cache } from "react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/supabase/admin";
import { generateSignedImageUrls } from "../../api/reports/storage-utils";
import { ReportDetailClient } from "./ReportDetailClient";
import type { Report } from "../../api/reports/types";
import { ADMIN_ONLY_FIELDS } from "../../api/reports/types";

interface PageProps {
	params: Promise<{ uuid: string }>;
}

const getReport = cache(async (uuid: string) => {
	const supabase = await createClient();
	const { data: report, error } = await supabase
		.from("reports")
		.select("*, report_images(*)")
		.eq("id", uuid)
		.single();

	if (error || !report) return null;

	if (report.report_images) {
		report.report_images.sort(
			(a: { display_order: number }, b: { display_order: number }) =>
				a.display_order - b.display_order
		);

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

	const sanitizedReport = admin
		? report
		: (() => {
			const r = { ...report };
			for (const field of ADMIN_ONLY_FIELDS) {
				(r as Record<string, unknown>)[field] = null;
			}
			return r;
		})();

	return <ReportDetailClient report={sanitizedReport} isAdmin={admin} />;
}
