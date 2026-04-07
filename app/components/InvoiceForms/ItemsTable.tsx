"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";

import { Button } from "@/app/components/Button";
import type { InvoiceItem } from "@/app/api/stones/types";
import type { ItemFormData } from "./InvoiceForms.types";


interface ItemsTableProps {
	items: ItemFormData[];
	onItemChange: (index: number, field: string, value: string) => void;
	onCreateStone?: (index: number) => void;
	existingItemNumbers?: Set<string>;
	creditNoteItems?: InvoiceItem[];
	readOnly?: boolean;
}

const COLUMNS: { key: keyof ItemFormData; label: string; type: "text" | "number"; width: string }[] = [
	{ key: "item_number", label: "Item #", type: "text", width: "w-28" },
	{ key: "name", label: "Name", type: "text", width: "w-36" },
	{ key: "carat_weight", label: "Carats", type: "number", width: "w-20" },
	{ key: "dimensions", label: "Dims", type: "text", width: "w-24" },
	{ key: "shape", label: "Shape", type: "text", width: "w-24" },
	{ key: "color", label: "Color", type: "text", width: "w-24" },
	{ key: "treatment", label: "Treatment", type: "text", width: "w-24" },
	{ key: "origin", label: "Origin", type: "text", width: "w-24" },
	{ key: "piece_count", label: "Pcs", type: "number", width: "w-16" },
	{ key: "price_eur", label: "Price €", type: "number", width: "w-24" },
	{ key: "price_usd", label: "Price $", type: "number", width: "w-24" },
	{ key: "shipment_eur", label: "Ship €", type: "number", width: "w-22" },
	{ key: "shipment_usd", label: "Ship $", type: "number", width: "w-22" },
	{ key: "vat_eur", label: "VAT €", type: "number", width: "w-22" },
	{ key: "vat_usd", label: "VAT $", type: "number", width: "w-22" },
	{ key: "gross_eur", label: "Gross €", type: "number", width: "w-24" },
	{ key: "gross_usd", label: "Gross $", type: "number", width: "w-24" },
];

const PRICE_FIELDS = ["price_eur", "price_usd", "shipment_eur", "shipment_usd", "vat_eur", "vat_usd", "gross_eur", "gross_usd"] as const;


function formatDiff(original: number | null, adjustment: number | null): { adjustment: string; result: string } | null {
	if (adjustment == null || adjustment === 0) return null;
	const orig = original ?? 0;
	const result = orig + adjustment;
	return {
		adjustment: adjustment > 0 ? `+${adjustment.toFixed(2)}` : adjustment.toFixed(2),
		result: result.toFixed(2),
	};
}


export function ItemsTable({ items, onItemChange, onCreateStone, existingItemNumbers, creditNoteItems, readOnly }: ItemsTableProps) {
	const creditNoteMap = useMemo(() => {
		if (!creditNoteItems?.length) return null;
		const map = new Map<string, InvoiceItem>();
		for (const item of creditNoteItems) {
			if (item.item_number) map.set(item.item_number, item);
		}
		return map;
	}, [creditNoteItems]);


	return (
		<div className="overflow-x-auto rounded-lg border border-border">
			<table className="w-full text-xs">
				<thead>
					<tr className="border-b border-border bg-background-creme/50">
						{COLUMNS.map((col) => (
							<th key={col.key}
							    className={`px-2 py-2 text-left font-medium text-text-gray uppercase tracking-wider whitespace-nowrap ${col.width}`}>
								{col.label}
							</th>
						))}
						{onCreateStone && (
							<th className="px-2 py-2 w-10" />
						)}
					</tr>
				</thead>
				<tbody>
					{items.map((item, i) => {
						const hasStone = !!(item.item_number && existingItemNumbers?.has(item.item_number));
						const cnItem = creditNoteMap?.get(item.item_number);

						return (
							<>
								<tr key={item._id}
								    className="border-b border-border-light hover:bg-background-creme/30 transition-colors">
									{COLUMNS.map((col) => (
										<td key={col.key}
										    className="px-1 py-1">
											{readOnly ? (
												<span className="block px-1 py-0.5 text-foreground tabular-nums">
													{item[col.key] || "-"}
												</span>
											) : (
												<input type={col.type}
												       step={col.type === "number" ? "0.01" : undefined}
												       value={item[col.key]}
												       onChange={(e) => onItemChange(i, col.key, e.target.value)}
												       className={`w-full rounded border border-transparent bg-transparent px-1 py-0.5 text-foreground tabular-nums outline-none transition-colors hover:border-border focus:border-callout-accent focus:bg-white ${col.width}`} />
											)}
										</td>
									))}
									{onCreateStone && (
										<td className="px-1 py-1 text-center">
											{hasStone ? (
												<svg className="mx-auto h-4 w-4 text-green-500"
												     fill="none"
												     viewBox="0 0 24 24"
												     stroke="currentColor"
												     strokeWidth={2}>
													<path strokeLinecap="round"
													      strokeLinejoin="round"
													      d="M5 13l4 4L19 7" />
												</svg>
											) : (
												<Button variant="ghost"
												        size="sm"
												        onClick={() => onCreateStone(i)}
												        className="!p-0.5 !min-w-0">
													<svg className="h-4 w-4 text-text-gray"
													     fill="none"
													     viewBox="0 0 24 24"
													     stroke="currentColor"
													     strokeWidth={1.5}>
														<path strokeLinecap="round"
														      strokeLinejoin="round"
														      d="M12 4.5v15m7.5-7.5h-15" />
													</svg>
												</Button>
											)}
										</td>
									)}
								</tr>

								{cnItem && (
									<motion.tr key={`${item._id}-cn`}
									           initial={{ opacity: 0 }}
									           animate={{ opacity: 1 }}
									           className="border-b border-border-light bg-amber-50/30">
										{COLUMNS.map((col) => {
											const field = col.key as string;
											if (PRICE_FIELDS.includes(field as typeof PRICE_FIELDS[number])) {
												const origVal = item[col.key] ? parseFloat(item[col.key]) : null;
												const cnVal = cnItem[field as keyof InvoiceItem] as number | null;
												const diff = formatDiff(origVal, cnVal);

												return (
													<td key={col.key}
													    className="px-1 py-1">
														{diff ? (
															<div className="flex flex-col gap-0.5 px-1">
																<span className="text-red-600 tabular-nums">{diff.adjustment}</span>
																<span className="text-green-700 font-medium tabular-nums">= {diff.result}</span>
															</div>
														) : (
															<span className="block px-1 text-text-gray">-</span>
														)}
													</td>
												);
											}
											return (
												<td key={col.key}
												    className="px-1 py-1">
													<span className="block px-1 text-text-gray/50">
														{col.key === "name" ? "↳ credit note" : ""}
													</span>
												</td>
											);
										})}
										{onCreateStone && <td />}
									</motion.tr>
								)}
							</>
						);
					})}
				</tbody>
			</table>
		</div>
	);
}
