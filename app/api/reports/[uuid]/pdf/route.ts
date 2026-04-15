import { NextResponse } from "next/server";
import QRCode from "qrcode";

import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/supabase/admin";
import { generateSignedImageUrls } from "@/app/api/reports/storage-utils";
import { generateReportPdf } from "@/app/lib/pdf/generateReportPdf";
import type { Report, ReportImage } from "@/app/api/reports/types";
import { ADMIN_ONLY_FIELDS } from "@/app/api/reports/types";

const BASE_URL = "https://gemsla.be";

interface RouteParams {
	params: Promise<{ uuid: string }>;
}


export async function GET(_request: Request, { params }: RouteParams) {
	try {
		const { uuid } = await params;
		if (!uuid) {
			return NextResponse.json({ error: "Missing report ID" }, { status: 400 });
		}

		const [supabase, admin] = await Promise.all([createClient(), isAdmin()]);

		const { data: report, error } = await supabase
			.from("reports")
			.select("*, report_images(*)")
			.eq("id", uuid)
			.single();

		if (error || !report) {
			return NextResponse.json({ error: "Report not found" }, { status: 404 });
		}

		if (!report.public && !admin) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		if (report.report_images) {
			report.report_images.sort(
				(a: { display_order: number }, b: { display_order: number }) =>
					a.display_order - b.display_order,
			);

			const paths = report.report_images.map(
				(img: { image_url: string }) => img.image_url,
			);
			const signedUrls = await generateSignedImageUrls(supabase, paths);
			report.report_images = report.report_images.map(
				(img: { image_url: string }) => ({
					...img,
					signed_url: signedUrls.get(img.image_url) || null,
				}),
			);
		}

		const sanitizedReport = admin
			? (report as Report)
			: (() => {
				const r = { ...report };
				for (const field of ADMIN_ONLY_FIELDS) {
					(r as Record<string, unknown>)[field] = null;
				}
				return r as Report;
			})();

		const images = (sanitizedReport.report_images || []) as ReportImage[];
		const imageBuffers = new Map<string, { bytes: Uint8Array; mimeType: string }>();

		await Promise.all(
			images.map(async (img) => {
				if (!img.signed_url) return;
				try {
					const response = await fetch(img.signed_url);
					if (!response.ok) return;
					const arrayBuffer = await response.arrayBuffer();
					const contentType = response.headers.get("content-type") || "image/jpeg";
					imageBuffers.set(img.id, {
						bytes: new Uint8Array(arrayBuffer),
						mimeType: contentType,
					});
				} catch {
					// skip failed image fetches
				}
			}),
		);

		const reportUrl = `${BASE_URL}/reports/${sanitizedReport.id}`;
		const qrPngBytes = await QRCode.toBuffer(reportUrl, {
			width: 240,
			margin: 0,
			errorCorrectionLevel: "M",
		});

		const pdfBytes = await generateReportPdf(sanitizedReport, imageBuffers, new Uint8Array(qrPngBytes));

		const filename = sanitizedReport.title
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/^-|-$/g, "");

		return new NextResponse(Buffer.from(pdfBytes), {
			headers: {
				"Content-Type": "application/pdf",
				"Content-Disposition": `attachment; filename="${filename}.pdf"`,
			},
		});
	} catch (error) {
		console.error("PDF generation error:", error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}
