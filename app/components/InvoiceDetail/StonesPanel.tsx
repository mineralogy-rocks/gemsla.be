"use client";

import Link from "next/link";

import { money } from "@/app/invoices/lib/format";
import type { StoneListItem } from "@/app/api/stones/types";


interface StonesPanelProps {
	stones: StoneListItem[];
}


const pillBase = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";


function stoneCost(stone: StoneListItem): number | null {
	return stone.adjusted_price_eur ?? stone.gross_eur;
}


export function StonesPanel({ stones }: StonesPanelProps) {
	if (stones.length === 0) {
		return (
			<div className="rounded-lg border border-border-light p-4 text-text-gray text-xs">
				No stones created from this invoice yet.
			</div>
		);
	}


	return (
		<div className="space-y-2">
			{stones.map((stone) => {
				const cost = stoneCost(stone);

				return (
					<div key={stone.id}
					     className={`rounded-lg border p-3 ${
						     stone.is_sold
							     ? "border-border-light bg-background-creme/20"
							     : "border-border-light"
					     }`}>
						<div className="min-w-0">
							<div className="flex items-center gap-2 flex-wrap">
								<span className="text-sm font-medium">
									{stone.name}
									<span className="font-normal text-text-gray">
										{stone.color && ` · ${stone.color.toLowerCase()}`}
										{stone.weight_carats && ` · ${stone.weight_carats} ct`}
									</span>
								</span>
								<span className={`${pillBase} ${stone.is_sold ? "bg-gray-100 text-gray-700" : "bg-green-100 text-green-800"}`}>
									{stone.is_sold ? "Sold" : "Available"}
								</span>
							</div>

							<Link href={`/stones/${stone.id}`}
							      className="font-mono text-xs text-callout-accent hover:text-callout-accent-hover transition-colors underline decoration-callout-accent/30 hover:decoration-callout-accent truncate block mt-0.5">
								{stone.id}
							</Link>

							{stone.description && (
								<div className="text-xs text-text-gray mt-1 line-clamp-2">
									{stone.description}
								</div>
							)}

							<div className="flex items-center gap-4 mt-1.5 text-xs">
								{cost != null && (
									<span className="text-text-gray">
										Cost {money(cost, "eur")}
									</span>
								)}
								{stone.selling_price != null && (
									<span className="text-text-gray">
										Selling {money(stone.selling_price, "eur")}
									</span>
								)}
								{stone.is_sold && stone.sold_price != null && (
									<span className="text-text-gray">
										Sold {money(stone.sold_price, "eur")}
									</span>
								)}
							</div>
						</div>
					</div>
				);
			})}
		</div>
	);
}