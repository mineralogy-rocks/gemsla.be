import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import OpenAI from "https://esm.sh/openai@4";

const STORED_PROMPT_ID = "pmpt_69b30db188a481968f9f68f985966b1f0e35efb672138624";
const MODEL = "gpt-5-mini-2025-08-07";

const VALID_INVOICE_TYPES = ["received", "issued", "credit_note"];

interface RawInvoice {
	type: string;
	invoice_number: string | null;
	original_invoice_number: string | null;
	invoice_date: string | null;
	order_number: string | null;
	supplier: string | null;
	customer_name: string | null;
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

Deno.serve(async (req) => {
	if (req.method !== "POST") {
		return new Response(JSON.stringify({ error: "Method not allowed" }), {
			status: 405,
			headers: { "Content-Type": "application/json" },
		});
	}

	const authHeader = req.headers.get("Authorization");
	const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
	if (!authHeader || authHeader !== `Bearer ${serviceRoleKey}`) {
		return new Response(JSON.stringify({ error: "Unauthorized" }), {
			status: 401,
			headers: { "Content-Type": "application/json" },
		});
	}

	const { invoice_id } = await req.json();
	if (!invoice_id) {
		return new Response(JSON.stringify({ error: "invoice_id is required" }), {
			status: 400,
			headers: { "Content-Type": "application/json" },
		});
	}

	const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
	const supabase = createClient(supabaseUrl, serviceRoleKey!);

	await supabase
		.from("invoices")
		.update({ parse_status: "parsing" })
		.eq("id", invoice_id);

	try {
		const { data: invoice, error: fetchError } = await supabase
			.from("invoices")
			.select("id, file_path")
			.eq("id", invoice_id)
			.single();

		if (fetchError || !invoice?.file_path) {
			throw new Error("Invoice not found or no file attached");
		}

		const { data: fileData, error: downloadError } = await supabase.storage
			.from("invoices")
			.download(invoice.file_path);

		if (downloadError || !fileData) {
			throw new Error("Failed to download PDF");
		}

		const arrayBuffer = await fileData.arrayBuffer();
		const base64String = btoa(
			new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
		);

		const openaiKey = Deno.env.get("OPENAI_API_KEY");
		const client = new OpenAI({ apiKey: openaiKey });

		const response = await client.responses.create({
			model: MODEL,
			prompt: {
				id: STORED_PROMPT_ID,
				variables: {
					invoice_pdf: {
						type: "input_file",
						filename: "invoice.pdf",
						file_data: `data:application/pdf;base64,${base64String}`,
					},
				},
			},
		});

		const outputText = response.output_text;

		if (!outputText) {
			throw new Error("Empty response from OpenAI");
		}

		let raw: RawResponse;
		try {
			const fencedMatch = outputText.match(/```json\s*([\s\S]*?)\s*```/);
			if (fencedMatch) {
				raw = JSON.parse(fencedMatch[1].trim());
			} else {
				try {
					raw = JSON.parse(outputText.trim());
				} catch {
					const objectMatch = outputText.match(/\{[\s\S]*\}/);
					if (!objectMatch) throw new Error("No JSON found in response");
					raw = JSON.parse(objectMatch[0]);
				}
			}
		} catch (parseErr) {
			throw new Error(
				`Failed to parse OpenAI response: ${parseErr instanceof Error ? parseErr.message : "unknown"} — raw: ${outputText.slice(0, 500)}`
			);
		}

		const inv = raw.invoice ?? ({} as RawInvoice);
		const rawType = inv.type;
		const type = VALID_INVOICE_TYPES.includes(rawType) ? rawType : "received";

		const items = (raw.items ?? []).map((s) => ({
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
				description: null,
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

		const { error: updateError } = await supabase
			.from("invoices")
			.update({
				type,
				invoice_number: inv.invoice_number ?? null,
				original_invoice_number: inv.original_invoice_number ?? null,
				order_number: inv.order_number ?? null,
				supplier: inv.supplier ?? null,
				customer_name: inv.customer_name ?? null,
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
				items,
				parse_metadata: {
					raw_response: outputText,
					confidence,
					model: MODEL,
					parsed_at: new Date().toISOString(),
				},
				is_parsed: true,
				parse_status: "completed",
			})
			.eq("id", invoice_id);

		if (updateError) {
			throw new Error(`Failed to update invoice: ${updateError.message}`);
		}

		return new Response(JSON.stringify({ success: true }), {
			headers: { "Content-Type": "application/json" },
		});
	} catch (err) {
		console.error("Parse invoice error:", err);

		await supabase
			.from("invoices")
			.update({
				parse_status: "failed",
				parse_metadata: {
					error: err instanceof Error ? err.message : "Unknown error",
					failed_at: new Date().toISOString(),
					model: MODEL,
				},
			})
			.eq("id", invoice_id);

		return new Response(
			JSON.stringify({ success: false, error: err instanceof Error ? err.message : "Unknown error" }),
			{ status: 500, headers: { "Content-Type": "application/json" } },
		);
	}
});