"use client";

import Link from "next/link";

import { money, fmtDate } from "@/app/lib/format";
import type { StoneInvoice } from "@/app/api/stones/types";


interface StoneDocumentsListProps {
	stoneInvoices: StoneInvoice[];
}


export function StoneDocumentsList({ stoneInvoices }: StoneDocumentsListProps) {
	if (!stoneInvoices.length) {
		return (
			<div className="rounded-lg border border-border-light p-4">
				<div className="text-xs text-text-gray uppercase tracking-wider mb-3">Documents</div>
				<div className="text-xs text-text-gray">
					No invoices linked to this stone
				</div>
			</div>
		);
	}


	return (
		<div className="rounded-lg border border-border-light p-4">
			<div className="text-xs text-text-gray uppercase tracking-wider mb-3">Documents</div>

			{stoneInvoices.map((si) => {
				const inv = si.invoices;
				const isCreditNote = inv.type === "credit_note";
				const iconColor = isCreditNote ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700";
				const label = isCreditNote
					? `Credit note ${inv.invoice_number || ""}`
					: inv.type === "issued" ? "Issued invoice" : "Tax invoice";

				return (
					<div key={si.invoice_id}
					     className="flex items-center gap-3 p-2.5 border border-border-light rounded-lg mb-2">
						<div className={`w-8 h-8 rounded-lg ${iconColor} flex items-center justify-center shrink-0`}>
							<svg xmlns="http://www.w3.org/2000/svg"
							     viewBox="0 0 24 24"
							     fill="currentColor"
							     className="w-4 h-4">
								<path d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0 0 16.5 9h-1.875a1.875 1.875 0 0 1-1.875-1.875V5.25A3.75 3.75 0 0 0 9 1.5H5.625Z" />
								<path d="M12.971 1.816A5.23 5.23 0 0 1 14.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 0 1 3.434 1.279 9.768 9.768 0 0 0-6.963-6.963Z" />
							</svg>
						</div>

						<div className="min-w-0 flex-1">
							<div className="text-xs font-medium">{label}</div>
							<div className="text-xs text-text-gray/60 font-mono truncate">
								{inv.invoice_number || inv.original_invoice_number || inv.id}
							</div>
						</div>

						<div className="flex items-center gap-1.5 shrink-0">
							{inv.signed_url && (
								<a href={inv.signed_url}
								   target="_blank"
								   rel="noopener noreferrer">
									<button className="text-xs px-2 py-1 rounded border border-border-light hover:bg-background-creme/50 transition-colors">
										PDF
									</button>
								</a>
							)}
							<Link href={`/invoices/${si.invoice_id}`}>
								<button className="text-xs px-2 py-1 rounded border border-border-light hover:bg-background-creme/50 transition-colors">
									Open
								</button>
							</Link>
						</div>
					</div>
				);
			})}
		</div>
	);
}
