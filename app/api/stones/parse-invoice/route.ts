import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/supabase/admin";
import OpenAI from "openai";

import type { InvoiceItem, InvoiceType, ParseMetadata } from "@/app/api/stones/types";

const STORED_PROMPT_ID = "pmpt_69b30db188a481968f9f68f985966b1f0e35efb672138624";
const MODEL = "gpt-5-mini-2025-08-07";

interface RawInvoice {
	type: string;
	invoice_number: string | null;
	original_invoice_number: string | null;
	invoice_date: string | null;
	order_number: string | null;
	supplier: string | null;
	ship_from: string | null;
	price_usd: number | null;
	price_eur: number | null;
	shipment_usd: number | null;
	shipment_eur: number | null;
	vat_rate: number | null;
	vat_usd: number | null;
	vat_eur: number | null;
	gross_usd: number | null;
	gross_eur: number | null;
	is_refund: boolean;
}

interface RawItem {
	item_number: string | null;
	name: string;
	description: string | null;
	carat_weight: number | null;
	dimensions: string | null;
	shape: string | null;
	color: string | null;
	treatment: string | null;
	origin: string | null;
	piece_count: number;
	price_usd: number | null;
	price_eur: number | null;
	shipment_usd: number | null;
	shipment_eur: number | null;
	vat_usd: number | null;
	vat_eur: number | null;
	gross_usd: number | null;
	gross_eur: number | null;
}

interface RawResponse {
	invoice: RawInvoice;
	confidence: Record<string, number>;
	items: RawItem[];
}

const VALID_INVOICE_TYPES: InvoiceType[] = ["received", "issued", "credit_note"];

interface ParsedInvoice {
	type: InvoiceType;
	invoice_number: string | null;
	original_invoice_number: string | null;
	order_number: string | null;
	supplier: string | null;
	invoice_date: string | null;
	price_usd: number | null;
	price_eur: number | null;
	shipment_usd: number | null;
	shipment_eur: number | null;
	vat_rate: number | null;
	vat_usd: number | null;
	vat_eur: number | null;
	gross_usd: number | null;
	gross_eur: number | null;
	is_refund: boolean;
	confidence: Record<string, number>;
	items: InvoiceItem[];
	parse_metadata: ParseMetadata;
}

export async function POST(request: NextRequest) {
	try {
		const admin = await isAdmin();
		if (!admin) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const formData = await request.formData();
		const file = formData.get("file") as File | null;

		if (!file || file.type !== "application/pdf") {
			return NextResponse.json({ error: "PDF file is required" }, { status: 400 });
		}

		if (file.size > 20 * 1024 * 1024) {
			return NextResponse.json({ error: "File size exceeds 20MB limit" }, { status: 400 });
		}

		const arrayBuffer = await file.arrayBuffer();
		const base64String = Buffer.from(arrayBuffer).toString("base64");

		const client = new OpenAI({
			apiKey: process.env.OPENAI_API_KEY,
		});

		const response = await client.responses.create({
			model: MODEL,
			prompt: {
				id: STORED_PROMPT_ID,
				variables: {
					invoice_pdf: {
						type: "input_file",
						filename: file.name,
						file_data: `data:application/pdf;base64,${base64String}`,
					},
				},
			},
		});

		const outputText = response.output_text;

		let raw: RawResponse;
		try {
			const jsonMatch = outputText.match(/```json\s*([\s\S]*?)\s*```/);
			const jsonString = jsonMatch ? jsonMatch[1] : outputText;
			raw = JSON.parse(jsonString.trim());
		} catch {
			return NextResponse.json({
				type: "received",
				invoice_number: null,
				original_invoice_number: null,
				order_number: null,
				supplier: null,
				invoice_date: null,
				price_usd: null,
				price_eur: null,
				shipment_usd: null,
				shipment_eur: null,
				vat_rate: null,
				vat_usd: null,
				vat_eur: null,
				gross_usd: null,
				gross_eur: null,
				is_refund: false,
				confidence: {},
				parse_metadata: {
					raw_response: outputText,
					confidence: {},
					model: MODEL,
					parsed_at: new Date().toISOString(),
				},
				items: [{
					item_number: null,
					name: "Unknown Stone",
					description: outputText.slice(0, 500),
					carat_weight: null,
					dimensions: null,
					shape: null,
					color: null,
					treatment: null,
					origin: null,
					piece_count: 1,
					price_usd: null,
					price_eur: null,
					shipment_usd: null,
					shipment_eur: null,
					vat_usd: null,
					vat_eur: null,
					gross_usd: null,
					gross_eur: null,
				}],
			} satisfies ParsedInvoice);
		}

		const inv = raw.invoice ?? {} as RawInvoice;
		const rawType = inv.type as InvoiceType;
		const type: InvoiceType = VALID_INVOICE_TYPES.includes(rawType) ? rawType : "received";

		const items: InvoiceItem[] = (raw.items ?? []).map((s) => ({
			item_number: s.item_number ?? null,
			name: s.name ?? "Unknown Stone",
			description: s.description ?? null,
			carat_weight: s.carat_weight ?? null,
			dimensions: s.dimensions ?? null,
			shape: s.shape ?? null,
			color: s.color ?? null,
			treatment: s.treatment ?? null,
			origin: s.origin ?? inv.ship_from ?? null,
			piece_count: s.piece_count ?? 1,
			price_usd: s.price_usd ?? null,
			price_eur: s.price_eur ?? null,
			shipment_usd: s.shipment_usd ?? null,
			shipment_eur: s.shipment_eur ?? null,
			vat_usd: s.vat_usd ?? null,
			vat_eur: s.vat_eur ?? null,
			gross_usd: s.gross_usd ?? null,
			gross_eur: s.gross_eur ?? null,
		}));

		if (items.length === 0) {
			items.push({
				item_number: null,
				name: "Unknown Stone",
				description: outputText.slice(0, 500),
				carat_weight: null,
				dimensions: null,
				shape: null,
				color: null,
				treatment: null,
				origin: null,
				piece_count: 1,
				price_usd: null,
				price_eur: null,
				shipment_usd: null,
				shipment_eur: null,
				vat_usd: null,
				vat_eur: null,
				gross_usd: null,
				gross_eur: null,
			});
		}

		const confidence = raw.confidence ?? {};
		const parsed: ParsedInvoice = {
			type,
			invoice_number: inv.invoice_number ?? null,
			original_invoice_number: inv.original_invoice_number ?? null,
			order_number: inv.order_number ?? null,
			supplier: inv.supplier ?? null,
			invoice_date: inv.invoice_date ?? null,
			price_usd: inv.price_usd ?? null,
			price_eur: inv.price_eur ?? null,
			shipment_usd: inv.shipment_usd ?? null,
			shipment_eur: inv.shipment_eur ?? null,
			vat_rate: inv.vat_rate ?? null,
			vat_usd: inv.vat_usd ?? null,
			vat_eur: inv.vat_eur ?? null,
			gross_usd: inv.gross_usd ?? null,
			gross_eur: inv.gross_eur ?? null,
			is_refund: inv.is_refund ?? false,
			confidence,
			items,
			parse_metadata: {
				raw_response: outputText,
				confidence,
				model: MODEL,
				parsed_at: new Date().toISOString(),
			},
		};

		return NextResponse.json(parsed);
	} catch (err) {
		console.error("Parse invoice error:", err);

		if (err instanceof OpenAI.APIError) {
			return NextResponse.json(
				{ error: `OpenAI API error: ${err.message}` },
				{ status: 502 }
			);
		}

		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}
