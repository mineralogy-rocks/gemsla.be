"use client";

import { useRef } from "react";
import Link from "next/link";

import type { Invoice, InvoiceDetail } from "@/app/api/stones/types";


interface DocumentsListProps {
	invoice: Invoice;
	signedUrl?: string;
	refundInvoices?: InvoiceDetail["refund_invoices"];
	onUploadCreditNote: (file: File) => void;
	isUploading: boolean;
}


export function DocumentsList({
	invoice,
	signedUrl,
	refundInvoices,
	onUploadCreditNote,
	isUploading,
}: DocumentsListProps) {
	const fileInputRef = useRef<HTMLInputElement>(null);

	return (
		<div className="glass-card glass-secondary p-4">
			<div className="text-xs text-text-gray uppercase tracking-wider mb-3">Documents</div>

			{signedUrl && (
				<DocumentRow kind="invoice"
				             label="Tax invoice"
				             subtitle={invoice.file_path || invoice.id}
				             href={signedUrl} />
			)}

			{refundInvoices?.map((cn) => (
				<DocumentRow key={cn.id}
				             kind="credit_note"
				             label={`Credit note ${cn.invoice_number || ""}`}
				             subtitle={cn.id}
				             linkTo={`/invoices/${cn.id}`}
				             href={cn.signed_url} />
			))}

			{!invoice.refund_of && (
				<>
					<input ref={fileInputRef}
					       type="file"
					       accept="application/pdf"
					       className="hidden"
					       onChange={(e) => {
						       const f = e.target.files?.[0];
						       if (f) onUploadCreditNote(f);
						       e.target.value = "";
					       }} />
					<button onClick={() => fileInputRef.current?.click()}
					        disabled={isUploading}
					        className="mt-2.5 w-full text-xs text-text-gray hover:text-foreground transition-colors py-1.5">
						{isUploading ? "Uploading..." : "+ Add credit note"}
					</button>
				</>
			)}
		</div>
	);
}


function DocumentRow({
	kind,
	label,
	subtitle,
	href,
	linkTo,
}: {
	kind: "invoice" | "credit_note";
	label: string;
	subtitle: string;
	href?: string;
	linkTo?: string;
}) {
	const isInvoice = kind === "invoice";
	const badge = isInvoice ? "PDF" : "CN";
	const badgeColor = isInvoice
		? "bg-blue-100 text-blue-700"
		: "bg-amber-100 text-amber-700";

	return (
		<div className="flex items-center gap-3 p-2.5 border border-border-light rounded-lg mb-2">
			<div className={`w-8 h-8 rounded-lg ${badgeColor} flex items-center justify-center text-[11px] font-medium`}>
				{badge}
			</div>

			<div className="min-w-0 flex-1">
				<div className="text-xs font-medium">{label}</div>
				<div className="text-xs text-text-gray/60 font-mono truncate">
					{subtitle}
				</div>
			</div>

			{(href || linkTo) && (
				href ? (
					<a href={href}
					   target="_blank"
					   rel="noopener noreferrer">
						<button className="text-xs px-2 py-1 rounded border border-border-light hover:bg-background-creme/50 transition-colors">
							View
						</button>
					</a>
				) : linkTo ? (
					<Link href={linkTo}>
						<button className="text-xs px-2 py-1 rounded border border-border-light hover:bg-background-creme/50 transition-colors">
							View
						</button>
					</Link>
				) : null
			)}
		</div>
	);
}
