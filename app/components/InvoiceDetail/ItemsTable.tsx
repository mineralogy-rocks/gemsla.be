"use client";

import { money } from "@/app/invoices/lib/format";
import type { InvoiceItem, InvoiceDetail, StoneListItem } from "@/app/api/stones/types";


interface ItemsTableProps {
	items: InvoiceItem[];
	refundInvoices?: InvoiceDetail["refund_invoices"];
	stonesByItem: Map<string, StoneListItem>;
	onItemClick: (index: number) => void;
	unlinkedCount: number;
	onOpenBatchCreate: () => void;
}


export function ItemsTable({
	items,
	refundInvoices,
	stonesByItem,
	onItemClick,
	unlinkedCount,
	onOpenBatchCreate,
}: ItemsTableProps) {
	if (items.length === 0) return null;

	const totals = items.reduce(
		(acc, item) => ({
			gross_eur: acc.gross_eur + (item.gross_eur ?? 0),
			gross_usd: acc.gross_usd + (item.gross_usd ?? 0),
		}),
		{ gross_eur: 0, gross_usd: 0 },
	);

	const refundTotals = (refundInvoices ?? []).reduce(
		(acc, cn) => ({
			gross_eur: acc.gross_eur + (cn.items ?? []).reduce((s, it) => s + (it.gross_eur ?? 0), 0),
			gross_usd: acc.gross_usd + (cn.items ?? []).reduce((s, it) => s + (it.gross_usd ?? 0), 0),
		}),
		{ gross_eur: 0, gross_usd: 0 },
	);
	const hasRefundTotals = Math.abs(refundTotals.gross_eur) > 0.005 || Math.abs(refundTotals.gross_usd) > 0.005;
	const netTotals = {
		gross_eur: totals.gross_eur + refundTotals.gross_eur,
		gross_usd: totals.gross_usd + refundTotals.gross_usd,
	};

	return (
		<div>
			<div className="flex items-center justify-between mb-3">
				<div className="text-xs font-medium uppercase tracking-wider text-text-gray">
					Items ({items.length})
				</div>
				{unlinkedCount > 0 && (
					<button onClick={onOpenBatchCreate}
					        className="text-xs px-2.5 py-1 rounded border border-border-light hover:bg-background-creme/50 transition-colors text-text-gray hover:text-foreground">
						Create stones from {unlinkedCount} {unlinkedCount === 1 ? "item" : "items"}
					</button>
				)}
			</div>

			<div className="rounded-lg border border-border-light overflow-hidden">
				<table className="w-full text-sm">
					<thead>
						<tr className="text-xs text-text-gray/60 border-b border-border-light">
							<th className="text-left font-normal px-4 py-2.5">#</th>
							<th className="text-left font-normal px-4 py-2.5">Name</th>
							<th className="text-left font-normal px-4 py-2.5 hidden sm:table-cell">Details</th>
							<th className="text-right font-normal px-4 py-2.5">EUR</th>
							<th className="text-right font-normal px-4 py-2.5 hidden sm:table-cell">USD</th>
							<th className="text-center font-normal px-4 py-2.5 w-16">Stone</th>
						</tr>
					</thead>
					<tbody>
						{items.map((item, i) => {
							const linked = item.item_number ? stonesByItem.has(item.item_number) : false;
							const descriptors = [
								item.carat_weight && `${item.carat_weight} ct`,
								item.shape,
								item.color,
							].filter(Boolean).join(" · ");

							const refundGross = (refundInvoices ?? []).reduce((acc, cn) => {
								const cnItem = cn.items?.find((it) => it.item_number === item.item_number);
								return acc + (cnItem?.gross_eur ?? 0);
							}, 0);
							const hasRefund = Math.abs(refundGross) > 0.005;

							const refundGrossUsd = (refundInvoices ?? []).reduce((acc, cn) => {
								const cnItem = cn.items?.find((it) => it.item_number === item.item_number);
								return acc + (cnItem?.gross_usd ?? 0);
							}, 0);
							const hasRefundUsd = Math.abs(refundGrossUsd) > 0.005;

							return (
								<tr key={item.item_number || i}
								    className="border-b border-border-light last:border-0 hover:bg-background-creme/30 cursor-pointer transition-colors"
								    onClick={() => onItemClick(i)}>
									<td className="px-4 py-3 text-text-gray font-mono text-xs">
										{item.item_number ?? (i + 1)}
									</td>
									<td className="px-4 py-3 font-medium">
										{item.name ?? "Unknown"}
									</td>
									<td className="px-4 py-3 text-text-gray text-xs truncate max-w-[200px] hidden sm:table-cell">
										{descriptors || "---"}
									</td>
									<td className="px-4 py-3 text-right tabular-nums">
										{money(item.gross_eur, "eur")}
										{hasRefund && (
											<div className="text-xs text-red-600 tabular-nums">
												{money(refundGross, "eur")}
											</div>
										)}
									</td>
									<td className="px-4 py-3 text-right tabular-nums hidden sm:table-cell">
										{money(item.gross_usd, "usd")}
										{hasRefundUsd && (
											<div className="text-xs text-red-600 tabular-nums">
												{money(refundGrossUsd, "usd")}
											</div>
										)}
									</td>
									<td className="px-4 py-3 text-center">
										{linked ? (
											<span className="inline-block w-2 h-2 rounded-full bg-green-500"
											      title="Linked to stone" />
										) : (
											<span className="inline-block w-2 h-2 rounded-full bg-amber-400"
											      title="No stone yet" />
										)}
									</td>
								</tr>
							);
						})}
					</tbody>
					<tfoot>
						<tr className="border-t border-border bg-background-creme/20">
							<td className="px-4 py-2.5"></td>
							<td className="px-4 py-2.5 text-xs text-text-gray font-medium">Total</td>
							<td className="px-4 py-2.5 hidden sm:table-cell"></td>
							<td className="px-4 py-2.5 text-right tabular-nums font-medium">
								{hasRefundTotals && Math.abs(refundTotals.gross_eur) > 0.005 ? (
									<>
										<s className="text-text-gray/50 font-normal">{money(totals.gross_eur, "eur")}</s>
										{" "}
										<span className="text-red-600 font-normal">{money(refundTotals.gross_eur, "eur")}</span>
										{" "}
										<span>{money(netTotals.gross_eur, "eur")}</span>
									</>
								) : money(totals.gross_eur, "eur")}
							</td>
							<td className="px-4 py-2.5 text-right tabular-nums font-medium hidden sm:table-cell">
								{hasRefundTotals && Math.abs(refundTotals.gross_usd) > 0.005 ? (
									<>
										<s className="text-text-gray/50 font-normal">{money(totals.gross_usd, "usd")}</s>
										{" "}
										<span className="text-red-600 font-normal">{money(refundTotals.gross_usd, "usd")}</span>
										{" "}
										<span>{money(netTotals.gross_usd, "usd")}</span>
									</>
								) : money(totals.gross_usd, "usd")}
							</td>
							<td className="px-4 py-2.5"></td>
						</tr>
					</tfoot>
				</table>
			</div>
		</div>
	);
}
