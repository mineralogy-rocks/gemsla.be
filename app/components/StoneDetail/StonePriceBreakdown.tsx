"use client";

import { money } from "@/app/lib/format";
import type { Stone } from "@/app/api/stones/types";


interface StonePriceBreakdownProps {
	stone: Stone;
	onEdit: () => void;
}


export function StonePriceBreakdown({ stone, onEdit }: StonePriceBreakdownProps) {
	const hasAdjusted = (stone.adjusted_price_eur != null || stone.adjusted_price_usd != null);
	const showDiffEur = hasAdjusted && stone.adjusted_price_eur != null && stone.gross_eur != null && Math.abs(stone.adjusted_price_eur - stone.gross_eur) > 0.005;
	const showDiffUsd = hasAdjusted && stone.adjusted_price_usd != null && stone.gross_usd != null && Math.abs(stone.adjusted_price_usd - stone.gross_usd) > 0.005;
	const showAdjustedRow = showDiffEur || showDiffUsd;

	const rows: { label: string; eur: number | null; usd: number | null }[] = [
		{ label: "Goods", eur: stone.price_eur, usd: stone.price_usd },
		{ label: "Shipment", eur: stone.shipment_eur, usd: stone.shipment_usd },
		{ label: "VAT", eur: stone.vat_eur, usd: stone.vat_usd },
	].filter((r) => r.eur != null || r.usd != null);


	return (
		<div className="rounded-lg border border-border-light p-5 relative group/breakdown cursor-pointer hover:border-border transition-colors"
		     onClick={onEdit}>

			<div className="flex justify-between items-center mb-3">
				<div className="text-xs text-text-gray uppercase tracking-wider">
					{showAdjustedRow ? "Price breakdown (credit note adjusted)" : "Price breakdown"}
				</div>
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
					{rows.map(({ label, eur, usd }) => (
						<tr key={label}
						    className="text-text-gray">
							<td className="py-1.5">{label}</td>
							<td className="py-1.5 text-right tabular-nums text-foreground font-medium">{money(eur, "eur")}</td>
							<td className="py-1.5 text-right tabular-nums text-foreground font-medium">{money(usd, "usd")}</td>
						</tr>
					))}
				</tbody>
				<tfoot>
					<tr className="border-t border-border-light">
						<td className="pt-2.5 font-medium text-foreground">Gross</td>
						<td className="pt-2.5 text-right tabular-nums font-medium text-foreground">{money(stone.gross_eur, "eur")}</td>
						<td className="pt-2.5 text-right tabular-nums font-medium text-foreground">{money(stone.gross_usd, "usd")}</td>
					</tr>

					{showAdjustedRow && (
						<tr className="border-t border-border-light">
							<td className="pt-2.5 font-medium text-foreground">Adjusted</td>
							<td className="pt-2.5 text-right tabular-nums">
								{showDiffEur ? (
									<>
										<s className="text-text-gray/50">{money(stone.gross_eur, "eur")}</s>
										{" "}
										<span className="text-foreground font-medium">{money(stone.adjusted_price_eur, "eur")}</span>
									</>
								) : (
									<span className="text-foreground font-medium">{money(stone.adjusted_price_eur ?? stone.gross_eur, "eur")}</span>
								)}
							</td>
							<td className="pt-2.5 text-right tabular-nums">
								{showDiffUsd ? (
									<>
										<s className="text-text-gray/50">{money(stone.gross_usd, "usd")}</s>
										{" "}
										<span className="text-foreground font-medium">{money(stone.adjusted_price_usd, "usd")}</span>
									</>
								) : (
									<span className="text-foreground font-medium">{money(stone.adjusted_price_usd ?? stone.gross_usd, "usd")}</span>
								)}
							</td>
						</tr>
					)}
				</tfoot>
			</table>
		</div>
	);
}
