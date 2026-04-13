"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

import { Button } from "../../components/Button";
import { Checkbox } from "../../components/Checkbox";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { IssueIndicator } from "../../components/IssueIndicator";
import {
	IssuesBanner,
	TotalsCard,
	DocumentsList,
	ItemCard,
	StonesPanel,
	InvoiceEditPanel,
	ItemEditPanel,
} from "../../components/InvoiceDetail";
import { validate } from "../lib/validate";
import { computeNet } from "../lib/totals";
import { fmtDate } from "../lib/format";
import type { InvoiceDetail, InvoiceItem, Invoice, Issue } from "../../api/stones/types";
import type { ItemFormData } from "../../components/InvoiceForms/InvoiceForms.types";
import type { FieldIssue } from "../../components/Input";


interface InvoiceDetailClientProps {
	invoice: InvoiceDetail;
}


function toNum(val: string): number | null {
	if (!val) return null;
	const n = parseFloat(val);
	return !isNaN(n) ? n : null;
}

function str(val: unknown): string {
	if (val == null) return "";
	return String(val);
}


interface FormState {
	invoice_number: string;
	original_invoice_number: string;
	type: string;
	order_number: string;
	supplier: string;
	invoice_date: string;
	price_eur: string;
	price_usd: string;
	shipment_eur: string;
	shipment_usd: string;
	vat_rate: string;
	vat_eur: string;
	vat_usd: string;
	gross_eur: string;
	gross_usd: string;
	notes: string;
}

function initForm(invoice: InvoiceDetail): FormState {
	return {
		invoice_number: str(invoice.invoice_number),
		original_invoice_number: str(invoice.original_invoice_number),
		type: invoice.type || "received",
		order_number: str(invoice.order_number),
		supplier: str(invoice.supplier),
		invoice_date: str(invoice.invoice_date),
		price_eur: str(invoice.price_eur),
		price_usd: str(invoice.price_usd),
		shipment_eur: str(invoice.shipment_eur),
		shipment_usd: str(invoice.shipment_usd),
		vat_rate: str(invoice.vat_rate),
		vat_eur: str(invoice.vat_eur),
		vat_usd: str(invoice.vat_usd),
		gross_eur: str(invoice.gross_eur),
		gross_usd: str(invoice.gross_usd),
		notes: str(invoice.notes),
	};
}

function buildPayload(form: FormState) {
	return {
		invoice_number: form.invoice_number || null,
		original_invoice_number: form.original_invoice_number || null,
		type: form.type || "received",
		order_number: form.order_number || null,
		supplier: form.supplier || null,
		invoice_date: form.invoice_date || null,
		price_eur: toNum(form.price_eur),
		price_usd: toNum(form.price_usd),
		shipment_eur: toNum(form.shipment_eur),
		shipment_usd: toNum(form.shipment_usd),
		vat_rate: toNum(form.vat_rate),
		vat_eur: toNum(form.vat_eur),
		vat_usd: toNum(form.vat_usd),
		gross_eur: toNum(form.gross_eur),
		gross_usd: toNum(form.gross_usd),
		notes: form.notes || null,
	};
}

function formToInvoice(form: FormState, invoice: InvoiceDetail): Invoice {
	return { ...invoice, ...buildPayload(form), type: (form.type as Invoice["type"]) || "received" };
}

function itemToFormData(item: InvoiceItem, index: number): ItemFormData {
	return {
		_id: `item-${index}-${item.item_number || index}`,
		item_number: str(item.item_number),
		name: str(item.name),
		description: str(item.description),
		carat_weight: str(item.carat_weight),
		dimensions: str(item.dimensions),
		shape: str(item.shape),
		color: str(item.color),
		treatment: str(item.treatment),
		origin: str(item.origin),
		piece_count: str(item.piece_count),
		price_usd: str(item.price_usd),
		price_eur: str(item.price_eur),
		shipment_usd: str(item.shipment_usd),
		shipment_eur: str(item.shipment_eur),
		vat_usd: str(item.vat_usd),
		vat_eur: str(item.vat_eur),
		gross_usd: str(item.gross_usd),
		gross_eur: str(item.gross_eur),
	};
}

function formDataToItem(fd: ItemFormData): InvoiceItem {
	return {
		item_number: fd.item_number || null,
		name: fd.name || "Unknown",
		description: fd.description || null,
		carat_weight: toNum(fd.carat_weight),
		dimensions: fd.dimensions || null,
		shape: fd.shape || null,
		color: fd.color || null,
		treatment: fd.treatment || null,
		origin: fd.origin || null,
		piece_count: parseInt(fd.piece_count) || 1,
		price_usd: toNum(fd.price_usd),
		price_eur: toNum(fd.price_eur),
		shipment_usd: toNum(fd.shipment_usd),
		shipment_eur: toNum(fd.shipment_eur),
		vat_usd: toNum(fd.vat_usd),
		vat_eur: toNum(fd.vat_eur),
		gross_usd: toNum(fd.gross_usd),
		gross_eur: toNum(fd.gross_eur),
	};
}


const pillBase = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
const pillColors: Record<string, string> = {
	success: "bg-green-100 text-green-800",
	warning: "bg-amber-100 text-amber-800",
	info: "bg-blue-100 text-blue-800",
	neutral: "bg-gray-100 text-gray-700",
};


export function InvoiceDetailClient({ invoice }: InvoiceDetailClientProps) {
	const router = useRouter();

	const [editing, setEditing] = useState(false);
	const [form, setForm] = useState<FormState>(() => initForm(invoice));
	const [isSaving, setIsSaving] = useState(false);
	const [isArchiving, setIsArchiving] = useState(false);
	const [showParseConfirm, setShowParseConfirm] = useState(false);
	const [isParsing, setIsParsing] = useState(false);
	const [isUploadingRefund, setIsUploadingRefund] = useState(false);
	const [confirmUnlinkId, setConfirmUnlinkId] = useState<string | null>(null);

	const [localItems, setLocalItems] = useState<InvoiceItem[]>(invoice.items || []);
	const [itemsForm, setItemsForm] = useState<ItemFormData[]>(() =>
		(invoice.items || []).map(itemToFormData)
	);
	const [isSavingItems, setIsSavingItems] = useState(false);
	const [creatingStoneIdx, setCreatingStoneIdx] = useState<number | null>(null);
	const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);

	const isParseActive = invoice.parse_status === "pending" || invoice.parse_status === "parsing";
	const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

	useEffect(() => {
		if (!isParseActive) {
			if (pollRef.current) {
				clearInterval(pollRef.current);
				pollRef.current = null;
			}
			return;
		}

		pollRef.current = setInterval(async () => {
			try {
				const res = await fetch(`/api/invoices/${invoice.id}/status`);
				if (!res.ok) return;
				const data = await res.json();

				if (data.parse_status === "completed") {
					toast.success("Invoice parsed successfully");
					router.refresh();
				} else if (data.parse_status === "failed") {
					toast.error("Invoice parsing failed");
					router.refresh();
				}
			} catch {}
		}, 3000);

		return () => {
			if (pollRef.current) {
				clearInterval(pollRef.current);
				pollRef.current = null;
			}
		};
	}, [isParseActive, invoice.id, router]);

	useEffect(() => {
		setForm(initForm(invoice));
		setLocalItems(invoice.items || []);
		setItemsForm((invoice.items || []).map(itemToFormData));
	}, [invoice]);

	const currentInvoice = useMemo(() => formToInvoice(form, invoice), [form, invoice]);
	const isCreditNote = currentInvoice.type === "credit_note";
	const hasRefunds = (invoice.refund_invoices?.length ?? 0) > 0;

	const validation = useMemo(
		() => validate(currentInvoice, invoice.parent_invoice, invoice.parse_metadata?.confidence),
		[currentInvoice, invoice.parent_invoice],
	);

	const fieldIssues = useMemo(() => {
		const map = new Map<string, FieldIssue[]>();
		for (const issue of validation.issues) {
			if (!issue.field) continue;
			const arr = map.get(issue.field) ?? [];
			arr.push({ severity: issue.severity, message: issue.message });
			map.set(issue.field, arr);
		}
		return map;
	}, [validation.issues]);

	const issuesFor = useCallback(
		(field: string) => fieldIssues.get(field),
		[fieldIssues],
	);

	const net = useMemo(
		() => computeNet(currentInvoice, invoice.refund_invoices ?? []),
		[currentInvoice, invoice.refund_invoices],
	);

	const stonesByItem = useMemo(() => {
		const map = new Map<string, (typeof invoice.stones)[0]>();
		for (const s of invoice.stones) {
			if (s.item_number) map.set(s.item_number, s);
		}
		return map;
	}, [invoice.stones]);

	const initialForm = useMemo(() => initForm(invoice), [invoice]);
	const isDirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(initialForm), [form, initialForm]);


	const patchInvoice = useCallback(async (data: Record<string, unknown>) => {
		const res = await fetch(`/api/invoices/${invoice.id}`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(data),
		});
		if (!res.ok) throw new Error("Failed to update");
	}, [invoice.id]);

	const toggleFlag = useCallback(async (field: "is_paid" | "is_parsed" | "is_validated", value: boolean) => {
		try {
			await patchInvoice({ [field]: value });
			router.refresh();
		} catch {
			toast.error("Failed to update");
		}
	}, [patchInvoice, router]);

	const handleSave = useCallback(async () => {
		if (!validation.canSave) return;
		setIsSaving(true);
		try {
			await patchInvoice(buildPayload(form));
			setEditing(false);
			toast.success("Invoice saved");
			router.refresh();
		} catch {
			toast.error("Failed to save");
		} finally {
			setIsSaving(false);
		}
	}, [form, patchInvoice, router, validation.canSave]);

	const handleCancel = useCallback(() => {
		setForm(initForm(invoice));
		setEditing(false);
	}, [invoice]);

	const handleArchive = async () => {
		setIsArchiving(true);
		try {
			await patchInvoice({ is_archived: !invoice.is_archived });
			if (!invoice.is_archived) {
				router.push("/invoices");
			} else {
				toast.success("Invoice restored");
				router.refresh();
			}
		} catch {
			toast.error(invoice.is_archived ? "Failed to restore" : "Failed to archive");
		} finally {
			setIsArchiving(false);
		}
	};

	const handleParse = useCallback(async () => {
		setShowParseConfirm(false);
		setIsParsing(true);
		try {
			const res = await fetch(`/api/invoices/${invoice.id}/parse`, { method: "POST" });
			if (!res.ok) {
				const err = await res.json();
				throw new Error(err.error || "Failed to trigger parsing");
			}
			router.refresh();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Parse failed");
		} finally {
			setIsParsing(false);
		}
	}, [invoice.id, router]);

	const handleItemChange = useCallback((index: number, field: string, value: string) => {
		setItemsForm((prev) => {
			const next = [...prev];
			next[index] = { ...next[index], [field]: value };
			return next;
		});
	}, []);

	const handleSaveItems = useCallback(async () => {
		setIsSavingItems(true);
		try {
			const items = itemsForm.map(formDataToItem);
			await patchInvoice({ items });
			toast.success("Items saved");
			setEditingItemIndex(null);
			router.refresh();
		} catch {
			toast.error("Failed to save items");
		} finally {
			setIsSavingItems(false);
		}
	}, [itemsForm, patchInvoice, router]);

	const handleSaveCreditNoteItem = useCallback(async (cnInvoiceId: string, updatedItems: InvoiceItem[]) => {
		try {
			const res = await fetch(`/api/invoices/${cnInvoiceId}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ items: updatedItems }),
			});
			if (!res.ok) throw new Error("Failed to update credit note");
			toast.success("Credit note updated");
			router.refresh();
		} catch {
			toast.error("Failed to save credit note");
		}
	}, [router]);

	const handleCloseItemPanel = useCallback(() => {
		setItemsForm((invoice.items || []).map(itemToFormData));
		setEditingItemIndex(null);
	}, [invoice.items]);

	const creditNoteDataForItem = useCallback((index: number) => {
		const item = itemsForm[index];
		if (!item?.item_number || !invoice.refund_invoices?.length) return [];
		return invoice.refund_invoices.flatMap((cn) => {
			const cnItem = cn.items?.find((it) => it.item_number === item.item_number);
			if (!cnItem) return [];
			return [{
				invoiceId: cn.id,
				invoiceNumber: cn.invoice_number,
				item: cnItem,
				allItems: cn.items || [],
			}];
		});
	}, [itemsForm, invoice.refund_invoices]);

	const handleCreateStone = useCallback(async (index: number) => {
		const item = itemsForm[index];
		if (!item) return;
		const pos = (v: string) => { const n = toNum(v); return n != null && n >= 0 ? n : null; };
		setCreatingStoneIdx(index);
		try {
			const res = await fetch("/api/stones", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					name: item.name || "Unknown Stone",
					description: item.description || null,
					stone_type: item.name || null,
					color: item.color || null,
					cut: item.shape || null,
					weight_carats: toNum(item.carat_weight),
					dimensions: item.dimensions || null,
					country: item.origin || null,
					price_usd: pos(item.price_usd),
					price_eur: pos(item.price_eur),
					shipment_usd: pos(item.shipment_usd),
					shipment_eur: pos(item.shipment_eur),
					vat_usd: pos(item.vat_usd),
					vat_eur: pos(item.vat_eur),
					gross_usd: pos(item.gross_usd),
					gross_eur: pos(item.gross_eur),
					is_sold: false,
					invoice_id: invoice.id,
					item_number: item.item_number || null,
				}),
			});
			if (!res.ok) throw new Error((await res.json()).error || "Failed");
			toast.success(`Stone "${item.name}" created`);
			router.refresh();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Failed to create stone");
		} finally {
			setCreatingStoneIdx(null);
		}
	}, [itemsForm, invoice.id, router]);

	const handleUploadRefund = useCallback(async (file: File) => {
		setIsUploadingRefund(true);
		try {
			const fd = new FormData();
			fd.append("file", file);
			const uploadRes = await fetch("/api/invoices", { method: "POST", body: fd });
			if (!uploadRes.ok) throw new Error();
			const newInv = await uploadRes.json();
			await fetch(`/api/invoices/${newInv.id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ refund_of: invoice.id, type: "credit_note" }),
			});
			toast.success("Credit note uploaded");
			router.refresh();
		} catch {
			toast.error("Failed to upload credit note");
		} finally {
			setIsUploadingRefund(false);
		}
	}, [invoice.id, router]);

	const handleUnlinkCreditNote = useCallback((cnId: string) => {
		setConfirmUnlinkId(cnId);
	}, []);

	const doUnlinkCreditNote = useCallback(async () => {
		if (!confirmUnlinkId) return;
		const cnId = confirmUnlinkId;
		setConfirmUnlinkId(null);
		try {
			const res = await fetch(`/api/invoices/${cnId}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ refund_of: null }),
			});
			if (!res.ok) throw new Error();
			toast.success("Credit note unlinked");
			router.refresh();
		} catch {
			toast.error("Failed to unlink credit note");
		}
	}, [confirmUnlinkId, router]);

	const handleLinkCreditNote = useCallback(async (cnId: string) => {
		try {
			const res = await fetch(`/api/invoices/${cnId}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ refund_of: invoice.id }),
			});
			if (!res.ok) throw new Error();
			toast.success("Credit note linked");
			router.refresh();
		} catch {
			toast.error("Failed to link credit note");
		}
	}, [invoice.id, router]);

	const handleApplyFix = useCallback((issue: Issue) => {
		if (issue.code === "cn_positive_value" && issue.field) {
			const field = issue.field as keyof FormState;
			if (field in form) {
				const val = toNum(String(form[field]));
				if (val != null) {
					setForm((prev) => ({ ...prev, [field]: String(-val) }));
					if (!editing) setEditing(true);
				}
			}
		}
	}, [form, editing]);

	const updateField = useCallback((field: keyof FormState, value: string) => {
		setForm((prev) => ({ ...prev, [field]: value }));
	}, []);


	return (
		<div className="min-h-screen relative pt-16">
			<div className="fixed inset-0 z-0 opacity-10 pointer-events-none"
			     style={{
				     backgroundImage: 'url("/NNNoise Texture Generator.svg")',
				     backgroundSize: "400px 400px",
				     backgroundRepeat: "repeat",
			     }} />

			<section className="relative py-8 px-4 sm:px-6 lg:px-8 z-10">
				<div className="max-w-4xl mx-auto">

					{isCreditNote && invoice.parent_invoice ? (
						<div className="flex items-center gap-2 text-xs text-text-gray mb-4">
							<Link href="/invoices"
							      className="hover:text-foreground transition-colors">Invoices</Link>
							<span className="text-border">/</span>
							<Link href={`/invoices/${invoice.parent_invoice.id}`}
							      className="text-callout-accent hover:underline">
								{invoice.parent_invoice.invoice_number || invoice.parent_invoice.original_invoice_number}
							</Link>
							<span className="text-border">/</span>
							<span className="text-foreground">Credit note {invoice.invoice_number}</span>
						</div>
					) : (
						<Link href="/invoices"
						      className="inline-flex items-center gap-1 text-sm text-text-gray hover:text-foreground transition-colors mb-5">
							<svg className="h-4 w-4"
							     fill="none"
							     viewBox="0 0 24 24"
							     stroke="currentColor">
								<path strokeLinecap="round"
								      strokeLinejoin="round"
								      strokeWidth={1.5}
								      d="M15.75 19.5L8.25 12l7.5-7.5" />
							</svg>
							Back to invoices
						</Link>
					)}


					<>
						{isParsing || isParseActive ? (
							<div className="flex flex-col items-center py-20"
							     role="status"
							     aria-busy="true">
								<div className="h-8 w-8 rounded-full border-2 border-callout-accent border-t-transparent animate-spin" />
								<p className="mt-4 text-sm text-text-gray">Extracting metadata...</p>
							</div>
						) : (
							<div className="space-y-5">

							<div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
									<div className="min-w-0">
										<h1 className="text-2xl font-medium font-heading text-foreground">
											{currentInvoice.invoice_number || "Untitled invoice"}
										</h1>
										<div className="flex items-center gap-1.5 flex-wrap mt-1.5">
											{isCreditNote ? (
												<span className={`${pillBase} ${pillColors.warning}`}>Credit note</span>
											) : invoice.is_paid ? (
												<span className={`${pillBase} ${pillColors.success}`}>Paid</span>
											) : (
												<span className={`${pillBase} ${pillColors.warning}`}>Unpaid</span>
											)}
											{invoice.is_parsed && <span className={`${pillBase} ${pillColors.neutral}`}>Parsed</span>}
											{invoice.is_validated && <span className={`${pillBase} ${pillColors.success}`}>Validated</span>}
											{hasRefunds && <span className={`${pillBase} ${pillColors.info}`}>Has credit note</span>}
										</div>
										<div className="text-xs text-text-gray mt-2 space-x-5">
											<span>{currentInvoice.order_number && <>Order #{currentInvoice.order_number}</>}</span>
											<span>{currentInvoice.supplier ?? "Unknown supplier"}</span>
											<span>{currentInvoice.invoice_date && <>{fmtDate(currentInvoice.invoice_date)}</>}</span>
										</div>
										{invoice.parse_metadata && (
											<div className="text-xs text-text-gray mt-1">
												Parsed by {invoice.parse_metadata.model}
												{invoice.parse_metadata.parsed_at && <> on {fmtDate(invoice.parse_metadata.parsed_at)}</>}
											</div>
										)}
									</div>
									<div className="flex items-center gap-2 shrink-0">
										{invoice.signed_url && (
											<Button variant="ghost"
											        size="sm"
											        loading={isParsing}
											        disabled={isParseActive}
											        aria-label="Extract metadata"
											        onClick={() => setShowParseConfirm(true)}>
												<svg className="h-4 w-4 text-text-gray"
												     fill="none"
												     viewBox="0 0 24 24"
												     stroke="currentColor">
													<path strokeLinecap="round"
													      strokeLinejoin="round"
													      strokeWidth={1.5}
													      d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
												</svg>
											</Button>
										)}
										<Button variant="ghost"
										        size="sm"
										        loading={isArchiving}
										        aria-label={invoice.is_archived ? "Restore" : "Archive"}
										        onClick={handleArchive}>
											{invoice.is_archived ? (
												<svg className="h-4 w-4 text-text-gray"
												     fill="none"
												     viewBox="0 0 24 24"
												     stroke="currentColor">
													<path strokeLinecap="round"
													      strokeLinejoin="round"
													      strokeWidth={1.5}
													      d="M9 3.75H6.912a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H15M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859M12 3v8.25m0 0l-3-3m3 3l3-3" />
												</svg>
											) : (
												<svg className="h-4 w-4 text-text-gray"
												     fill="none"
												     viewBox="0 0 24 24"
												     stroke="currentColor">
													<path strokeLinecap="round"
													      strokeLinejoin="round"
													      strokeWidth={1.5}
													      d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
												</svg>
											)}
										</Button>
									</div>
								</div>


								<div>
									<IssuesBanner issues={validation.issues}
									              onApplyFix={handleApplyFix} />
								</div>


								<div>
									<div className="flex flex-wrap items-center gap-6 rounded-lg border border-border bg-background-creme/30 px-4 py-3">
										<Checkbox label="Paid"
										          checked={invoice.is_paid}
										          onChange={() => toggleFlag("is_paid", !invoice.is_paid)} />
										<Checkbox label="Parsed"
										          checked={invoice.is_parsed}
										          onChange={() => toggleFlag("is_parsed", !invoice.is_parsed)} />
										<Checkbox label="Validated"
										          checked={invoice.is_validated}
										          onChange={() => toggleFlag("is_validated", !invoice.is_validated)} />
									</div>
								</div>


								<>
									<div className="relative group/totals cursor-pointer"
									     onClick={() => setEditing(true)}>
										<button className="absolute top-3 right-3 text-xs text-text-gray hover:text-foreground opacity-0 group-hover/totals:opacity-100 transition-opacity px-2 py-1 rounded border border-border-light hover:bg-background-creme/50">
											Edit
										</button>
										<TotalsCard invoice={currentInvoice}
										            net={net}
										            hasCredit={hasRefunds}
										            fieldIssues={fieldIssues} />
									</div>

									<div>
										<div className="grid gap-4 grid-cols-1 sm:grid-cols-[1.4fr_1fr]">
											<DocumentsList invoice={currentInvoice}
											               signedUrl={invoice.signed_url}
											               refundInvoices={invoice.refund_invoices}
											               onUploadCreditNote={handleUploadRefund}
											               isUploading={isUploadingRefund}
											               onLinkCreditNote={handleLinkCreditNote}
											               onUnlinkCreditNote={handleUnlinkCreditNote} />
											<div className="glass-card glass-secondary p-4 relative group/details cursor-pointer"
											     onClick={() => setEditing(true)}>
												<div className="flex items-center justify-between mb-3">
													<div className="text-xs text-text-gray uppercase tracking-wider">Details</div>
													<button className="text-xs text-text-gray hover:text-foreground opacity-0 group-hover/details:opacity-100 transition-opacity px-2 py-1 rounded border border-border-light hover:bg-background-creme/50">
														Edit
													</button>
												</div>
												<table className="w-full text-xs">
													<tbody>
														<tr><td className="text-text-gray py-1.5">Supplier</td><td className="text-right">{currentInvoice.supplier ?? "—"}<IssueIndicator issues={issuesFor("supplier")} /></td></tr>
														<tr><td className="text-text-gray py-1.5">Order #</td><td className="text-right font-mono">{currentInvoice.order_number ?? "—"}<IssueIndicator issues={issuesFor("order_number")} /></td></tr>
														<tr><td className="text-text-gray py-1.5">Date</td><td className="text-right">{fmtDate(currentInvoice.invoice_date)}<IssueIndicator issues={issuesFor("invoice_date")} /></td></tr>
														<tr><td className="text-text-gray py-1.5">VAT rate</td><td className="text-right">{currentInvoice.vat_rate ? `${currentInvoice.vat_rate}%` : "—"}<IssueIndicator issues={issuesFor("vat_rate")} /></td></tr>
														{currentInvoice.notes && (
															<tr><td className="text-text-gray py-1.5">Notes</td><td className="text-right">{currentInvoice.notes}</td></tr>
														)}
													</tbody>
												</table>
											</div>
										</div>
									</div>
								</>


								{localItems.length > 0 && (
									<div>
										<div className="text-xs font-medium uppercase tracking-wider text-text-gray mb-3">
											Items ({localItems.length})
										</div>
										{localItems.map((item, i) => (
											<ItemCard key={item.item_number || i}
											          item={item}
											          refundInvoices={invoice.refund_invoices}
											          linkedStone={item.item_number ? stonesByItem.get(item.item_number) : undefined}
											          onCreateStone={() => handleCreateStone(i)}
											          isCreating={creatingStoneIdx === i}
											          onClick={() => setEditingItemIndex(i)} />
										))}
									</div>
								)}


								{!isCreditNote && (
									<div>
										<div className="text-xs font-medium uppercase tracking-wider text-text-gray mb-3">
											Stones ({invoice.stones.length})
										</div>
										<StonesPanel stones={invoice.stones} />
									</div>
								)}
							</div>
						)}
					</>
				</div>
			</section>

			<ConfirmDialog isOpen={showParseConfirm}
			              onClose={() => setShowParseConfirm(false)}
			              onConfirm={handleParse}
			              title="Extract metadata"
			              message={invoice.is_parsed
				              ? "Re-parse this invoice? This will overwrite current data."
				              : "Parse this invoice PDF to extract data using AI."}
			              confirmText={invoice.is_parsed ? "Re-parse" : "Parse"} />

			<ConfirmDialog isOpen={confirmUnlinkId !== null}
			              onClose={() => setConfirmUnlinkId(null)}
			              onConfirm={doUnlinkCreditNote}
			              title="Unlink credit note"
			              message="Remove the link between this credit note and the invoice? The credit note will remain but will no longer be associated."
			              confirmText="Unlink" />

			<InvoiceEditPanel isOpen={editing}
			                  onClose={handleCancel}
			                  form={form}
			                  onFieldChange={updateField}
			                  onSave={handleSave}
			                  onCancel={handleCancel}
			                  isSaving={isSaving}
			                  isDirty={isDirty}
			                  canSave={validation.canSave}
			                  issuesFor={issuesFor} />

			<ItemEditPanel isOpen={editingItemIndex !== null}
			               onClose={handleCloseItemPanel}
			               item={editingItemIndex !== null ? itemsForm[editingItemIndex] : null}
			               itemIndex={editingItemIndex ?? 0}
			               onItemChange={handleItemChange}
			               onSave={handleSaveItems}
			               isSaving={isSavingItems}
			               creditNoteData={editingItemIndex !== null ? creditNoteDataForItem(editingItemIndex) : []}
			               onSaveCreditNoteItem={handleSaveCreditNoteItem}
			               linkedStone={editingItemIndex !== null && localItems[editingItemIndex]?.item_number ? stonesByItem.get(localItems[editingItemIndex].item_number!) : undefined}
			               onCreateStone={() => editingItemIndex !== null && handleCreateStone(editingItemIndex)}
			               isCreatingStone={creatingStoneIdx === editingItemIndex} />

		</div>
	);
}