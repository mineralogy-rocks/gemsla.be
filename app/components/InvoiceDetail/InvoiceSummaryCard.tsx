"use client";

import { useState, useCallback } from "react";

import { motion } from "framer-motion";
import toast from "react-hot-toast";

import { money, fmtDate } from "@/app/invoices/lib/format";
import { IssueIndicator } from "../IssueIndicator";
import type { Invoice, InvoiceDetail } from "@/app/api/stones/types";
import type { FieldIssue } from "@/app/components/Input/Input.types";


interface InvoiceSummaryCardProps {
	invoice: Invoice;
	itemCount: number;
	parseMetadata?: InvoiceDetail["parse_metadata"];
	isPaid: boolean;
	isParsed: boolean;
	isValidated: boolean;
	onToggleFlag: (field: "is_paid" | "is_parsed" | "is_validated", value: boolean) => Promise<void>;
	onEdit: () => void;
	fieldIssues?: Map<string, FieldIssue[]>;
}


function ToggleSwitch({ label, checked, onToggle }: {
	label: string;
	checked: boolean;
	onToggle: () => Promise<void>;
}) {
	const [optimistic, setOptimistic] = useState(checked);
	const [pending, setPending] = useState(false);

	const stableChecked = pending ? optimistic : checked;

	const handleClick = useCallback(async (e: React.MouseEvent) => {
		e.stopPropagation();
		if (pending) return;
		const next = !stableChecked;
		setOptimistic(next);
		setPending(true);
		try {
			await onToggle();
		} catch {
			setOptimistic(!next);
			toast.error(`Failed to update ${label.toLowerCase()}`);
		} finally {
			setPending(false);
		}
	}, [pending, stableChecked, onToggle, label]);

	return (
		<button className={`flex items-center gap-1.5 group ${pending ? "opacity-70" : ""}`}
		        onClick={handleClick}
		        role="switch"
		        aria-checked={stableChecked}
		        aria-label={`Toggle ${label}`}
		        disabled={pending}>
			<span className="text-xs text-text-gray group-hover:text-foreground transition-colors">
				{label}
			</span>
			<div className={`relative w-7 h-4 rounded-full transition-colors ${stableChecked ? "bg-foreground" : "bg-border"}`}>
				<motion.div className="absolute top-0.5 w-3 h-3 rounded-full bg-background shadow-sm"
				            animate={{ left: stableChecked ? 14 : 2 }}
				            transition={{ type: "spring", stiffness: 500, damping: 30 }} />
			</div>
		</button>
	);
}


export function InvoiceSummaryCard({
	invoice,
	itemCount,
	parseMetadata,
	isPaid,
	isParsed,
	isValidated,
	onToggleFlag,
	onEdit,
	fieldIssues,
}: InvoiceSummaryCardProps) {
	const issuesFor = (field: string) => fieldIssues?.get(field);

	return (
		<div className="rounded-lg bg-white border border-border-light p-5 relative group/summary cursor-pointer hover:border-border transition-colors"
		     onClick={onEdit}>

			<div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
				<div className="flex-1 min-w-0">
					<div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2 text-sm">
						<div>
							<div className="text-xs text-text-gray">Supplier</div>
							<div className="font-medium truncate">{invoice.supplier ?? "---"}</div>
							<IssueIndicator issues={issuesFor("supplier")} />
						</div>
						<div>
							<div className="text-xs text-text-gray">Date</div>
							<div className="font-medium">{invoice.invoice_date ? fmtDate(invoice.invoice_date) : "---"}</div>
							<IssueIndicator issues={issuesFor("invoice_date")} />
						</div>
						<div>
							<div className="text-xs text-text-gray">Order #</div>
							<div className="font-medium font-mono">{invoice.order_number ?? "---"}</div>
							<IssueIndicator issues={issuesFor("order_number")} />
						</div>
						<div>
							<div className="text-xs text-text-gray">VAT Rate</div>
							<div className="font-medium">{invoice.vat_rate ? `${invoice.vat_rate}%` : "---"}</div>
							<IssueIndicator issues={issuesFor("vat_rate")} />
						</div>
						<div>
							<div className="text-xs text-text-gray">Items</div>
							<div className="font-medium">{itemCount}</div>
						</div>
					</div>

					<div className="flex items-baseline gap-6 mt-4 pt-3 border-t border-border-light">
						<div>
							<span className="text-xs text-text-gray mr-1.5">Gross EUR</span>
							<span className="text-lg font-medium tabular-nums">{money(invoice.gross_eur, "eur")}</span>
							<IssueIndicator issues={issuesFor("gross_eur")} />
						</div>
						<div>
							<span className="text-xs text-text-gray mr-1.5">Gross USD</span>
							<span className="text-lg font-medium tabular-nums">{money(invoice.gross_usd, "usd")}</span>
							<IssueIndicator issues={issuesFor("gross_usd")} />
						</div>
					</div>

					{invoice.notes && (
						<div className="mt-3 text-xs text-text-gray italic">{invoice.notes}</div>
					)}

					{parseMetadata && (
						<div className="mt-2 text-xs text-text-gray/60">
							Parsed by {parseMetadata.model}
							{parseMetadata.parsed_at && <> on {fmtDate(parseMetadata.parsed_at)}</>}
						</div>
					)}
				</div>

				<div className="flex sm:flex-col items-center sm:items-end gap-3 shrink-0"
				     onClick={(e) => e.stopPropagation()}>
					<ToggleSwitch label="Paid"
					              checked={isPaid}
					              onToggle={() => onToggleFlag("is_paid", !isPaid)} />
					<ToggleSwitch label="Parsed"
					              checked={isParsed}
					              onToggle={() => onToggleFlag("is_parsed", !isParsed)} />
					<ToggleSwitch label="Validated"
					              checked={isValidated}
					              onToggle={() => onToggleFlag("is_validated", !isValidated)} />
				</div>
			</div>
		</div>
	);
}
