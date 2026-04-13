"use client";

import { money } from "@/app/invoices/lib/format";
import type { InvoiceItem, InvoiceDetail, StoneListItem } from "@/app/api/stones/types";


interface ItemCardProps {
	item: InvoiceItem;
	refundInvoices?: InvoiceDetail["refund_invoices"];
	linkedStone: StoneListItem | undefined;
	onCreateStone: () => void;
	isCreating: boolean;
	onClick?: () => void;
}


const pillBase = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";


export function ItemCard({
	item,
	refundInvoices,
	linkedStone,
	onCreateStone,
	isCreating,
	onClick,
}: ItemCardProps) {
	const refund = (refundInvoices ?? []).reduce(
		(acc, cn) => {
			const cnItem = cn.items?.find((it) => it.item_number === item.item_number);
			if (!cnItem) return acc;
			return {
				price_eur: acc.price_eur + (cnItem.price_eur ?? 0),
				vat_eur: acc.vat_eur + (cnItem.vat_eur ?? 0),
				gross_eur: acc.gross_eur + (cnItem.gross_eur ?? 0),
				price_usd: acc.price_usd + (cnItem.price_usd ?? 0),
				vat_usd: acc.vat_usd + (cnItem.vat_usd ?? 0),
				gross_usd: acc.gross_usd + (cnItem.gross_usd ?? 0),
			};
		},
		{ price_eur: 0, vat_eur: 0, gross_eur: 0, price_usd: 0, vat_usd: 0, gross_usd: 0 },
	);
	const hasRefund = Math.abs(refund.gross_eur) > 0.005 || Math.abs(refund.gross_usd) > 0.005;

	const descriptors = [
		item.carat_weight && `${item.carat_weight} ct`,
		item.dimensions,
		item.shape,
		item.color,
		item.treatment,
		item.origin,
	].filter(Boolean).join(" · ");

	return (
		<div className={`glass-card glass-secondary p-4 mb-3 ${onClick ? "cursor-pointer hover:border-callout-accent transition-colors" : ""}`}
		     onClick={onClick}>
			<div className="flex items-start justify-between gap-3 mb-3">
				<div className="min-w-0">
					<div className="flex items-center gap-2.5 flex-wrap">
						<span className="text-sm font-medium">{item.name}</span>
						{item.item_number && (
							<span className={`${pillBase} bg-gray-100 text-gray-700 font-mono`}>
								#{item.item_number}
							</span>
						)}
						{linkedStone ? (
							<span className={`${pillBase} bg-green-100 text-green-800`}>Linked to stone</span>
						) : (
							<span className={`${pillBase} bg-amber-100 text-amber-800`}>No stone yet</span>
						)}
					</div>
					{descriptors && (
						<div className="text-xs text-text-gray mt-1">{descriptors}</div>
					)}
				</div>

				{!linkedStone && (
					<button onClick={(e) => { e.stopPropagation(); onCreateStone(); }}
					        disabled={isCreating}
					        className="text-xs shrink-0 px-2.5 py-1 rounded border border-border-light hover:bg-background-creme/50 transition-colors">
						{isCreating ? "Creating..." : "Create stone"}
					</button>
				)}
			</div>

			<div className="border-t border-border-light pt-3">
				<div className="grid grid-cols-[80px_1fr_1fr] sm:grid-cols-[110px_1fr_1fr] gap-3 text-xs text-text-gray/60 pb-1.5">
					<div></div>
					<div>EUR</div>
					<div>USD</div>
				</div>

				<ItemPriceRow label="Tax invoice"
				              eur={`${(item.price_eur ?? 0).toFixed(2)} + ${(item.vat_eur ?? 0).toFixed(2)} VAT = ${(item.gross_eur ?? 0).toFixed(2)}`}
				              usd={`${(item.price_usd ?? 0).toFixed(2)} + ${(item.vat_usd ?? 0).toFixed(2)} VAT = ${(item.gross_usd ?? 0).toFixed(2)}`} />

				{hasRefund && (
					<ItemPriceRow label="↩ Credit note"
					              eur={`${refund.price_eur.toFixed(2)} ${refund.vat_eur.toFixed(2)} VAT = ${refund.gross_eur.toFixed(2)}`}
					              usd={`${refund.price_usd.toFixed(2)} ${refund.vat_usd.toFixed(2)} VAT = ${refund.gross_usd.toFixed(2)}`}
					              danger />
				)}

				<div className="grid grid-cols-[80px_1fr_1fr] sm:grid-cols-[110px_1fr_1fr] gap-3 pt-2 mt-1 border-t border-border-light text-xs">
					<div className="text-text-gray font-medium">Net cost</div>
					<div className="tabular-nums font-medium">
						{money((item.gross_eur ?? 0) + refund.gross_eur, "eur")}
					</div>
					<div className="tabular-nums font-medium">
						{money((item.gross_usd ?? 0) + refund.gross_usd, "usd")}
					</div>
				</div>
			</div>
		</div>
	);
}


function ItemPriceRow({ label, eur, usd, danger }: { label: string; eur: string; usd: string; danger?: boolean }) {
	const textColor = danger ? "text-red-600" : "";
	const labelColor = danger ? "text-red-600" : "text-text-gray";

	return (
		<div className={`grid grid-cols-[80px_1fr_1fr] sm:grid-cols-[110px_1fr_1fr] gap-3 py-1.5 text-xs ${textColor}`}>
			<div className={labelColor}>{label}</div>
			<div className="tabular-nums">{eur}</div>
			<div className="tabular-nums">{usd}</div>
		</div>
	);
}
