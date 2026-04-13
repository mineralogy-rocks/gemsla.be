"use client";

import { useState, useCallback, useEffect } from "react";

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


function ToggleSwitch({ label, description, checked, onToggle }: {
	label: string;
	description?: string;
	checked: boolean;
	onToggle: () => Promise<void>;
}) {
	const [display, setDisplay] = useState(checked);
	const [pending, setPending] = useState(false);

	useEffect(() => {
		setDisplay(checked);
	}, [checked]);

	const handleClick = useCallback(async (e: React.MouseEvent) => {
		e.stopPropagation();
		if (pending) return;
		const next = !display;
		setDisplay(next);
		setPending(true);
		try {
			await onToggle();
		} catch {
			setDisplay(!next);
			toast.error(`Failed to update ${label.toLowerCase()}`);
		} finally {
			setPending(false);
		}
	}, [pending, display, onToggle, label]);

	return (
		<button className={`flex items-start gap-1.5 group ${pending ? "opacity-70" : ""}`}
		        onClick={handleClick}
		        role="switch"
		        aria-checked={display}
		        aria-label={`Toggle ${label}`}
		        disabled={pending}>
			<div className="flex flex-col items-end">
				<span className="text-xs text-text-gray group-hover:text-foreground transition-colors">
					{label}
				</span>
				{description && (
					<span className="text-[10px] text-text-gray/50 leading-tight max-w-[120px] text-right">
						{description}
					</span>
				)}
			</div>
			<div className={`relative w-7 h-4 rounded-full transition-colors mt-0.5 ${display ? "bg-foreground" : "bg-border"}`}>
				<motion.div className="absolute top-0.5 w-3 h-3 rounded-full bg-background shadow-sm"
				            animate={{ left: display ? 14 : 2 }}
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
							<div className="text-xs text-text-gray">
								{invoice.type === "issued" ? "Customer" : "Supplier"}
							</div>
							<div className="font-medium truncate">
								{invoice.type === "issued"
									? (invoice.customer_name ?? "---")
									: (invoice.supplier ?? "---")}
							</div>
							<IssueIndicator issues={issuesFor(invoice.type === "issued" ? "customer_name" : "supplier")} />
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
					              description="Is invoice paid?"
					              checked={isPaid}
					              onToggle={() => onToggleFlag("is_paid", !isPaid)} />
					<ToggleSwitch label="Parsed"
					              description="Is data extracted?"
					              checked={isParsed}
					              onToggle={() => onToggleFlag("is_parsed", !isParsed)} />
					<ToggleSwitch label="Validated"
					              description="Is data validated?"
					              checked={isValidated}
					              onToggle={() => onToggleFlag("is_validated", !isValidated)} />
				</div>
			</div>
		</div>
	);
}
