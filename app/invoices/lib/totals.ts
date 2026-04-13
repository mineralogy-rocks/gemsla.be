import type { Invoice, InvoiceItem } from "@/app/api/stones/types";


type PricingFields = Pick<Invoice,
	"price_eur" | "price_usd" | "shipment_eur" | "shipment_usd" |
	"vat_eur" | "vat_usd" | "gross_eur" | "gross_usd"
>;

export interface NetTotals {
	price_eur: number | null;
	shipment_eur: number | null;
	vat_eur: number | null;
	gross_eur: number | null;
	price_usd: number | null;
	shipment_usd: number | null;
	vat_usd: number | null;
	gross_usd: number | null;
	refund_eur: number;
	refund_usd: number;
	refund_pct_eur: number;
}


export interface ItemNet {
	adjusted_price_eur: number | null;
	adjusted_price_usd: number | null;
}


export function computeItemNet(item: InvoiceItem, creditNoteItems: InvoiceItem[]): ItemNet {
	const matchingCnItems = creditNoteItems.filter(
		(cnItem) => cnItem.item_number && cnItem.item_number === item.item_number
	);

	if (matchingCnItems.length === 0) {
		return {
			adjusted_price_eur: item.gross_eur ?? null,
			adjusted_price_usd: item.gross_usd ?? null,
		};
	}

	const cnSumEur = matchingCnItems.reduce((sum, cnItem) => sum + (cnItem.gross_eur ?? 0), 0);
	const cnSumUsd = matchingCnItems.reduce((sum, cnItem) => sum + (cnItem.gross_usd ?? 0), 0);

	return {
		adjusted_price_eur: item.gross_eur != null ? item.gross_eur + cnSumEur : null,
		adjusted_price_usd: item.gross_usd != null ? item.gross_usd + cnSumUsd : null,
	};
}


export function computeNet(invoice: PricingFields, creditNotes: PricingFields[]): NetTotals {
	const sumField = (f: keyof PricingFields): number => {
		const base = (invoice[f] as number | null) ?? 0;
		const refunds = creditNotes.reduce((s, cn) => s + ((cn[f] as number | null) ?? 0), 0);
		return base + refunds;
	};

	const refund_eur = creditNotes.reduce((s, cn) => s + Math.abs(cn.gross_eur ?? 0), 0);
	const refund_usd = creditNotes.reduce((s, cn) => s + Math.abs(cn.gross_usd ?? 0), 0);
	const baseGross = invoice.gross_eur ?? 0;

	return {
		price_eur: sumField("price_eur"),
		shipment_eur: sumField("shipment_eur"),
		vat_eur: sumField("vat_eur"),
		gross_eur: sumField("gross_eur"),
		price_usd: sumField("price_usd"),
		shipment_usd: sumField("shipment_usd"),
		vat_usd: sumField("vat_usd"),
		gross_usd: sumField("gross_usd"),
		refund_eur,
		refund_usd,
		refund_pct_eur: baseGross > 0 ? (refund_eur / baseGross) * 100 : 0,
	};
}
