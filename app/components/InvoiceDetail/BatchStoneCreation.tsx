"use client";

import { useState, useCallback } from "react";
import toast from "react-hot-toast";

import { SlidePanel } from "../SlidePanel";
import { Button } from "../Button";
import { money } from "@/app/invoices/lib/format";
import { computeItemNet } from "@/app/invoices/lib/totals";
import type { InvoiceItem, StoneListItem, InvoiceDetail } from "@/app/api/stones/types";


interface BatchStoneCreationProps {
	isOpen: boolean;
	onClose: () => void;
	items: InvoiceItem[];
	stonesByItem: Map<string, StoneListItem>;
	invoiceId: string;
	refundInvoices?: InvoiceDetail["refund_invoices"];
	onComplete: () => void;
}


function toPos(v: number | null | undefined): number | null {
	return v != null && v >= 0 ? v : null;
}


export function BatchStoneCreation({
	isOpen,
	onClose,
	items,
	stonesByItem,
	invoiceId,
	refundInvoices,
	onComplete,
}: BatchStoneCreationProps) {
	const allCreditNoteItems = (refundInvoices ?? []).flatMap((cn) => cn.items ?? []);
	const unlinkedItems = items
		.map((item, index) => ({ item, index }))
		.filter(({ item }) => !item.item_number || !stonesByItem.has(item.item_number));

	const [selected, setSelected] = useState<Set<number>>(() =>
		new Set(unlinkedItems.map(({ index }) => index))
	);
	const [creating, setCreating] = useState(false);
	const [progress, setProgress] = useState({ current: 0, total: 0 });

	const toggleItem = useCallback((index: number) => {
		setSelected((prev) => {
			const next = new Set(prev);
			if (next.has(index)) {
				next.delete(index);
			} else {
				next.add(index);
			}
			return next;
		});
	}, []);

	const handleCreate = useCallback(async () => {
		const toCreate = unlinkedItems.filter(({ index }) => selected.has(index));
		if (toCreate.length === 0) return;

		setCreating(true);
		setProgress({ current: 0, total: toCreate.length });
		let succeeded = 0;
		let failed = 0;

		for (const { item } of toCreate) {
			setProgress((prev) => ({ ...prev, current: prev.current + 1 }));
			try {
				const itemNet = computeItemNet(item, allCreditNoteItems);
				const res = await fetch("/api/stones", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						name: item.name || "Unknown Stone",
						description: item.description || null,
						stone_type: item.name || null,
						color: item.color || null,
						cut: item.shape || null,
						weight_carats: item.carat_weight,
						dimensions: item.dimensions || null,
						country: item.origin || null,
						price_usd: toPos(item.price_usd),
						price_eur: toPos(item.price_eur),
						shipment_usd: toPos(item.shipment_usd),
						shipment_eur: toPos(item.shipment_eur),
						vat_usd: toPos(item.vat_usd),
						vat_eur: toPos(item.vat_eur),
						gross_usd: toPos(item.gross_usd),
						gross_eur: toPos(item.gross_eur),
						adjusted_price_eur: itemNet.adjusted_price_eur,
						adjusted_price_usd: itemNet.adjusted_price_usd,
						is_sold: false,
						invoice_id: invoiceId,
						item_number: item.item_number || null,
					}),
				});
				if (!res.ok) throw new Error((await res.json()).error || "Failed");
				succeeded++;
			} catch {
				failed++;
				toast.error(`Failed to create stone for "${item.name}"`);
			}
		}

		setCreating(false);

		if (succeeded > 0) {
			toast.success(`Created ${succeeded} stone${succeeded > 1 ? "s" : ""}`);
		}
		if (failed > 0 && succeeded > 0) {
			toast.error(`${failed} stone${failed > 1 ? "s" : ""} failed`);
		}

		onComplete();
		onClose();
	}, [unlinkedItems, selected, invoiceId, onComplete, onClose]);

	const selectedCount = [...selected].filter((idx) =>
		unlinkedItems.some(({ index }) => index === idx)
	).length;


	return (
		<SlidePanel isOpen={isOpen}
		            onClose={onClose}
		            title="Create stones"
		            footer={
			            <div className="flex items-center justify-between gap-3">
				            {creating ? (
					            <div className="text-xs text-text-gray">
						            Creating {progress.current} of {progress.total}...
					            </div>
				            ) : (
					            <div className="text-xs text-text-gray">
						            {selectedCount} of {unlinkedItems.length} selected
					            </div>
				            )}
				            <div className="flex gap-2">
					            <Button variant="ghost"
					                    size="sm"
					                    onClick={onClose}
					                    disabled={creating}>
						            Cancel
					            </Button>
					            <Button variant="primary"
					                    size="sm"
					                    onClick={handleCreate}
					                    loading={creating}
					                    disabled={selectedCount === 0}>
						            Create {selectedCount} stone{selectedCount !== 1 ? "s" : ""}
					            </Button>
				            </div>
			            </div>
		            }>
			<div className="space-y-1">
				{items.map((item, index) => {
					const linked = item.item_number ? stonesByItem.has(item.item_number) : false;
					const isSelected = selected.has(index);
					const descriptors = [
						item.carat_weight && `${item.carat_weight} ct`,
						item.color,
						item.shape,
					].filter(Boolean).join(" · ");

					return (
						<div key={item.item_number || index}
						     className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
							     linked
								     ? "border-border-light bg-background-creme/20 opacity-60"
								     : isSelected
									     ? "border-foreground/20 bg-background-creme/40"
									     : "border-border-light hover:bg-background-creme/20"
						     } ${!linked ? "cursor-pointer" : ""}`}
						     onClick={() => !linked && toggleItem(index)}>
							<div className="pt-0.5 shrink-0">
								{linked ? (
									<div className="w-4 h-4 rounded border border-green-400 bg-green-100 flex items-center justify-center">
										<svg className="w-2.5 h-2.5 text-green-600"
										     fill="none"
										     viewBox="0 0 24 24"
										     stroke="currentColor"
										     strokeWidth={3}>
											<path strokeLinecap="round"
											      strokeLinejoin="round"
											      d="M4.5 12.75l6 6 9-13.5" />
										</svg>
									</div>
								) : (
									<div className={`w-4 h-4 rounded border transition-colors ${
										isSelected ? "border-foreground bg-foreground" : "border-border"
									} flex items-center justify-center`}>
										{isSelected && (
											<svg className="w-2.5 h-2.5 text-background"
											     fill="none"
											     viewBox="0 0 24 24"
											     stroke="currentColor"
											     strokeWidth={3}>
												<path strokeLinecap="round"
												      strokeLinejoin="round"
												      d="M4.5 12.75l6 6 9-13.5" />
											</svg>
										)}
									</div>
								)}
							</div>

							<div className="flex-1 min-w-0">
								<div className="flex items-center gap-2">
									<span className="text-sm font-medium">{item.name ?? "Unknown"}</span>
									{item.item_number && (
										<span className="text-xs text-text-gray font-mono">#{item.item_number}</span>
									)}
									{linked && (
										<span className="text-xs text-green-700">Already linked</span>
									)}
								</div>
								{descriptors && (
									<div className="text-xs text-text-gray mt-0.5">{descriptors}</div>
								)}
								<div className="flex gap-4 mt-1 text-xs text-text-gray">
									{item.gross_eur != null && <span>{money(item.gross_eur, "eur")}</span>}
									{item.gross_usd != null && <span>{money(item.gross_usd, "usd")}</span>}
								</div>

								{!linked && isSelected && (
									<div className="mt-2 pt-2 border-t border-border-light text-xs text-text-gray/60 flex items-center gap-1.5">
										<svg className="w-3 h-3"
										     fill="none"
										     viewBox="0 0 24 24"
										     stroke="currentColor">
											<path strokeLinecap="round"
											      strokeLinejoin="round"
											      strokeWidth={1.5}
											      d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
										</svg>
										Stone: {item.name || "Unknown Stone"}
										{item.carat_weight && <> · {item.carat_weight} ct</>}
										{item.color && <> · {item.color}</>}
									</div>
								)}
							</div>
						</div>
					);
				})}
			</div>
		</SlidePanel>
	);
}
