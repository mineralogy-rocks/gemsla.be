import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/supabase/admin";
import OpenAI from "openai";

const STORED_PROMPT_ID = "pmpt_69b30db188a481968f9f68f985966b1f0e35efb672138624";

interface RawInvoice {
	invoice_number: string | null;
	invoice_date: string | null;
	order_number: string | null;
	seller_name: string | null;
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

interface RawStone {
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

interface ParsedStone {
	name: string;
	description: string | null;
	stone_type: string | null;
	color: string | null;
	cut: string | null;
	weight_carats: number | null;
	dimensions: string | null;
	country: string | null;
	price_usd: number | null;
	price_eur: number | null;
	shipment_usd: number | null;
	shipment_eur: number | null;
	vat_usd: number | null;
	vat_eur: number | null;
	gross_usd: number | null;
	gross_eur: number | null;
}

interface ParsedInvoice {
	invoice_number: string | null;
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
	stones: ParsedStone[];
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
			model: "gpt-5-mini-2025-08-07",
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

		let raw: { invoice: RawInvoice; stones: RawStone[] };
		try {
			const jsonMatch = outputText.match(/```json\s*([\s\S]*?)\s*```/);
			const jsonString = jsonMatch ? jsonMatch[1] : outputText;
			raw = JSON.parse(jsonString.trim());
		} catch {
			return NextResponse.json({
				invoice_number: null,
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
				stones: [{
					name: "Unknown Stone",
					description: outputText.slice(0, 500),
					stone_type: null,
					color: null,
					cut: null,
					weight_carats: null,
					dimensions: null,
					country: null,
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

		const parsed: ParsedInvoice = {
			invoice_number: inv.invoice_number ?? null,
			order_number: inv.order_number ?? null,
			supplier: inv.seller_name ?? null,
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
			stones: (raw.stones ?? []).map((s) => ({
				name: s.name ?? "Unknown Stone",
				description: s.description ?? null,
				stone_type: s.name ?? null,
				color: s.color ?? null,
				cut: s.shape ?? null,
				weight_carats: s.carat_weight ?? null,
				dimensions: s.dimensions ?? null,
				country: s.origin ?? inv.ship_from ?? null,
				price_usd: s.price_usd ?? null,
				price_eur: s.price_eur ?? null,
				shipment_usd: s.shipment_usd ?? null,
				shipment_eur: s.shipment_eur ?? null,
				vat_usd: s.vat_usd ?? null,
				vat_eur: s.vat_eur ?? null,
				gross_usd: s.gross_usd ?? null,
				gross_eur: s.gross_eur ?? null,
			})),
		};

		if (parsed.stones.length === 0) {
			parsed.stones = [{
				name: "Unknown Stone",
				description: outputText.slice(0, 500),
				stone_type: null,
				color: null,
				cut: null,
				weight_carats: null,
				dimensions: null,
				country: null,
				price_usd: null,
				price_eur: null,
				shipment_usd: null,
				shipment_eur: null,
				vat_usd: null,
				vat_eur: null,
				gross_usd: null,
				gross_eur: null,
			}];
		}

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
