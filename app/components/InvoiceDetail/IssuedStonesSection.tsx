"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import toast from "react-hot-toast";

import { Button } from "../Button";
import { money } from "@/app/invoices/lib/format";
import type { InvoiceItem, StoneListItem } from "@/app/api/stones/types";


interface IssuedStonesSectionProps {
	items: InvoiceItem[];
	stones: StoneListItem[];
	invoiceId: string;
	onComplete: () => void;
}

interface SearchResult {
	id: string;
	name: string;
	color: string | null;
	weight_carats: number | null;
	is_sold: boolean;
}

interface MergedRow {
	item: InvoiceItem;
	itemIndex: number;
	linkedStone: StoneListItem | null;
	isUuid: boolean;
}


const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const pillBase = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";


function stoneCost(stone: StoneListItem): number | null {
	return stone.adjusted_price_eur ?? stone.gross_eur;
}

function stoneProfit(stone: StoneListItem): number | null {
	if (!stone.is_sold || stone.sold_price == null) return null;
	const cost = stoneCost(stone);
	if (cost == null) return null;
	return stone.sold_price - cost;
}


function StoneSearchDropdown({
	onLink,
}: {
	onLink: (stoneId: string) => void;
}) {
	const [query, setQuery] = useState("");
	const [results, setResults] = useState<SearchResult[]>([]);
	const [loading, setLoading] = useState(false);
	const [isOpen, setIsOpen] = useState(false);
	const [activeIndex, setActiveIndex] = useState(-1);
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (timerRef.current) clearTimeout(timerRef.current);

		if (!query.trim()) {
			setResults([]);
			setIsOpen(false);
			return;
		}

		timerRef.current = setTimeout(async () => {
			setLoading(true);
			try {
				const res = await fetch(`/api/stones/search?q=${encodeURIComponent(query.trim())}`);
				if (!res.ok) throw new Error();
				const data = await res.json();
				setResults(data.stones || []);
				setIsOpen(true);
				setActiveIndex(-1);
			} catch {
				toast.error("Failed to search stones");
				setResults([]);
			} finally {
				setLoading(false);
			}
		}, 300);

		return () => {
			if (timerRef.current) clearTimeout(timerRef.current);
		};
	}, [query]);

	useEffect(() => {
		function handleClickOutside(e: MouseEvent) {
			if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
				setIsOpen(false);
			}
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
		if (!isOpen || results.length === 0) return;

		if (e.key === "ArrowDown") {
			e.preventDefault();
			setActiveIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
		} else if (e.key === "ArrowUp") {
			e.preventDefault();
			setActiveIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
		} else if (e.key === "Enter" && activeIndex >= 0) {
			e.preventDefault();
			onLink(results[activeIndex].id);
			setQuery("");
			setIsOpen(false);
		} else if (e.key === "Escape") {
			setIsOpen(false);
		}
	}, [isOpen, results, activeIndex, onLink]);

	return (
		<div ref={containerRef}
		     className="relative">
			<div className="relative">
				<svg className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-gray"
				     fill="none"
				     viewBox="0 0 24 24"
				     stroke="currentColor">
					<path strokeLinecap="round"
					      strokeLinejoin="round"
					      strokeWidth={1.5}
					      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
				</svg>
				<input ref={inputRef}
				       type="text"
				       value={query}
				       onChange={(e) => setQuery(e.target.value)}
				       onKeyDown={handleKeyDown}
				       onFocus={() => { if (results.length > 0) setIsOpen(true); }}
				       placeholder="Search stone by name..."
				       className="w-full rounded-md border border-border bg-background py-1.5 pl-8 pr-3 text-xs text-foreground placeholder:text-text-gray/60 focus:border-callout-accent focus:outline-none focus:ring-1 focus:ring-callout-accent" />
				{loading && (
					<div className="absolute right-2.5 top-1/2 -translate-y-1/2">
						<div className="h-3 w-3 rounded-full border-2 border-text-gray/40 border-t-text-gray animate-spin" />
					</div>
				)}
			</div>

			{isOpen && (
				<div className="absolute z-20 mt-1 w-full max-h-48 overflow-auto rounded-lg border border-border-light bg-background shadow-lg">
					{results.length === 0 ? (
						<div className="px-3 py-4 text-xs text-text-gray text-center">
							No stones found
						</div>
					) : (
						results.map((stone, idx) => (
							<button key={stone.id}
							        type="button"
							        onClick={() => {
								        onLink(stone.id);
								        setQuery("");
								        setIsOpen(false);
							        }}
							        className={`w-full text-left px-3 py-2 text-xs transition-colors cursor-pointer ${
								        idx === activeIndex
									        ? "bg-background-creme"
									        : "hover:bg-background-creme/50"
							        } ${idx > 0 ? "border-t border-border-light" : ""}`}>
								<div className="flex items-center gap-2">
									<div className="min-w-0 flex-1">
										<span className="font-medium">{stone.name}</span>
										<span className="text-text-gray">
											{stone.color && ` · ${stone.color.toLowerCase()}`}
											{stone.weight_carats && ` · ${stone.weight_carats} ct`}
										</span>
										<div className="font-mono text-[10px] text-text-gray/60 mt-0.5 truncate">
											{stone.id}
										</div>
									</div>
									{stone.is_sold && (
										<span className={`${pillBase} bg-gray-100 text-gray-700 shrink-0`}>Sold</span>
									)}
								</div>
							</button>
						))
					)}
				</div>
			)}
		</div>
	);
}


export function IssuedStonesSection({
	items,
	stones,
	invoiceId,
	onComplete,
}: IssuedStonesSectionProps) {
	const [selected, setSelected] = useState<Set<number>>(new Set());
	const [soldPrices, setSoldPrices] = useState<Map<number, string>>(new Map());
	const [submitting, setSubmitting] = useState(false);
	const [unlinking, setUnlinking] = useState<string | null>(null);
	const [confirmUnlink, setConfirmUnlink] = useState<string | null>(null);
	const [showAddStone, setShowAddStone] = useState(false);

	const stoneMap = useMemo(() => {
		const map = new Map<string, StoneListItem>();
		for (const s of stones) {
			map.set(s.id, s);
			if (s.item_number) map.set(s.item_number, s);
		}
		return map;
	}, [stones]);

	const rows: MergedRow[] = useMemo(() => {
		return items.map((item, idx) => {
			const uuid = item.item_number;
			const isUuid = uuid != null && UUID_RE.test(uuid);
			const linkedStone = isUuid ? stoneMap.get(uuid!) ?? null : null;
			return { item, itemIndex: idx, linkedStone, isUuid };
		});
	}, [items, stoneMap]);

	const selectableRows = useMemo(() => {
		return rows.filter((r) => r.linkedStone && !r.linkedStone.is_sold);
	}, [rows]);

	const totalProfit = useMemo(() => {
		let sum = 0;
		let hasAny = false;
		for (const r of rows) {
			if (!r.linkedStone) continue;
			const p = stoneProfit(r.linkedStone);
			if (p != null) {
				sum += p;
				hasAny = true;
			}
		}
		return hasAny ? sum : null;
	}, [rows]);

	useEffect(() => {
		const initial = new Set<number>();
		const prices = new Map<number, string>();
		for (const r of selectableRows) {
			initial.add(r.itemIndex);
			const price = r.item.gross_eur ?? r.item.price_eur;
			if (price != null) prices.set(r.itemIndex, String(price));
		}
		setSelected(initial);
		setSoldPrices(prices);
	}, [selectableRows.length]);

	const selectedCount = useMemo(() => {
		return [...selected].filter((idx) =>
			selectableRows.some((r) => r.itemIndex === idx)
		).length;
	}, [selected, selectableRows]);

	const toggleItem = useCallback((index: number) => {
		setSelected((prev) => {
			const next = new Set(prev);
			if (next.has(index)) next.delete(index);
			else next.add(index);
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

	const handleLink = useCallback(async (stoneId: string) => {
		try {
			const res = await fetch(`/api/invoices/${invoiceId}/stones`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ stone_id: stoneId }),
			});
			if (!res.ok) {
				const err = await res.json();
				throw new Error(err.error || "Failed to link stone");
			}
			toast.success("Stone linked");
			setShowAddStone(false);
			onComplete();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Failed to link stone");
		}
	}, [invoiceId, onComplete]);

	const handleUnlink = useCallback(async (stoneId: string) => {
		setUnlinking(stoneId);
		try {
			const res = await fetch(`/api/invoices/${invoiceId}/stones`, {
				method: "DELETE",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ stone_id: stoneId }),
			});
			if (!res.ok) {
				const err = await res.json();
				throw new Error(err.error || "Failed to unlink stone");
			}
			toast.success("Stone unlinked");
			setConfirmUnlink(null);
			onComplete();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Failed to unlink stone");
		} finally {
			setUnlinking(null);
		}
	}, [invoiceId, onComplete]);

	const handleMarkSold = useCallback(async () => {
		const toMark = selectableRows.filter(({ itemIndex }) => selected.has(itemIndex));
		if (toMark.length === 0) return;

		setSubmitting(true);
		try {
			const payload = {
				stones: toMark.map(({ item, itemIndex }) => ({
					stone_id: item.item_number!,
					sold_price: soldPrices.has(itemIndex) ? parseFloat(soldPrices.get(itemIndex)!) || null : null,
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
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Failed to mark stones as sold");
		} finally {
			setSubmitting(false);
		}
	}, [selectableRows, selected, soldPrices, invoiceId, onComplete]);

	const linkedCount = rows.filter((r) => r.linkedStone).length;
	const unlinkedCount = rows.filter((r) => r.isUuid && !r.linkedStone).length;


	return (
		<div>
			<div className="flex items-center justify-between mb-3">
				<div className="flex items-center gap-3">
					<div className="text-xs font-medium uppercase tracking-wider text-text-gray">
						Items ({linkedCount} linked{unlinkedCount > 0 ? `, ${unlinkedCount} unlinked` : ""})
					</div>
					{totalProfit != null && (
						<div className={`text-xs font-medium tabular-nums ${totalProfit >= 0 ? "text-green-700" : "text-red-600"}`}>
							{totalProfit >= 0 ? "+" : ""}{money(totalProfit, "eur")} profit
						</div>
					)}
				</div>
				{selectedCount > 0 && (
					<Button variant="primary"
					        size="sm"
					        onClick={handleMarkSold}
					        loading={submitting}
					        disabled={selectedCount === 0}>
						Mark {selectedCount} as sold
					</Button>
				)}
			</div>

			{rows.length === 0 && !showAddStone ? (
				<div className="rounded-lg border border-border-light p-4 text-text-gray text-xs">
					No items linked to this invoice yet.
				</div>
			) : (
				<div className="space-y-2">
					{rows.map((row) => {
						const { item, itemIndex, linkedStone, isUuid } = row;

						if (linkedStone) {
							const alreadySold = linkedStone.is_sold;
							const canSelect = !alreadySold;
							const isSelected = selected.has(itemIndex);
							const profit = stoneProfit(linkedStone);
							const cost = stoneCost(linkedStone);

							return (
								<div key={item.item_number || itemIndex}
								     className={`relative rounded-lg border p-3 transition-colors ${
									     alreadySold
										     ? "border-border-light bg-background-creme/20"
										     : isSelected
											     ? "border-foreground/20 bg-background-creme/40"
											     : "border-border-light hover:bg-background-creme/20"
								     }`}>
									{confirmUnlink === linkedStone.id ? (
										<div className="absolute top-2 right-2 flex items-center gap-1 z-10">
											<button onClick={() => handleUnlink(linkedStone.id)}
											        disabled={unlinking === linkedStone.id}
											        className="text-[10px] px-1.5 py-0.5 rounded border border-red-300 text-red-600 hover:bg-red-50 transition-colors cursor-pointer">
												{unlinking === linkedStone.id ? "..." : "Confirm"}
											</button>
											<button onClick={() => setConfirmUnlink(null)}
											        className="text-[10px] px-1.5 py-0.5 rounded border border-border-light hover:bg-background-creme/50 transition-colors cursor-pointer">
												Cancel
											</button>
										</div>
									) : (
										<button className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-text-gray/40 hover:text-foreground hover:bg-background-creme transition-colors cursor-pointer z-10"
										        onClick={() => setConfirmUnlink(linkedStone.id)}
										        title="Unlink stone">
											<svg className="w-3.5 h-3.5"
											     fill="none"
											     viewBox="0 0 24 24"
											     stroke="currentColor"
											     strokeWidth={2}>
												<path strokeLinecap="round"
												      strokeLinejoin="round"
												      d="M6 18L18 6M6 6l12 12" />
											</svg>
										</button>
									)}

									<div className="flex items-start gap-3">
										{canSelect && (
											<button type="button"
											        onClick={() => toggleItem(itemIndex)}
											        className="pt-1 shrink-0 cursor-pointer">
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
											</button>
										)}

										<div className="min-w-0 flex-1 pr-6">
											<div className="flex items-center gap-2 flex-wrap">
												<span className="text-sm font-medium">
													{linkedStone.name}
													<span className="font-normal text-text-gray">
														{linkedStone.color && ` · ${linkedStone.color.toLowerCase()}`}
														{linkedStone.weight_carats && ` · ${linkedStone.weight_carats} ct`}
													</span>
												</span>
												<span className={`${pillBase} ${alreadySold ? "bg-gray-100 text-gray-700" : "bg-green-100 text-green-800"}`}>
													{alreadySold ? "Sold" : "Available"}
												</span>
											</div>

											<Link href={`/stones/${linkedStone.id}`}
											      className="font-mono text-xs text-callout-accent hover:text-callout-accent-hover transition-colors underline decoration-callout-accent/30 hover:decoration-callout-accent truncate block mt-0.5">
												{linkedStone.id}
											</Link>

											{linkedStone.description && (
												<div className="text-xs text-text-gray mt-1 line-clamp-2">
													{linkedStone.description}
												</div>
											)}

											<div className="flex items-center gap-4 mt-1.5 text-xs">
												{cost != null && (
													<span className="text-text-gray">
														Cost {money(cost, "eur")}
													</span>
												)}
												{alreadySold && linkedStone.sold_price != null && (
													<span className="text-text-gray">
														Sold {money(linkedStone.sold_price, "eur")}
													</span>
												)}
												{profit != null && (
													<span className={`font-medium tabular-nums ${profit >= 0 ? "text-green-700" : "text-red-600"}`}>
														{profit >= 0 ? "+" : ""}{money(profit, "eur")}
													</span>
												)}
											</div>

											{canSelect && isSelected && (
												<div className="mt-2 pt-2 border-t border-border-light"
												     onClick={(e) => e.stopPropagation()}>
													<label className="text-xs text-text-gray block mb-1">Sold price (EUR)</label>
													<input type="number"
													       step="0.01"
													       min="0"
													       value={soldPrices.get(itemIndex) ?? ""}
													       onChange={(e) => updatePrice(itemIndex, e.target.value)}
													       className="w-full max-w-[160px] rounded-md border border-border bg-background px-2.5 py-1 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-callout-accent tabular-nums" />
												</div>
											)}
										</div>
									</div>
								</div>
							);
						}

						if (isUuid) {
							return (
								<div key={item.item_number || itemIndex}
								     className="rounded-lg border border-amber-200 bg-amber-50/20 p-3">
									<div className="flex items-start gap-3">
										<div className="w-9 h-9 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
											<svg className="w-4 h-4"
											     fill="none"
											     viewBox="0 0 24 24"
											     stroke="currentColor"
											     strokeWidth={1.5}>
												<path strokeLinecap="round"
												      strokeLinejoin="round"
												      d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
											</svg>
										</div>

										<div className="min-w-0 flex-1">
											<div className="flex items-center gap-2 mb-1.5">
												<span className="text-xs text-amber-700 font-medium">Unlinked stone</span>
												<span className="text-xs text-text-gray font-mono truncate max-w-[180px]">
													{item.item_number}
												</span>
											</div>

											<div className="flex gap-4 mb-2 text-xs text-text-gray">
												{item.name && <span>{item.name}</span>}
												{item.color && <span>{item.color}</span>}
												{item.carat_weight && <span>{item.carat_weight} ct</span>}
												{item.gross_eur != null && <span>{money(item.gross_eur, "eur")}</span>}
											</div>

											<div className="max-w-xs">
												<StoneSearchDropdown onLink={(stoneId) => handleLink(stoneId)} />
											</div>
										</div>
									</div>
								</div>
							);
						}

						return (
							<div key={item.item_number || itemIndex}
							     className="rounded-lg border border-border-light p-3">
								<div className="flex items-center gap-3">
									<div className="text-xs text-text-gray">
										<span className="font-mono">#{item.item_number ?? itemIndex + 1}</span>
										{" "}{item.name ?? "Unknown"}
										{item.gross_eur != null && <span className="ml-2">{money(item.gross_eur, "eur")}</span>}
									</div>
								</div>
							</div>
						);
					})}


					{showAddStone ? (
						<div className="rounded-lg border border-dashed border-border p-3">
							<div className="flex items-center justify-between mb-2">
								<span className="text-xs text-text-gray font-medium">Link an item to this invoice</span>
								<button onClick={() => setShowAddStone(false)}
								        className="text-xs text-text-gray hover:text-foreground transition-colors cursor-pointer">
									<svg className="w-4 h-4"
									     fill="none"
									     viewBox="0 0 24 24"
									     stroke="currentColor"
									     strokeWidth={1.5}>
										<path strokeLinecap="round"
										      strokeLinejoin="round"
										      d="M6 18L18 6M6 6l12 12" />
									</svg>
								</button>
							</div>
							<div className="max-w-xs">
								<StoneSearchDropdown onLink={(stoneId) => handleLink(stoneId)} />
							</div>
						</div>
					) : (
						<button onClick={() => setShowAddStone(true)}
						        className="w-full rounded-lg border border-dashed border-border-light p-2.5 text-xs text-text-gray hover:text-foreground hover:border-border hover:bg-background-creme/20 transition-colors flex items-center justify-center gap-1.5 cursor-pointer">
							<svg className="w-3.5 h-3.5"
							     fill="none"
							     viewBox="0 0 24 24"
							     stroke="currentColor"
							     strokeWidth={1.5}>
								<path strokeLinecap="round"
								      strokeLinejoin="round"
								      d="M12 4.5v15m7.5-7.5h-15" />
							</svg>
							Add item
						</button>
					)}
				</div>
			)}
		</div>
	);
}