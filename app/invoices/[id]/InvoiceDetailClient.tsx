"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

import { Button } from "../../components/Button";
import { Checkbox } from "../../components/Checkbox";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { Input } from "../../components/Input";
import { IssueIndicator } from "../../components/IssueIndicator";
import { TextArea } from "../../components/TextArea";
import { ItemsTable } from "../../components/InvoiceForms/ItemsTable";
import {
	IssuesBanner,
	TotalsCard,
	DocumentsList,
	ItemCard,
	StonesPanel,
} from "../../components/InvoiceDetail";
import { staggerContainer, staggerItem } from "../../lib/animations";
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

	const [localItems, setLocalItems] = useState<InvoiceItem[]>(invoice.items || []);
	const [itemsForm, setItemsForm] = useState<ItemFormData[]>(() =>
		(invoice.items || []).map(itemToFormData)
	);
	const [isItemsDirty, setIsItemsDirty] = useState(false);
	const [isSavingItems, setIsSavingItems] = useState(false);
	const [creatingStoneIdx, setCreatingStoneIdx] = useState<number | null>(null);
	const [editingItems, setEditingItems] = useState(false);

	useEffect(() => {
		setForm(initForm(invoice));
		setLocalItems(invoice.items || []);
		setItemsForm((invoice.items || []).map(itemToFormData));
		setIsItemsDirty(false);
	}, [invoice]);

	const currentInvoice = useMemo(() => formToInvoice(form, invoice), [form, invoice]);
	const isCreditNote = currentInvoice.type === "credit_note";
	const hasRefunds = (invoice.refund_invoices?.length ?? 0) > 0;

	const validation = useMemo(
		() => validate(currentInvoice, invoice.parent_invoice, undefined),
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

	const existingItemNumbers = useMemo(() => {
		const set = new Set<string>();
		for (const s of invoice.stones) {
			if (s.item_number) set.add(s.item_number);
		}
		return set;
	}, [invoice.stones]);

	const creditNoteItems = useMemo(() => {
		if (!invoice.refund_invoices?.length) return undefined;
		const all: InvoiceItem[] = [];
		for (const r of invoice.refund_invoices) {
			if (r.items) all.push(...r.items);
		}
		return all.length > 0 ? all : undefined;
	}, [invoice.refund_invoices]);

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
			await patchInvoice({ is_archived: true });
			router.push("/invoices");
		} catch {
			toast.error("Failed to archive");
		} finally {
			setIsArchiving(false);
		}
	};

	const handleParse = useCallback(async () => {
		setShowParseConfirm(false);
		setIsParsing(true);
		try {
			if (!invoice.signed_url) throw new Error("No PDF file attached");

			const pdfRes = await fetch(invoice.signed_url);
			if (!pdfRes.ok) throw new Error("Failed to fetch PDF");
			const blob = await pdfRes.blob();

			const fd = new FormData();
			fd.append("file", new File([blob], "invoice.pdf", { type: "application/pdf" }));

			const parseRes = await fetch("/api/stones/parse-invoice", { method: "POST", body: fd });
			if (!parseRes.ok) {
				const err = await parseRes.json();
				throw new Error(err.error || "Parse failed");
			}
			const parsed = await parseRes.json();

			await patchInvoice({
				type: parsed.type || "received",
				invoice_number: parsed.invoice_number || null,
				original_invoice_number: parsed.original_invoice_number || null,
				order_number: parsed.order_number || null,
				supplier: parsed.supplier || null,
				invoice_date: parsed.invoice_date ?? null,
				price_usd: parsed.price_usd ?? null,
				price_eur: parsed.price_eur ?? null,
				shipment_usd: parsed.shipment_usd ?? null,
				shipment_eur: parsed.shipment_eur ?? null,
				vat_rate: parsed.vat_rate ?? null,
				vat_usd: parsed.vat_usd ?? null,
				vat_eur: parsed.vat_eur ?? null,
				gross_usd: parsed.gross_usd ?? null,
				gross_eur: parsed.gross_eur ?? null,
				items: parsed.items ?? [],
				is_parsed: true,
			});

			const newForm = initForm({
				...invoice,
				...parsed,
				type: parsed.type || invoice.type,
				items: parsed.items ?? [],
				is_parsed: true,
			} as InvoiceDetail);
			setForm(newForm);
			const items: InvoiceItem[] = parsed.items || [];
			setLocalItems(items);
			setItemsForm(items.map(itemToFormData));

			toast.success("Invoice parsed");
			router.refresh();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Parse failed");
		} finally {
			setIsParsing(false);
		}
	}, [invoice, patchInvoice, router]);

	const handleItemChange = useCallback((index: number, field: string, value: string) => {
		setItemsForm((prev) => {
			const next = [...prev];
			next[index] = { ...next[index], [field]: value };
			return next;
		});
		setIsItemsDirty(true);
	}, []);

	const handleSaveItems = useCallback(async () => {
		setIsSavingItems(true);
		try {
			const items = itemsForm.map(formDataToItem);
			await patchInvoice({ items });
			toast.success("Items saved");
			setIsItemsDirty(false);
			router.refresh();
		} catch {
			toast.error("Failed to save items");
		} finally {
			setIsSavingItems(false);
		}
	}, [itemsForm, patchInvoice, router]);

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
			await patchInvoice({});
			await fetch(`/api/invoices/${newInv.id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ refund_of: invoice.id }),
			});
			toast.success("Credit note uploaded");
			router.refresh();
		} catch {
			toast.error("Failed to upload credit note");
		} finally {
			setIsUploadingRefund(false);
		}
	}, [invoice.id, patchInvoice, router]);

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


					<AnimatePresence mode="wait">
						{isParsing ? (
							<div className="flex flex-col items-center py-20">
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
										<div className="text-xs text-text-gray mt-1">
											{currentInvoice.supplier ?? "Unknown supplier"}
											{currentInvoice.order_number && <> · Order {currentInvoice.order_number}</>}
											{currentInvoice.invoice_date && <> · {fmtDate(currentInvoice.invoice_date)}</>}
										</div>
									</div>
									<div className="flex items-center gap-2 shrink-0">
										{invoice.signed_url && (
											<Button variant="secondary"
											        size="sm"
											        onClick={() => setShowParseConfirm(true)}>
												Extract metadata
											</Button>
										)}
										{!invoice.is_paid && !isCreditNote && (
											<Button variant="secondary"
											        size="sm"
											        onClick={() => toggleFlag("is_paid", true)}>
												Mark paid
											</Button>
										)}
										{editing ? (
											<>
												<Button variant="secondary"
												        size="sm"
												        onClick={handleCancel}>
													Cancel
												</Button>
												<Button variant="primary"
												        size="sm"
												        loading={isSaving}
												        onClick={handleSave}
												        disabled={!isDirty || !validation.canSave}>
													Save
												</Button>
											</>
										) : (
											<Button variant="secondary"
											        size="sm"
											        onClick={() => setEditing(true)}>
												Edit
											</Button>
										)}
										<Button variant="ghost"
										        size="sm"
										        loading={isArchiving}
										        onClick={handleArchive}>
											<svg className="h-4 w-4 text-text-gray"
											     fill="none"
											     viewBox="0 0 24 24"
											     stroke="currentColor">
												<path strokeLinecap="round"
												      strokeLinejoin="round"
												      strokeWidth={1.5}
												      d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
											</svg>
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


								{editing ? (
									<div className="space-y-4">
										<div className="grid gap-4 sm:grid-cols-2">
											<Input label="Invoice Number"
											       size="sm"
											       value={form.invoice_number}
											       issues={issuesFor("invoice_number")}
											       onChange={(e) => updateField("invoice_number", e.target.value)} />
											<Input label="Original Invoice Number"
											       size="sm"
											       value={form.original_invoice_number}
											       issues={issuesFor("original_invoice_number")}
											       onChange={(e) => updateField("original_invoice_number", e.target.value)} />
										</div>
										<div className="grid gap-4 sm:grid-cols-3">
											<Input label="Invoice Date"
											       size="sm"
											       type="date"
											       value={form.invoice_date}
											       issues={issuesFor("invoice_date")}
											       onChange={(e) => updateField("invoice_date", e.target.value)} />
											<Input label="Supplier"
											       size="sm"
											       value={form.supplier}
											       issues={issuesFor("supplier")}
											       onChange={(e) => updateField("supplier", e.target.value)} />
											<div>
												<label className="block text-xs font-medium text-text-gray mb-1">Type</label>
												<select value={form.type}
												        onChange={(e) => updateField("type", e.target.value)}
												        className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-callout-accent">
													<option value="received">Received</option>
													<option value="issued">Issued</option>
													<option value="credit_note">Credit Note</option>
												</select>
											</div>
										</div>
										<Input label="Order Number"
										       size="sm"
										       value={form.order_number}
										       issues={issuesFor("order_number")}
										       onChange={(e) => updateField("order_number", e.target.value)} />

										<div className="pt-2">
											<h3 className="text-xs font-medium uppercase tracking-wider text-text-gray mb-3">Pricing</h3>
											<div className="max-w-xs mb-4">
												<Input label="VAT Rate (%)"
												       size="sm"
												       type="number"
												       step="0.01"
												       value={form.vat_rate}
												       issues={issuesFor("vat_rate")}
												       onChange={(e) => updateField("vat_rate", e.target.value)} />
											</div>
											<div className="grid gap-6 sm:grid-cols-2">
												<div className="space-y-3">
													<h4 className="text-xs font-medium uppercase tracking-wider text-text-gray">EUR</h4>
													<Input label="Price"
													       size="sm"
													       type="number"
													       step="0.01"
													       value={form.price_eur}
													       issues={issuesFor("price_eur")}
													       onChange={(e) => updateField("price_eur", e.target.value)} />
													<Input label="Shipment"
													       size="sm"
													       type="number"
													       step="0.01"
													       value={form.shipment_eur}
													       issues={issuesFor("shipment_eur")}
													       onChange={(e) => updateField("shipment_eur", e.target.value)} />
													<Input label="VAT"
													       size="sm"
													       type="number"
													       step="0.01"
													       value={form.vat_eur}
													       issues={issuesFor("vat_eur")}
													       onChange={(e) => updateField("vat_eur", e.target.value)} />
													<Input label="Gross"
													       size="sm"
													       type="number"
													       step="0.01"
													       value={form.gross_eur}
													       issues={issuesFor("gross_eur")}
													       onChange={(e) => updateField("gross_eur", e.target.value)} />
												</div>
												<div className="space-y-3">
													<h4 className="text-xs font-medium uppercase tracking-wider text-text-gray">USD</h4>
													<Input label="Price"
													       size="sm"
													       type="number"
													       step="0.01"
													       value={form.price_usd}
													       issues={issuesFor("price_usd")}
													       onChange={(e) => updateField("price_usd", e.target.value)} />
													<Input label="Shipment"
													       size="sm"
													       type="number"
													       step="0.01"
													       value={form.shipment_usd}
													       issues={issuesFor("shipment_usd")}
													       onChange={(e) => updateField("shipment_usd", e.target.value)} />
													<Input label="VAT"
													       size="sm"
													       type="number"
													       step="0.01"
													       value={form.vat_usd}
													       issues={issuesFor("vat_usd")}
													       onChange={(e) => updateField("vat_usd", e.target.value)} />
													<Input label="Gross"
													       size="sm"
													       type="number"
													       step="0.01"
													       value={form.gross_usd}
													       issues={issuesFor("gross_usd")}
													       onChange={(e) => updateField("gross_usd", e.target.value)} />
												</div>
											</div>
										</div>

										<TextArea label="Notes"
										          size="sm"
										          rows={3}
										          value={form.notes}
										          issues={issuesFor("notes")}
										          onChange={(e) => updateField("notes", e.target.value)} />
									</div>
								) : (
									<>
										<div>
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
												               isUploading={isUploadingRefund} />
												<div className="glass-card glass-secondary p-4">
													<div className="text-xs text-text-gray uppercase tracking-wider mb-3">Details</div>
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
								)}


								{localItems.length > 0 && (
									<div>
										<div className="flex items-baseline justify-between mb-3">
											<div className="text-xs font-medium uppercase tracking-wider text-text-gray">
												Items ({localItems.length})
											</div>
											<div className="flex items-center gap-3">
												<button onClick={() => setEditingItems(!editingItems)}
												        className="text-xs text-text-gray hover:text-foreground transition-colors">
													{editingItems ? "Card view" : "Edit items"}
												</button>
												{isItemsDirty && (
													<Button variant="primary"
													        size="sm"
													        loading={isSavingItems}
													        onClick={handleSaveItems}>
														Save Items
													</Button>
												)}
											</div>
										</div>
										{editingItems ? (
											<ItemsTable items={itemsForm}
											            onItemChange={handleItemChange}
											            onCreateStone={handleCreateStone}
											            existingItemNumbers={existingItemNumbers}
											            creditNoteItems={creditNoteItems} />
										) : (
											localItems.map((item, i) => (
												<ItemCard key={item.item_number || i}
												          item={item}
												          refundInvoices={invoice.refund_invoices}
												          linkedStone={item.item_number ? stonesByItem.get(item.item_number) : undefined}
												          onCreateStone={() => handleCreateStone(i)}
												          isCreating={creatingStoneIdx === i} />
											))
										)}
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
					</AnimatePresence>
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

		</div>
	);
}