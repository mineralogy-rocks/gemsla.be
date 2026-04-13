import type { Invoice, Confidence, Issue } from "@/app/api/stones/types";


const TOLERANCE = 0.02;
const CONFIDENCE_THRESHOLD = 0.85;

type ParentInvoice = {
	gross_eur: number | null;
	gross_usd: number | null;
	shipment_eur: number | null;
	shipment_usd: number | null;
} | null | undefined;


export function validate(
	invoice: Invoice,
	parent: ParentInvoice,
	confidence: Confidence | undefined,
): { issues: Issue[]; canSave: boolean } {
	const issues: Issue[] = [
		...checkArithmetic(invoice),
		...checkRequired(invoice),
		...checkSigns(invoice),
		...checkStones(invoice),
		...checkCreditNoteLinkage(invoice, parent),
		...(confidence ? checkConfidence(confidence) : []),
	];
	return {
		issues,
		canSave: !issues.some((i) => i.severity === "error"),
	};
}


function checkArithmetic(i: Invoice): Issue[] {
	const issues: Issue[] = [];
	for (const ccy of ["eur", "usd"] as const) {
		const price = i[`price_${ccy}`];
		const ship = i[`shipment_${ccy}`] ?? 0;
		const vat = i[`vat_${ccy}`];
		const gross = i[`gross_${ccy}`];
		if (price == null || vat == null || gross == null) continue;

		const expected = price + ship + vat;
		if (Math.abs(expected - gross) > TOLERANCE) {
			issues.push({
				severity: "error",
				code: "gross_mismatch",
				field: `gross_${ccy}`,
				message: `Gross ${ccy.toUpperCase()} should be ${expected.toFixed(2)} but is ${gross.toFixed(2)}`,
				fix: `Set to ${expected.toFixed(2)}`,
				fixValue: expected,
			});
		}
		if (i.vat_rate && price > 0) {
			const expectedVat = (price + ship) * (i.vat_rate / 100);
			if (Math.abs(expectedVat - vat) > TOLERANCE) {
				issues.push({
					severity: "warning",
					code: "vat_rate_mismatch",
					field: `vat_${ccy}`,
					message: `VAT ${ccy.toUpperCase()} of ${vat.toFixed(2)} doesn't match ${i.vat_rate}% of net (expected ${expectedVat.toFixed(2)})`,
					fix: `Set to ${expectedVat.toFixed(2)}`,
					fixValue: expectedVat,
				});
			}
		}
	}
	return issues;
}


function checkRequired(i: Invoice): Issue[] {
	const issues: Issue[] = [];
	const required: Array<keyof Invoice> = ["invoice_number", "invoice_date", "supplier"];
	for (const f of required) {
		if (!i[f]) {
			issues.push({
				severity: "error",
				code: "required_missing",
				field: String(f),
				message: `${String(f).replace(/_/g, " ")} is required`,
			});
		}
	}
	if (i.gross_eur == null && i.gross_usd == null) {
		issues.push({
			severity: "error",
			code: "no_currency",
			message: "Invoice has no totals in either EUR or USD",
		});
	}
	return issues;
}


function checkSigns(i: Invoice): Issue[] {
	if (i.type !== "credit_note") return [];
	const issues: Issue[] = [];
	const fields: Array<keyof Invoice> = [
		"price_eur", "price_usd", "vat_eur", "vat_usd", "gross_eur", "gross_usd",
	];
	for (const f of fields) {
		const v = i[f] as number | null;
		if (v != null && v > 0) {
			issues.push({
				severity: "error",
				code: "cn_positive_value",
				field: String(f),
				message: `Credit note ${String(f)} must be negative, got ${v.toFixed(2)}`,
				fix: `Negate to ${(-v).toFixed(2)}`,
			});
		}
	}
	return issues;
}


function checkStones(i: Invoice): Issue[] {
	if (i.type !== "received") return [];
	if (i.items && i.items.length > 0) return [];
	return [{
		severity: "warning",
		code: "no_stones",
		message: "Received invoice has no line items extracted",
	}];
}


function checkCreditNoteLinkage(i: Invoice, parent: ParentInvoice): Issue[] {
	if (i.type !== "credit_note") return [];
	const issues: Issue[] = [];
	if (!i.original_invoice_number) {
		issues.push({
			severity: "error",
			code: "cn_no_parent",
			field: "original_invoice_number",
			message: "Credit note must reference the original invoice number",
		});
		return issues;
	}
	if (!parent) {
		issues.push({
			severity: "error",
			code: "cn_parent_not_found",
			field: "original_invoice_number",
			message: `No invoice found with number ${i.original_invoice_number}`,
			fix: "Upload the original invoice first, or correct the reference",
		});
		return issues;
	}
	for (const ccy of ["eur", "usd"] as const) {
		const parentGross = parent[`gross_${ccy}`];
		const refund = i[`gross_${ccy}`];
		if (parentGross != null && refund != null && Math.abs(refund) > parentGross + TOLERANCE) {
			issues.push({
				severity: "error",
				code: "cn_exceeds_parent",
				field: `gross_${ccy}`,
				message: `Refund ${ccy.toUpperCase()} (${Math.abs(refund).toFixed(2)}) exceeds original (${parentGross.toFixed(2)})`,
			});
		}
	}
	const parentShipEur = parent.shipment_eur ?? 0;
	const refundShipEur = i.shipment_eur ?? 0;
	if (parentShipEur > 0 && refundShipEur === 0) {
		issues.push({
			severity: "info",
			code: "cn_no_shipment_refund",
			field: "shipment_eur",
			message: "Original had shipment cost but credit note does not refund it",
		});
	}
	return issues;
}


function checkConfidence(c: Confidence): Issue[] {
	return Object.entries(c)
		.filter(([_, score]) => score != null && score < CONFIDENCE_THRESHOLD)
		.map(([field, score]) => ({
			severity: "warning" as const,
			code: "low_confidence",
			field,
			message: `Low confidence on ${field} (${Math.round((score ?? 0) * 100)}%) — verify against PDF`,
		}));
}
