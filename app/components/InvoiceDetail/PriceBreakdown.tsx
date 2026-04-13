"use client";

import { money } from "@/app/invoices/lib/format";
import { IssueIndicator } from "../IssueIndicator";
import type { Invoice } from "@/app/api/stones/types";
import type { FieldIssue } from "@/app/components/Input/Input.types";
import type { NetTotals } from "@/app/invoices/lib/totals";


interface PriceBreakdownProps {
	invoice: Invoice;
	net: NetTotals;
	hasCredit: boolean;
	fieldIssues?: Map<string, FieldIssue[]>;
	onEdit: () => void;
}


type RowKey = "price" | "shipment" | "vat";


export function PriceBreakdown({ invoice, net, hasCredit, fieldIssues, onEdit }: PriceBreakdownProps) {
	const issuesFor = (field: string) => fieldIssues?.get(field);

	const rows: { key: RowKey; label: string }[] = [
		{ key: "price", label: "Goods" },
		{ key: "shipment", label: "Shipment" },
		{ key: "vat", label: `VAT${invoice.vat_rate ? ` (${invoice.vat_rate}%)` : ""}` },
	];

	return (
		<div className="rounded-lg border border-border-light p-5 relative group/breakdown cursor-pointer hover:border-border transition-colors"
		     onClick={onEdit}>

			<div className="flex justify-between items-center mb-3">
				<div className="text-xs text-text-gray uppercase tracking-wider">
					{hasCredit ? "Net effect after credit note" : "Price breakdown"}
				</div>
				{hasCredit && net.refund_pct_eur > 0 && (
					<div className="text-xs text-text-gray/60">
						{net.refund_pct_eur.toFixed(1)}% refunded
					</div>
				)}
			</div>

			<table className="w-full text-sm">
				<thead>
					<tr className="text-xs text-text-gray/60">
						<th className="text-left font-normal pb-2 w-1/3"></th>
						<th className="text-right font-normal pb-2 w-1/3">EUR</th>
						<th className="text-right font-normal pb-2 w-1/3">USD</th>
					</tr>
				</thead>
				<tbody>
					{rows.map(({ key, label }) => {
						const eurKey = `${key}_eur` as keyof NetTotals & keyof Invoice;
						const usdKey = `${key}_usd` as keyof NetTotals & keyof Invoice;
						const origEur = invoice[eurKey] as number | null;
						const origUsd = invoice[usdKey] as number | null;
						const finalEur = net[eurKey] as number | null;
						const finalUsd = net[usdKey] as number | null;
						const refundEur = origEur != null && finalEur != null ? finalEur - origEur : 0;
						const refundUsd = origUsd != null && finalUsd != null ? finalUsd - origUsd : 0;
						const showDiffEur = hasCredit && Math.abs(refundEur) > 0.005;
						const showDiffUsd = hasCredit && Math.abs(refundUsd) > 0.005;

						return (
							<tr key={key}
							    className="text-text-gray">
								<td className="py-1.5">{label}</td>
								<td className="py-1.5 text-right tabular-nums">
									<CellValue original={origEur}
									           final={finalEur}
									           refund={refundEur}
									           showDiff={showDiffEur}
									           ccy="eur" />
									<IssueIndicator issues={issuesFor(`${key}_eur`)} />
								</td>
								<td className="py-1.5 text-right tabular-nums">
									<CellValue original={origUsd}
									           final={finalUsd}
									           refund={refundUsd}
									           showDiff={showDiffUsd}
									           ccy="usd" />
									<IssueIndicator issues={issuesFor(`${key}_usd`)} />
								</td>
							</tr>
						);
					})}
				</tbody>
				<tfoot>
					<tr className="border-t border-border-light">
						<td className="pt-2.5 font-medium text-foreground">Gross</td>
						<td className="pt-2.5 text-right tabular-nums font-medium text-foreground">
							{money(net.gross_eur, "eur")}
							<IssueIndicator issues={issuesFor("gross_eur")} />
						</td>
						<td className="pt-2.5 text-right tabular-nums font-medium text-foreground">
							{money(net.gross_usd, "usd")}
							<IssueIndicator issues={issuesFor("gross_usd")} />
						</td>
					</tr>
				</tfoot>
			</table>
		</div>
	);
}


function CellValue({ original, final, refund, showDiff, ccy }: {
	original: number | null;
	final: number | null;
	refund: number;
	showDiff: boolean;
	ccy: "eur" | "usd";
}) {
	if (showDiff) {
		return (
			<>
				<s className="text-text-gray/50">{money(original, ccy)}</s>
				{" "}
				<span className="text-red-600">{money(refund, ccy)}</span>
				{" "}
				<span className="text-foreground font-medium">{money(final, ccy)}</span>
			</>
		);
	}

	return <span className="text-foreground font-medium">{money(final, ccy)}</span>;
}
