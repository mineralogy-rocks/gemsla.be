import fs from "fs/promises";
import path from "path";
import { PDFDocument, PDFFont, PDFPage, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

import type { Report } from "@/app/api/reports/types";

const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;
const MARGIN_X = 50;
const MARGIN_TOP = 50;
const CONTENT_WIDTH = A4_WIDTH - 2 * MARGIN_X;

const LABEL_SIZE = 8;
const VALUE_SIZE = 10;
const FIELD_GAP = 6;
const LINE_HEIGHT_MULTIPLIER = 1.3;

const FOOTER_HEIGHT = 55;
const QR_DISPLAY_SIZE = 60;

const COLOR_BLACK = rgb(0, 0, 0);
const COLOR_LABEL = rgb(0.4, 0.4, 0.4);
const COLOR_SEPARATOR = rgb(0.75, 0.65, 0.5);
const COLOR_CAPTION = rgb(0.5, 0.5, 0.5);

const LEFT_COL_WIDTH = 260;
const RIGHT_COL_X = 330;
const RIGHT_COL_WIDTH = CONTENT_WIDTH - (RIGHT_COL_X - MARGIN_X);

const GRID_COL_WIDTH = 230;
const GRID_COL_GAP = CONTENT_WIDTH - 2 * GRID_COL_WIDTH;


type FontLike = { widthOfTextAtSize: (text: string, size: number) => number };

interface Fonts {
	regular: PDFFont;
	bold: PDFFont;
	italic: PDFFont;
}

interface ImageBuffer {
	bytes: Uint8Array;
	mimeType: string;
}


function wrapText(text: string, font: FontLike, size: number, maxWidth: number): string[] {
	const paragraphs = text.split("\n");
	const allLines: string[] = [];

	for (const paragraph of paragraphs) {
		if (paragraph.trim() === "") {
			allLines.push("");
			continue;
		}
		const words = paragraph.split(/\s+/).filter(Boolean);
		let current = "";

		for (const word of words) {
			const test = current ? `${current} ${word}` : word;
			if (font.widthOfTextAtSize(test, size) <= maxWidth) {
				current = test;
			} else {
				if (current) allLines.push(current);
				current = word;
			}
		}
		if (current) allLines.push(current);
	}

	return allLines.length > 0 ? allLines : [""];
}


function drawSeparator(page: PDFPage, y: number) {
	page.drawLine({
		start: { x: MARGIN_X, y },
		end: { x: A4_WIDTH - MARGIN_X, y },
		thickness: 1,
		color: COLOR_SEPARATOR,
	});
}


function drawHeader(page: PDFPage, fonts: Fonts): number {
	let y = A4_HEIGHT - MARGIN_TOP;

	page.drawText("GemsLab\u00e9", {
		x: MARGIN_X,
		y,
		size: 14,
		font: fonts.regular,
		color: COLOR_BLACK,
	});
	y -= 16;

	page.drawText("Gemological Expertise and Consultancy", {
		x: MARGIN_X,
		y,
		size: 9,
		font: fonts.italic,
		color: COLOR_LABEL,
	});
	y -= 20;

	return y;
}


function drawReportTitle(page: PDFPage, fonts: Fonts, title: string, y: number, showGemologist: boolean = false): number {
	const titleMaxWidth = CONTENT_WIDTH - QR_DISPLAY_SIZE - 20;
	const lines = wrapText(title, fonts.bold, 14, titleMaxWidth);
	for (const line of lines) {
		page.drawText(line, {
			x: MARGIN_X,
			y,
			size: 14,
			font: fonts.bold,
			color: COLOR_BLACK,
		});
		y -= 14 * LINE_HEIGHT_MULTIPLIER;
	}

	if (showGemologist) {
		page.drawText("Olena Rybnikova, PhD.", {
			x: MARGIN_X,
			y,
			size: 9,
			font: fonts.italic,
			color: COLOR_LABEL,
		});
		y -= 9 * LINE_HEIGHT_MULTIPLIER;
	}

	y -= 4;
	drawSeparator(page, y);
	y -= 20;

	return y;
}


function drawFooter(page: PDFPage, fonts: Fonts) {
	const footerY = 45;

	drawSeparator(page, footerY + 10);

	const line1 = "Rutheniai s.r.o.";
	const line2 = "Karpatske namestie 7770/10A, Bratislava \u2013 Ra\u010da, 831 06, Slovakia";
	const line3 = "www.gemsla.be  |  olena.rybnikova@gemsla.be  |  @olena_rybnikova";

	const line1Width = fonts.bold.widthOfTextAtSize(line1, 7);
	const line2Width = fonts.regular.widthOfTextAtSize(line2, 6.5);
	const line3Width = fonts.regular.widthOfTextAtSize(line3, 6.5);

	const centerX = A4_WIDTH / 2;

	page.drawText(line1, {
		x: centerX - line1Width / 2,
		y: footerY - 4,
		size: 7,
		font: fonts.bold,
		color: COLOR_BLACK,
	});
	page.drawText(line2, {
		x: centerX - line2Width / 2,
		y: footerY - 14,
		size: 6.5,
		font: fonts.regular,
		color: COLOR_BLACK,
	});
	page.drawText(line3, {
		x: centerX - line3Width / 2,
		y: footerY - 24,
		size: 6.5,
		font: fonts.regular,
		color: COLOR_BLACK,
	});
}


function drawField(
	page: PDFPage,
	fonts: Fonts,
	label: string,
	value: string,
	x: number,
	y: number,
	maxWidth: number,
): number {
	page.drawText(label.toUpperCase(), {
		x,
		y,
		size: LABEL_SIZE,
		font: fonts.regular,
		color: COLOR_LABEL,
	});
	y -= LABEL_SIZE * LINE_HEIGHT_MULTIPLIER + 2;

	const lines = wrapText(value, fonts.regular, VALUE_SIZE, maxWidth);
	for (const line of lines) {
		page.drawText(line, {
			x,
			y,
			size: VALUE_SIZE,
			font: fonts.regular,
			color: COLOR_BLACK,
		});
		y -= VALUE_SIZE * LINE_HEIGHT_MULTIPLIER;
	}

	y -= FIELD_GAP;
	return y;
}


function fieldHeight(fonts: Fonts, value: string, maxWidth: number): number {
	const lines = wrapText(value, fonts.regular, VALUE_SIZE, maxWidth);
	return (LABEL_SIZE * LINE_HEIGHT_MULTIPLIER + 2) + (lines.length * VALUE_SIZE * LINE_HEIGHT_MULTIPLIER) + FIELD_GAP;
}


function scaleToFit(
	imgWidth: number,
	imgHeight: number,
	maxWidth: number,
	maxHeight: number,
): { width: number; height: number } {
	const widthRatio = maxWidth / imgWidth;
	const heightRatio = maxHeight / imgHeight;
	const scale = Math.min(widthRatio, heightRatio, 1);
	return { width: imgWidth * scale, height: imgHeight * scale };
}


async function embedImage(pdf: PDFDocument, buffer: ImageBuffer) {
	const { bytes, mimeType } = buffer;
	if (mimeType.includes("png") || (bytes[0] === 0x89 && bytes[1] === 0x50)) {
		return pdf.embedPng(bytes);
	}
	return pdf.embedJpg(bytes);
}


interface FieldDef {
	label: string;
	value: string;
}


function collectFields(report: Report): { initialFields: FieldDef[]; gridFields: FieldDef[] } {
	const initialFields: FieldDef[] = [];
	const gridFields: FieldDef[] = [];

	initialFields.push({ label: "Stone Identification", value: report.stone });

	if (report.shape_cutting_style) {
		initialFields.push({ label: "Shape / Cutting Style", value: report.shape_cutting_style });
	}
	if (report.measurements) {
		initialFields.push({ label: "Measurements", value: report.measurements });
	}
	if (report.carat_weight != null) {
		const grams = (report.carat_weight * 0.2).toFixed(4);
		initialFields.push({ label: "Carat Weight", value: `${report.carat_weight} ct (${grams} g)` });
	}
	if (report.specific_gravity) {
		initialFields.push({ label: "Specific Gravity", value: `${report.specific_gravity} (hydrostatic weight)` });
	}

	if (report.refractive_index) {
		gridFields.push({ label: "Refractive Index", value: report.refractive_index });
	}
	if (report.double_refraction) {
		gridFields.push({ label: "Double Refraction", value: report.double_refraction });
	}
	if (report.polariscope) {
		gridFields.push({ label: "Polariscope", value: report.polariscope });
	}
	if (report.pleochroism) {
		gridFields.push({ label: "Pleochroism", value: report.pleochroism });
	}
	if (report.chelsea_color_filter) {
		gridFields.push({ label: "Chelsea Color Filter", value: report.chelsea_color_filter });
	}
	if (report.microscope) {
		gridFields.push({ label: "Microscope", value: report.microscope });
	}
	if (report.fluorescence_sw) {
		gridFields.push({ label: "Fluorescence SW", value: report.fluorescence_sw });
	}
	if (report.fluorescence_lw) {
		gridFields.push({ label: "Fluorescence LW", value: report.fluorescence_lw });
	}
	if (report.treatment) {
		gridFields.push({ label: "Treatment", value: report.treatment });
	}
	if (report.origin) {
		gridFields.push({ label: "Origin", value: report.origin });
	}

	return { initialFields, gridFields };
}


export async function generateReportPdf(
	report: Report,
	imageBuffers: Map<string, ImageBuffer>,
	qrPngBytes: Uint8Array,
): Promise<Uint8Array> {
	const pdf = await PDFDocument.create();
	pdf.registerFontkit(fontkit);

	const fontsDir = path.join(process.cwd(), "public", "fonts");
	const [regularBytes, boldBytes, italicBytes] = await Promise.all([
		fs.readFile(path.join(fontsDir, "Lora-Regular.ttf")),
		fs.readFile(path.join(fontsDir, "Lora-Bold.ttf")),
		fs.readFile(path.join(fontsDir, "Lora-Italic.ttf")),
	]);

	const fonts: Fonts = {
		regular: await pdf.embedFont(regularBytes),
		bold: await pdf.embedFont(boldBytes),
		italic: await pdf.embedFont(italicBytes),
	};

	const qrImage = await pdf.embedPng(qrPngBytes);

	const images = (report.report_images || []).sort((a, b) => a.display_order - b.display_order);
	const headlineImage = images.find((img) => img.is_headline);
	const galleryImages = images.filter((img) => !img.is_headline);

	const { initialFields, gridFields } = collectFields(report);
	const hasGemologicalData = gridFields.length > 0;

	const reportTitle = report.title;
	const minFooterY = FOOTER_HEIGHT + 10;


	let page = pdf.addPage([A4_WIDTH, A4_HEIGHT]);
	let cursorY = drawHeader(page, fonts);

	const qrScaled = scaleToFit(qrImage.width, qrImage.height, QR_DISPLAY_SIZE, QR_DISPLAY_SIZE);
	const qrX = A4_WIDTH - MARGIN_X - qrScaled.width;
	const qrTopY = A4_HEIGHT - MARGIN_TOP;
	page.drawImage(qrImage, {
		x: qrX,
		y: qrTopY - qrScaled.height,
		width: qrScaled.width,
		height: qrScaled.height,
	});

	cursorY = drawReportTitle(page, fonts, reportTitle, cursorY, true);

	const bodyStartY = cursorY;

	const startNewPage = (): number => {
		drawFooter(page, fonts);
		page = pdf.addPage([A4_WIDTH, A4_HEIGHT]);
		return drawHeader(page, fonts) - 20;
	};


	let headlineBottom = bodyStartY;

	if (headlineImage) {
		const buffer = imageBuffers.get(headlineImage.id);
		if (buffer) {
			try {
				const embedded = await embedImage(pdf, buffer);
				const scaled = scaleToFit(embedded.width, embedded.height, RIGHT_COL_WIDTH, 220);
				const imgY = bodyStartY - scaled.height;

				page.drawImage(embedded, {
					x: RIGHT_COL_X,
					y: imgY,
					width: scaled.width,
					height: scaled.height,
				});

				const captionText = headlineImage.caption || "(colors may be distorted)";
				const captionWidth = fonts.italic.widthOfTextAtSize(captionText, 7);
				const captionX = RIGHT_COL_X + (scaled.width - captionWidth) / 2;
				page.drawText(captionText, {
					x: Math.max(captionX, RIGHT_COL_X),
					y: imgY - 12,
					size: 7,
					font: fonts.italic,
					color: COLOR_CAPTION,
				});

				headlineBottom = imgY - 24;
			} catch {
				// skip if image embedding fails
			}
		}
	}


	for (const field of initialFields) {
		const h = fieldHeight(fonts, field.value, headlineImage ? LEFT_COL_WIDTH : CONTENT_WIDTH);
		if (cursorY - h < minFooterY) {
			cursorY = startNewPage();
		}
		cursorY = drawField(page, fonts, field.label, field.value, MARGIN_X, cursorY, headlineImage ? LEFT_COL_WIDTH : CONTENT_WIDTH);
	}


	if (hasGemologicalData) {
		cursorY = Math.min(cursorY, headlineBottom);
		cursorY -= 10;

		for (let i = 0; i < gridFields.length; i += 2) {
			const left = gridFields[i];
			const right = gridFields[i + 1];

			const leftH = fieldHeight(fonts, left.value, GRID_COL_WIDTH);
			const rightH = right ? fieldHeight(fonts, right.value, GRID_COL_WIDTH) : 0;
			const rowH = Math.max(leftH, rightH);

			if (cursorY - rowH < minFooterY) {
				cursorY = startNewPage();
			}

			const leftEndY = drawField(page, fonts, left.label, left.value, MARGIN_X, cursorY, GRID_COL_WIDTH);
			let rightEndY = cursorY;
			if (right) {
				rightEndY = drawField(page, fonts, right.label, right.value, MARGIN_X + GRID_COL_WIDTH + GRID_COL_GAP, cursorY, GRID_COL_WIDTH);
			}

			cursorY = Math.min(leftEndY, rightEndY);
		}
	} else {
		cursorY = Math.min(cursorY, headlineBottom);
	}


	drawFooter(page, fonts);


	if (galleryImages.length > 0) {
		const maxImgHeight = 280;
		let needsNewGalleryPage = true;

		for (const img of galleryImages) {
			const buffer = imageBuffers.get(img.id);
			if (!buffer) continue;

			let embedded;
			try {
				embedded = await embedImage(pdf, buffer);
			} catch {
				continue;
			}

			const scaled = scaleToFit(embedded.width, embedded.height, CONTENT_WIDTH, maxImgHeight);
			const captionHeight = (img.title ? 14 : 0) + (img.caption ? 14 : 0);
			const totalBlockHeight = scaled.height + 10 + captionHeight + 20;

			if (needsNewGalleryPage || cursorY - totalBlockHeight < minFooterY) {
				if (!needsNewGalleryPage) drawFooter(page, fonts);
				page = pdf.addPage([A4_WIDTH, A4_HEIGHT]);
				cursorY = drawHeader(page, fonts);
				cursorY = drawReportTitle(page, fonts, reportTitle, cursorY);
				needsNewGalleryPage = false;
			}

			const imgX = MARGIN_X + (CONTENT_WIDTH - scaled.width) / 2;
			page.drawImage(embedded, {
				x: imgX,
				y: cursorY - scaled.height,
				width: scaled.width,
				height: scaled.height,
			});
			cursorY -= scaled.height + 10;

			if (img.title) {
				const titleLines = wrapText(img.title, fonts.bold, 9, CONTENT_WIDTH);
				for (const line of titleLines) {
					const lineWidth = fonts.bold.widthOfTextAtSize(line, 9);
					page.drawText(line, {
						x: (A4_WIDTH - lineWidth) / 2,
						y: cursorY,
						size: 9,
						font: fonts.bold,
						color: COLOR_BLACK,
					});
					cursorY -= 9 * LINE_HEIGHT_MULTIPLIER;
				}
			}

			if (img.caption) {
				cursorY -= 2;
				const captionLines = wrapText(img.caption, fonts.regular, 8, CONTENT_WIDTH);
				for (const line of captionLines) {
					const lineWidth = fonts.regular.widthOfTextAtSize(line, 8);
					page.drawText(line, {
						x: (A4_WIDTH - lineWidth) / 2,
						y: cursorY,
						size: 8,
						font: fonts.regular,
						color: COLOR_CAPTION,
					});
					cursorY -= 8 * LINE_HEIGHT_MULTIPLIER;
				}
			}

			cursorY -= 10;
		}

		drawFooter(page, fonts);
	}

	return pdf.save();
}
