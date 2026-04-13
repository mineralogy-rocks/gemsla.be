"use client";

import { useState, useCallback, useEffect } from "react";
import toast from "react-hot-toast";

import { SlidePanel } from "../SlidePanel";
import { Button } from "../Button";
import { money } from "@/app/invoices/lib/format";
import type { InvoiceItem, StoneListItem } from "@/app/api/stones/types";


interface BatchStoneLinkingProps {
	isOpen: boolean;
	onClose: () => void;
	items: InvoiceItem[];
	stones: StoneListItem[];
	invoiceId: string;
	onComplete: () => void;
}

interface ItemState {
	item: InvoiceItem;
	index: number;
	linkedStone: StoneListItem | null;
	validatedStone: StoneListItem | null;
	isUuid: boolean;
}


const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(val: string | null | undefined): boolean {
	return val != null && UUID_RE.test(val);
}


export function BatchStoneLinking({
	isOpen,
	onClose,
	items,
	stones,
	invoiceId,
	onComplete,
}: BatchStoneLinkingProps) {
	const [selected, setSelected] = useState<Set<number>>(new Set());
	const [soldPrices, setSoldPrices] = useState<Map<number, string>>(new Map());
	const [submitting, setSubmitting] = useState(false);
	const [validatedStones, setValidatedStones] = useState<Map<string, StoneListItem>>(new Map());
	const [loading, setLoading] = useState(false);

	const stonesByItem = new Map<string, StoneListItem>();
	for (const s of stones) {
		if (s.item_number) stonesByItem.set(s.item_number, s);
	}

	const uuidItems = items
		.map((item, index) => ({ item, index }))
		.filter(({ item }) => isUuid(item.item_number));

	useEffect(() => {
		if (!isOpen || uuidItems.length === 0) return;

		const unlinkedUuids = uuidItems
			.filter(({ item }) => !stonesByItem.has(item.item_number!))
			.map(({ item }) => item.item_number!);

		if (unlinkedUuids.length === 0) return;

		setLoading(true);
		fetch("/api/stones/validate", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ ids: unlinkedUuids }),
		})
			.then((res) => res.json())
			.then((data) => {
				const map = new Map<string, StoneListItem>();
				for (const stone of data.found ?? []) {
					map.set(stone.id, stone);
				}
				setValidatedStones(map);
			})
			.catch(() => {})
			.finally(() => setLoading(false));
	}, [isOpen]);

	const itemStates: ItemState[] = items.map((item, index) => {
		const uuid = item.item_number;
		const hasUuid = isUuid(uuid);
		const linkedStone = hasUuid ? stonesByItem.get(uuid!) ?? null : null;
		const validatedStone = hasUuid && !linkedStone ? validatedStones.get(uuid!) ?? null : null;

		return { item, index, linkedStone, validatedStone, isUuid: hasUuid };
	});

	const selectableItems = itemStates.filter(
		(is) => is.linkedStone && !is.linkedStone.is_sold
	);

	useEffect(() => {
		if (!isOpen) return;
		const initial = new Set<number>();
		const prices = new Map<number, string>();
		for (const is of selectableItems) {
			initial.add(is.index);
			const price = is.item.gross_eur ?? is.item.price_eur;
			if (price != null) {
				prices.set(is.index, String(price));
			}
		}
		setSelected(initial);
		setSoldPrices(prices);
	}, [isOpen, stones.length]);

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

	const updatePrice = useCallback((index: number, value: string) => {
		setSoldPrices((prev) => {
			const next = new Map(prev);
			next.set(index, value);
			return next;
		});
	}, []);

	const handleConfirm = useCallback(async () => {
		const toMark = selectableItems.filter(({ index }) => selected.has(index));
		if (toMark.length === 0) return;

		setSubmitting(true);
		try {
			const payload = {
				stones: toMark.map(({ item, index }) => ({
					stone_id: item.item_number!,
					sold_price: soldPrices.has(index) ? parseFloat(soldPrices.get(index)!) || null : null,
				})),
			};

			const res = await fetch(`/api/invoices/${invoiceId}/mark-stones-sold`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});

			if (!res.ok) {
				const err = await res.json();
				throw new Error(err.error || "Failed to mark stones as sold");
			}

			const result = await res.json();
			toast.success(`Marked ${result.updated} stone${result.updated !== 1 ? "s" : ""} as sold`);
			onComplete();
			onClose();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Failed to mark stones as sold");
		} finally {
			setSubmitting(false);
		}
	}, [selectableItems, selected, soldPrices, invoiceId, onComplete, onClose]);

	const selectedCount = [...selected].filter((idx) =>
		selectableItems.some(({ index }) => index === idx)
	).length;

	const hasUuidItems = uuidItems.length > 0;


	return (
		<SlidePanel isOpen={isOpen}
		            onClose={onClose}
		            title="Mark stones as sold"
		            footer={
			            <div className="flex items-center justify-between gap-3">
				            <div className="text-xs text-text-gray">
					            {selectedCount} of {selectableItems.length} selected
				            </div>
				            <div className="flex gap-2">
					            <Button variant="ghost"
					                    size="sm"
					                    onClick={onClose}
					                    disabled={submitting}>
						            Cancel
					            </Button>
					            <Button variant="primary"
					                    size="sm"
					                    onClick={handleConfirm}
					                    loading={submitting}
					                    disabled={selectedCount === 0}>
						            Mark {selectedCount} as sold
					            </Button>
				            </div>
			            </div>
		            }>
			{loading ? (
				<div className="flex items-center justify-center py-12">
					<div className="h-5 w-5 rounded-full border-2 border-text-gray/40 border-t-text-gray animate-spin" />
				</div>
			) : !hasUuidItems ? (
				<div className="text-sm text-text-gray py-8 text-center">
					No items with stone references found on this invoice.
				</div>
			) : (
				<div className="space-y-1">
					{itemStates.map((is) => {
						if (!is.isUuid) return null;

						const { item, index, linkedStone, validatedStone } = is;
						const isLinked = linkedStone != null;
						const alreadySold = linkedStone?.is_sold === true;
						const canSelect = isLinked && !alreadySold;
						const isSelected = selected.has(index);

						return (
							<div key={item.item_number || index}
							     className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
								     alreadySold
									     ? "border-amber-200 bg-amber-50/30"
									     : isLinked
										     ? isSelected
											     ? "border-foreground/20 bg-background-creme/40"
											     : "border-border-light hover:bg-background-creme/20"
										     : "border-red-200 bg-red-50/20"
							     } ${canSelect ? "cursor-pointer" : ""}`}
							     onClick={() => canSelect && toggleItem(index)}>
								<div className="pt-0.5 shrink-0">
									{alreadySold ? (
										<div className="w-4 h-4 rounded border border-amber-400 bg-amber-100 flex items-center justify-center">
											<svg className="w-2.5 h-2.5 text-amber-600"
											     fill="none"
											     viewBox="0 0 24 24"
											     stroke="currentColor"
											     strokeWidth={3}>
												<path strokeLinecap="round"
												      strokeLinejoin="round"
												      d="M4.5 12.75l6 6 9-13.5" />
											</svg>
										</div>
									) : isLinked ? (
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
									) : (
										<div className="w-4 h-4 rounded border border-red-300 bg-red-100 flex items-center justify-center">
											<svg className="w-2.5 h-2.5 text-red-500"
											     fill="none"
											     viewBox="0 0 24 24"
											     stroke="currentColor"
											     strokeWidth={2.5}>
												<path strokeLinecap="round"
												      strokeLinejoin="round"
												      d="M6 18L18 6M6 6l12 12" />
											</svg>
										</div>
									)}
								</div>

								<div className="flex-1 min-w-0">
									<div className="flex items-center gap-2 flex-wrap">
										<span className="text-xs text-text-gray font-mono truncate max-w-[220px]">
											{item.item_number}
										</span>
										{isLinked && (
											<span className="text-xs text-green-700 flex items-center gap-1">
												<svg className="w-3 h-3"
												     fill="none"
												     viewBox="0 0 24 24"
												     stroke="currentColor"
												     strokeWidth={2}>
													<path strokeLinecap="round"
													      strokeLinejoin="round"
													      d="M4.5 12.75l6 6 9-13.5" />
												</svg>
												Linked
											</span>
										)}
										{alreadySold && (
											<span className="text-xs text-amber-700">
												Already sold{linkedStone.sold_price != null && ` (${money(linkedStone.sold_price, "eur")})`}
											</span>
										)}
										{!isLinked && (
											<span className="text-xs text-red-600">Stone not found</span>
										)}
									</div>

									{isLinked && linkedStone && (
										<div className="text-sm font-medium mt-0.5">
											{linkedStone.name}
											<span className="font-normal text-text-gray">
												{linkedStone.color && ` · ${linkedStone.color.toLowerCase()}`}
												{linkedStone.weight_carats && ` · ${linkedStone.weight_carats} ct`}
											</span>
										</div>
									)}

									{!isLinked && validatedStone && (
										<div className="text-xs text-text-gray mt-0.5">
											Found but not auto-linked: {validatedStone.name}
										</div>
									)}

									<div className="flex gap-4 mt-1 text-xs text-text-gray">
										{item.name && <span>{item.name}</span>}
										{item.gross_eur != null && <span>{money(item.gross_eur, "eur")}</span>}
									</div>

									{canSelect && isSelected && (
										<div className="mt-2 pt-2 border-t border-border-light"
										     onClick={(e) => e.stopPropagation()}>
											<label className="text-xs text-text-gray block mb-1">Sold price (EUR)</label>
											<input type="number"
											       step="0.01"
											       min="0"
											       value={soldPrices.get(index) ?? ""}
											       onChange={(e) => updatePrice(index, e.target.value)}
											       className="w-full max-w-[160px] rounded-md border border-border bg-background px-2.5 py-1 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-callout-accent tabular-nums" />
										</div>
									)}
								</div>
							</div>
						);
					})}
				</div>
			)}
		</SlidePanel>
	);
}
