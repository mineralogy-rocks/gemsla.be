"use client";

import { useRef, useState } from "react";
import Link from "next/link";

import type { Invoice, InvoiceDetail, InvoiceListItem } from "@/app/api/stones/types";


interface DocumentsListProps {
	invoice: Invoice;
	signedUrl?: string;
	refundInvoices?: InvoiceDetail["refund_invoices"];
	onUploadCreditNote: (file: File) => void;
	isUploading: boolean;
	onLinkCreditNote: (cnId: string) => Promise<void>;
	onUnlinkCreditNote: (cnId: string) => void;
}


export function DocumentsList({
	invoice,
	signedUrl,
	refundInvoices,
	onUploadCreditNote,
	isUploading,
	onLinkCreditNote,
	onUnlinkCreditNote,
}: DocumentsListProps) {
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [showPicker, setShowPicker] = useState(false);
	const [pickerItems, setPickerItems] = useState<InvoiceListItem[]>([]);
	const [isLoadingPicker, setIsLoadingPicker] = useState(false);
	const [linkingId, setLinkingId] = useState<string | null>(null);

	const handleOpenPicker = async () => {
		setShowPicker(true);
		setIsLoadingPicker(true);
		try {
			const res = await fetch("/api/invoices?type=credit_note&unlinked_only=true&limit=100");
			const json = await res.json();
			setPickerItems(json.data || []);
		} finally {
			setIsLoadingPicker(false);
		}
	};

	const handleLink = async (cnId: string) => {
		setLinkingId(cnId);
		await onLinkCreditNote(cnId);
		setShowPicker(false);
		setPickerItems([]);
		setLinkingId(null);
	};

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
				             href={cn.signed_url}
				             onRemove={() => onUnlinkCreditNote(cn.id)} />
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

					<div className="mt-2 flex justify-end gap-1.5">
						<button onClick={() => fileInputRef.current?.click()}
						        disabled={isUploading}
						        className="text-xs px-2 py-1 rounded border border-border-light hover:bg-background-creme/50 transition-colors text-text-gray hover:text-foreground">
							{isUploading ? "Uploading..." : "+ Upload PDF"}
						</button>
						<button onClick={handleOpenPicker}
						        disabled={showPicker}
						        className="text-xs px-2 py-1 rounded border border-border-light hover:bg-background-creme/50 transition-colors text-text-gray hover:text-foreground">
							+ Link credit note
						</button>
					</div>

					{showPicker && (
						<div className="mt-2 border border-border-light rounded-lg overflow-hidden">
							<div className="flex items-center justify-between px-3 py-2 bg-background-creme/40 border-b border-border-light">
								<span className="text-xs text-text-gray">Select credit note</span>
								<button onClick={() => setShowPicker(false)}
								        className="text-xs text-text-gray hover:text-foreground transition-colors">
									✕
								</button>
							</div>

							{isLoadingPicker ? (
								<div className="px-3 py-4 text-xs text-text-gray text-center">Loading...</div>
							) : pickerItems.length === 0 ? (
								<div className="px-3 py-4 text-xs text-text-gray text-center">No unlinked credit notes</div>
							) : (
								pickerItems.map((cn) => (
									<div key={cn.id}
									     className="flex items-center gap-3 px-3 py-2.5 border-b border-border-light last:border-0">
										<div className="min-w-0 flex-1">
											<div className="text-xs font-medium truncate">
												{cn.invoice_number || cn.original_invoice_number || cn.id}
											</div>
											{cn.invoice_date && (
												<div className="text-xs text-text-gray/60">{cn.invoice_date}</div>
											)}
										</div>
										{cn.price_eur != null && (
											<span className="text-xs text-text-gray shrink-0">€{cn.price_eur}</span>
										)}
										<button onClick={() => handleLink(cn.id)}
										        disabled={linkingId === cn.id}
										        className="shrink-0 text-xs px-2 py-1 rounded border border-border-light hover:bg-background-creme/50 transition-colors">
											{linkingId === cn.id ? "Linking..." : "Link"}
										</button>
									</div>
								))
							)}
						</div>
					)}
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
	onRemove,
	isRemoving,
}: {
	kind: "invoice" | "credit_note";
	label: string;
	subtitle: string;
	href?: string;
	linkTo?: string;
	onRemove?: () => void;
	isRemoving?: boolean;
}) {
	const isInvoice = kind === "invoice";
	const iconColor = isInvoice ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700";

	return (
		<div className="flex items-center gap-3 p-2.5 border border-border-light rounded-lg mb-2">
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
					{subtitle}
				</div>
			</div>

			{(href || linkTo || onRemove) && (
				<div className="flex items-center gap-1.5 shrink-0">
					{href && (
						<a href={href}
						   target="_blank"
						   rel="noopener noreferrer">
							<button className="text-xs px-2 py-1 rounded border border-border-light hover:bg-background-creme/50 transition-colors">
								PDF
							</button>
						</a>
					)}
					{linkTo && (
						<Link href={linkTo}>
							<button className="text-xs px-2 py-1 rounded border border-border-light hover:bg-background-creme/50 transition-colors">
								Open
							</button>
						</Link>
					)}
					{onRemove && (
						<button onClick={onRemove}
						        disabled={isRemoving}
						        className="text-xs px-2 py-1 rounded border border-border-light hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors text-text-gray disabled:opacity-50">
							{isRemoving ? "..." : "Unlink"}
						</button>
					)}
				</div>
			)}
		</div>
	);
}
