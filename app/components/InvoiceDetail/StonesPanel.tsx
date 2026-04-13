"use client";

import Link from "next/link";

import { money } from "@/app/invoices/lib/format";
import type { StoneListItem } from "@/app/api/stones/types";


interface StonesPanelProps {
	stones: StoneListItem[];
}


const pillBase = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";


export function StonesPanel({ stones }: StonesPanelProps) {
	if (stones.length === 0) {
		return (
			<div className="rounded-lg border border-border-light p-4 text-text-gray text-xs">
				No stones created from this invoice yet.
			</div>
		);
	}

	return (
		<div className="rounded-lg border border-border-light p-4">
			{stones.map((stone, idx) => (
				<div key={stone.id}
				     className={`flex items-center gap-3.5 py-2.5 ${idx > 0 ? "border-t border-border-light" : ""}`}>
					<div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-medium shrink-0">
						{stone.name.slice(0, 2)}
					</div>

					<div className="min-w-0 flex-1">
						<div className="text-sm font-medium">
							{stone.name}
							<span className="font-normal text-text-gray">
								{stone.color && ` · ${stone.color.toLowerCase()}`}
								{stone.weight_carats && ` · ${stone.weight_carats} ct`}
							</span>
						</div>
						<div className="text-xs text-text-gray/60">
							Cost basis {money(stone.selling_price, "eur")}
							{stone.selling_price ? ` · Listed at ${money(stone.selling_price, "eur")}` : " · No selling price set"}
						</div>
					</div>

					<span className={`${pillBase} ${stone.is_sold ? "bg-gray-100 text-gray-700" : "bg-green-100 text-green-800"}`}>
						{stone.is_sold ? "Sold" : "Available"}
					</span>

					<Link href={`/stones/${stone.id}`}>
						<button className="text-xs px-2 py-1 rounded border border-border-light hover:bg-background-creme/50 transition-colors">
							Open
						</button>
					</Link>
				</div>
			))}
		</div>
	);
}
