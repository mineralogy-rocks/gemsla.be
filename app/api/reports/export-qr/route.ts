import { NextResponse } from "next/server";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/supabase/admin";

const BASE_URL = "https://gemsla.be";

const A4_WIDTH = 595;
const A4_HEIGHT = 842;
const MARGIN = 28;
const COLS = 4;
const ROWS = 8;
const LABEL_WIDTH = (A4_WIDTH - 2 * MARGIN) / COLS;
const LABEL_HEIGHT = (A4_HEIGHT - 2 * MARGIN) / ROWS;
const QR_SIZE = 48;

export async function GET() {
	try {
		const admin = await isAdmin();
		if (!admin) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const supabase = await createClient();
		const { data: reports, error } = await supabase
			.from("reports")
			.select("id, title, stone")
			.eq("public", true)
			.order("created_at", { ascending: false });

		if (error) {
			console.error("Error fetching reports:", error);
			return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
		}

		if (!reports || reports.length === 0) {
			return NextResponse.json({ error: "No public reports found" }, { status: 404 });
		}

		const qrBuffers = await Promise.all(
			reports.map((report) =>
				QRCode.toBuffer(`${BASE_URL}/reports/${report.id}`, {
					width: QR_SIZE * 4,
					margin: 0,
					errorCorrectionLevel: "M",
				})
			)
		);

		const pdf = await PDFDocument.create();
		const font = await pdf.embedFont(StandardFonts.Helvetica);
		const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
		const borderColor = rgb(0.8, 0.8, 0.8);
		const grayText = rgb(0.4, 0.4, 0.4);

		const labelsPerPage = COLS * ROWS;
		const totalPages = Math.ceil(reports.length / labelsPerPage);

		for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
			const page = pdf.addPage([A4_WIDTH, A4_HEIGHT]);
			const startIdx = pageIdx * labelsPerPage;
			const endIdx = Math.min(startIdx + labelsPerPage, reports.length);

			for (let i = startIdx; i < endIdx; i++) {
				const localIdx = i - startIdx;
				const col = localIdx % COLS;
				const row = Math.floor(localIdx / COLS);

				const x = MARGIN + col * LABEL_WIDTH;
				const y = A4_HEIGHT - MARGIN - (row + 1) * LABEL_HEIGHT;

				page.drawRectangle({
					x,
					y,
					width: LABEL_WIDTH,
					height: LABEL_HEIGHT,
					borderColor,
					borderWidth: 0.5,
				});

				const qrImage = await pdf.embedPng(qrBuffers[i]);
				const qrX = x + (LABEL_WIDTH - QR_SIZE) / 2;
				const qrY = y + LABEL_HEIGHT - QR_SIZE - 6;
				page.drawImage(qrImage, { x: qrX, y: qrY, width: QR_SIZE, height: QR_SIZE });

				const titleLines = wrapText(reports[i].title || "Untitled", fontBold, 7, LABEL_WIDTH - 8, 2);
				let textY = qrY - 9;
				for (const line of titleLines) {
					const lineWidth = fontBold.widthOfTextAtSize(line, 7);
					page.drawText(line, {
						x: x + (LABEL_WIDTH - lineWidth) / 2,
						y: textY,
						size: 7,
						font: fontBold,
						color: rgb(0, 0, 0),
					});
					textY -= 9;
				}

				if (reports[i].stone) {
					const stoneLines = wrapText(reports[i].stone!, font, 6, LABEL_WIDTH - 8, 1);
					for (const line of stoneLines) {
						const lineWidth = font.widthOfTextAtSize(line, 6);
						page.drawText(line, {
							x: x + (LABEL_WIDTH - lineWidth) / 2,
							y: textY,
							size: 6,
							font,
							color: grayText,
						});
						textY -= 8;
					}
				}
			}
		}

		const pdfBytes = await pdf.save();

		return new NextResponse(pdfBytes, {
			headers: {
				"Content-Type": "application/pdf",
				"Content-Disposition": 'attachment; filename="qr-codes.pdf"',
			},
		});
	} catch (error) {
		console.error("Export QR error:", error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}

type FontLike = { widthOfTextAtSize: (text: string, size: number) => number };

function wrapText(text: string, font: FontLike, size: number, maxWidth: number, maxLines: number): string[] {
	const words = text.split(/\s+/);
	const lines: string[] = [];
	let current = "";

	for (const word of words) {
		const test = current ? `${current} ${word}` : word;
		if (font.widthOfTextAtSize(test, size) <= maxWidth) {
			current = test;
		} else {
			if (current) lines.push(current);
			current = word;
		}
		if (lines.length === maxLines) {
			current = "";
			break;
		}
	}
	if (current) lines.push(current);

	if (lines.length > maxLines) {
		lines.length = maxLines;
	}

	const last = lines[lines.length - 1];
	const allText = words.join(" ");
	if (font.widthOfTextAtSize(allText, size) > maxWidth * maxLines && last) {
		let truncated = last;
		while (truncated.length > 0 && font.widthOfTextAtSize(truncated + "...", size) > maxWidth) {
			truncated = truncated.slice(0, -1);
		}
		lines[lines.length - 1] = truncated + "...";
	}

	return lines.length > 0 ? lines : [text.slice(0, 10)];
}
