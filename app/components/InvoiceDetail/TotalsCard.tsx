"use client";

import { money } from "@/app/invoices/lib/format";
import type { Invoice } from "@/app/api/stones/types";
import type { FieldIssue } from "@/app/components/Input/Input.types";
import type { NetTotals } from "@/app/invoices/lib/totals";

import { IssueIndicator } from "../IssueIndicator";


interface TotalsCardProps {
	invoice: Invoice;
	net: NetTotals;
	hasCredit: boolean;
	fieldIssues?: Map<string, FieldIssue[]>;
}


export function TotalsCard({ invoice, net, hasCredit, fieldIssues }: TotalsCardProps) {
	return (
		<div className="glass-card glass-secondary p-5 mb-5">
			<div className="flex justify-between items-center mb-3.5">
				<div className="text-xs text-text-gray uppercase tracking-wider">
					{hasCredit ? "Net effect after credit note" : "Totals"}
				</div>
				{hasCredit && net.refund_pct_eur > 0 && (
					<div className="text-xs text-text-gray/60">
						{net.refund_pct_eur.toFixed(1)}% refunded
					</div>
				)}
			</div>

			<div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
				<CurrencyColumn ccy="eur"
				                invoice={invoice}
				                net={net}
				                hasCredit={hasCredit}
				                fieldIssues={fieldIssues} />
				<CurrencyColumn ccy="usd"
				                invoice={invoice}
				                net={net}
				                hasCredit={hasCredit}
				                fieldIssues={fieldIssues} />
			</div>
		</div>
	);
}


function CurrencyColumn({
	ccy,
	invoice,
	net,
	hasCredit,
	fieldIssues,
}: {
	ccy: "eur" | "usd";
	invoice: Invoice;
	net: NetTotals;
	hasCredit: boolean;
	fieldIssues?: Map<string, FieldIssue[]>;
}) {
	const issuesFor = (field: string) => fieldIssues?.get(`${field}_${ccy}`);
	const original = {
		price: invoice[`price_${ccy}`],
		shipment: invoice[`shipment_${ccy}`],
		vat: invoice[`vat_${ccy}`],
	};
	const final = {
		price: net[`price_${ccy}`],
		shipment: net[`shipment_${ccy}`],
		vat: net[`vat_${ccy}`],
		gross: net[`gross_${ccy}`],
	};
	const refund = (orig: number | null, fin: number | null): number =>
		orig != null && fin != null ? fin - orig : 0;

	return (
		<div>
			<div className="text-xs text-text-gray/60 uppercase tracking-wider mb-2">{ccy}</div>

			<DiffRow label="Goods"
			         original={original.price}
			         final={final.price}
			         refund={refund(original.price, final.price)}
			         ccy={ccy}
			         hasCredit={hasCredit}
			         issues={issuesFor("price")} />
			<DiffRow label="Shipment"
			         original={original.shipment}
			         final={final.shipment}
			         refund={refund(original.shipment, final.shipment)}
			         ccy={ccy}
			         hasCredit={hasCredit}
			         issues={issuesFor("shipment")} />
			<DiffRow label={`VAT${invoice.vat_rate ? ` (${invoice.vat_rate}%)` : ""}`}
			         original={original.vat}
			         final={final.vat}
			         refund={refund(original.vat, final.vat)}
			         ccy={ccy}
			         hasCredit={hasCredit}
			         issues={issuesFor("vat")} />

			<div className="pt-2.5 mt-1.5 border-t border-border-light">
				<div className="flex justify-between text-base">
					<span className="font-medium">Gross</span>
					<span className="tabular-nums font-medium">
						{money(final.gross, ccy)}
					</span>
				</div>
				<div className="text-right">
					<IssueIndicator issues={issuesFor("gross")} />
				</div>
			</div>
		</div>
	);
}


function DiffRow({
	label,
	original,
	final,
	refund,
	ccy,
	hasCredit,
	issues,
}: {
	label: string;
	original: number | null;
	final: number | null;
	refund: number;
	ccy: "eur" | "usd";
	hasCredit: boolean;
	issues?: FieldIssue[];
}) {
	const showDiff = hasCredit && Math.abs(refund) > 0.005;

	return (
		<div className="py-1">
			<div className="flex justify-between text-xs text-text-gray">
				<span>{label}</span>
				<span className="tabular-nums">
					{showDiff ? (
						<>
							<s className="text-text-gray/50">{money(original, ccy)}</s>
							{" "}
							<span className="text-red-600">{money(refund, ccy)}</span>
							{" "}
							<span className="text-foreground font-medium">{money(final, ccy)}</span>
						</>
					) : (
						<span className="text-foreground font-medium">{money(final, ccy)}</span>
					)}
				</span>
			</div>
			<div className="text-right">
				<IssueIndicator issues={issues} />
			</div>
		</div>
	);
}
