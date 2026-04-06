"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

import { Button } from "../../components/Button";
import { Checkbox } from "../../components/Checkbox";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { Input } from "../../components/Input";
import { TextArea } from "../../components/TextArea";
import { DeleteDialog } from "../../components/DeleteDialog";
import { InvoiceForm } from "../../components/InvoiceForms/InvoiceForm";
import { StoneEditForm } from "../../components/InvoiceForms/StoneEditForm";
import { fadeInUp, staggerContainer, staggerItem } from "../../lib/animations";
import type { InvoiceDetail } from "../../api/stones/types";
import type { StoneFormData, InvoiceFormData } from "../../components/InvoiceForms/InvoiceForms.types";

type StoneFormDataWithStatus = StoneFormData & {
	saveStatus: "idle" | "saving" | "saved" | "error";
	saveError: string | null;
};

interface InvoiceDetailClientProps {
	invoice: InvoiceDetail;
}

type ParseState = "idle" | "parsing" | "reviewing" | "saving";

interface FormState {
	invoice_number: string;
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
	is_paid: boolean;
	is_processed: boolean;
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

function initForm(invoice: InvoiceDetail): FormState {
	return {
		invoice_number: str(invoice.invoice_number),
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
		is_paid: invoice.is_paid,
		is_processed: invoice.is_processed,
	};
}

function buildSavePayload(form: FormState) {
	return {
		invoice_number: form.invoice_number || null,
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
		is_paid: form.is_paid,
		is_processed: form.is_processed,
	};
}

function buildStonePayload(stone: StoneFormData, invoiceId: string) {
	return {
		name: stone.name,
		description: stone.description || null,
		stone_type: stone.stone_type || null,
		color: stone.color || null,
		cut: stone.cut || null,
		weight_carats: toNum(stone.weight_carats),
		dimensions: stone.dimensions || null,
		country: stone.country || null,
		price_usd: toNum(stone.price_usd),
		price_eur: toNum(stone.price_eur),
		shipment_usd: toNum(stone.shipment_usd),
		shipment_eur: toNum(stone.shipment_eur),
		vat_usd: toNum(stone.vat_usd),
		vat_eur: toNum(stone.vat_eur),
		gross_usd: toNum(stone.gross_usd),
		gross_eur: toNum(stone.gross_eur),
		is_sold: false,
		invoice_id: invoiceId,
	};
}

function formatPrice(price: number | null): string {
	if (price == null) return "-";
	return `$${price.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function formatDateTime(date: string | null): string {
	if (!date) return "-";
	return new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}


export function InvoiceDetailClient({ invoice }: InvoiceDetailClientProps) {
	const router = useRouter();

	const [form, setForm] = useState<FormState>(() => initForm(invoice));
	const [isSaving, setIsSaving] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);

	const [parseState, setParseState] = useState<ParseState>("idle");
	const [showParseConfirm, setShowParseConfirm] = useState(false);
	const [parsedInvoice, setParsedInvoice] = useState<InvoiceFormData | null>(null);
	const [parsedStones, setParsedStones] = useState<StoneFormDataWithStatus[]>([]);
	const [isUploadingRefund, setIsUploadingRefund] = useState(false);
	const refundInputRef = useRef<HTMLInputElement>(null);

	const initialForm = useMemo(() => initForm(invoice), [invoice]);
	const isDirty = useMemo(() => {
		return JSON.stringify(form) !== JSON.stringify(initialForm);
	}, [form, initialForm]);


	const updateField = useCallback((field: keyof FormState, value: string | boolean) => {
		setForm((prev) => ({ ...prev, [field]: value }));
	}, []);

	const handleSave = useCallback(async () => {
		setIsSaving(true);
		try {
			const res = await fetch(`/api/invoices/${invoice.id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(buildSavePayload(form)),
			});
			if (!res.ok) throw new Error("Failed to save");
			toast.success("Invoice saved");
			router.refresh();
		} catch {
			toast.error("Failed to save invoice");
		} finally {
			setIsSaving(false);
		}
	}, [form, invoice.id, router]);

	const handleDelete = async () => {
		setIsDeleting(true);
		try {
			const response = await fetch(`/api/invoices/${invoice.id}`, { method: "DELETE" });
			if (!response.ok) throw new Error("Failed to delete invoice");
			router.push("/invoices");
		} catch {
			toast.error("Failed to delete invoice");
		} finally {
			setIsDeleting(false);
			setShowDeleteDialog(false);
		}
	};

	const handleParse = useCallback(async () => {
		setShowParseConfirm(false);
		setParseState("parsing");

		const isReparse = invoice.is_processed;

		try {
			if (!invoice.signed_url) {
				throw new Error("No PDF file attached to this invoice");
			}

			if (isReparse) {
				const resetPayload = {
					invoice_number: null,
					order_number: null,
					supplier: null,
					invoice_date: null,
					price_eur: null,
					price_usd: null,
					shipment_eur: null,
					shipment_usd: null,
					vat_rate: null,
					vat_eur: null,
					vat_usd: null,
					gross_eur: null,
					gross_usd: null,
					notes: null,
					is_processed: false,
					refund_of: null,
				};

				await fetch(`/api/invoices/${invoice.id}`, {
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(resetPayload),
				});

				setForm({
					invoice_number: "",
					order_number: "",
					supplier: "",
					invoice_date: "",
					price_eur: "",
					price_usd: "",
					shipment_eur: "",
					shipment_usd: "",
					vat_rate: "",
					vat_eur: "",
					vat_usd: "",
					gross_eur: "",
					gross_usd: "",
					notes: "",
					is_paid: form.is_paid,
					is_processed: false,
				});
			}

			const pdfResponse = await fetch(invoice.signed_url);
			if (!pdfResponse.ok) throw new Error("Failed to fetch PDF file");
			const blob = await pdfResponse.blob();
			const file = new File([blob], "invoice.pdf", { type: "application/pdf" });

			const formData = new FormData();
			formData.append("file", file);

			const parseRes = await fetch("/api/stones/parse-invoice", { method: "POST", body: formData });
			if (!parseRes.ok) {
				const err = await parseRes.json();
				throw new Error(err.error || "Failed to parse invoice");
			}

			const parsed = await parseRes.json();

			const invoiceFormData: InvoiceFormData = {
				id: invoice.id,
				invoice_number: str(parsed.invoice_number),
				order_number: str(parsed.order_number),
				supplier: str(parsed.supplier),
				invoice_date: str(parsed.invoice_date),
				price_usd: str(parsed.price_usd),
				price_eur: str(parsed.price_eur),
				shipment_usd: str(parsed.shipment_usd),
				shipment_eur: str(parsed.shipment_eur),
				vat_rate: str(parsed.vat_rate),
				vat_usd: str(parsed.vat_usd),
				vat_eur: str(parsed.vat_eur),
				gross_usd: str(parsed.gross_usd),
				gross_eur: str(parsed.gross_eur),
				is_refund: parsed.is_refund ?? false,
			};

			if (!isReparse) {
				setForm((prev) => {
					const updated = { ...prev };
					const fields: (keyof InvoiceFormData)[] = [
						"invoice_number", "order_number", "supplier", "invoice_date",
						"price_eur", "price_usd", "shipment_eur", "shipment_usd",
						"vat_rate", "vat_eur", "vat_usd", "gross_eur", "gross_usd",
					];
					for (const field of fields) {
						if (field === "id") continue;
						if (!updated[field as keyof FormState]) {
							(updated as Record<string, unknown>)[field] = invoiceFormData[field];
						}
					}
					return updated;
				});
			} else {
				setForm((prev) => ({
					...prev,
					invoice_number: invoiceFormData.invoice_number,
					order_number: invoiceFormData.order_number,
					supplier: invoiceFormData.supplier,
					invoice_date: invoiceFormData.invoice_date,
					price_eur: invoiceFormData.price_eur,
					price_usd: invoiceFormData.price_usd,
					shipment_eur: invoiceFormData.shipment_eur,
					shipment_usd: invoiceFormData.shipment_usd,
					vat_rate: invoiceFormData.vat_rate,
					vat_eur: invoiceFormData.vat_eur,
					vat_usd: invoiceFormData.vat_usd,
					gross_eur: invoiceFormData.gross_eur,
					gross_usd: invoiceFormData.gross_usd,
				}));
			}

			const stones: StoneFormDataWithStatus[] = (parsed.stones || []).map((s: Record<string, unknown>, i: number) => ({
				_id: `stone-${i}-${Date.now()}`,
				name: str(s.name),
				description: str(s.description),
				stone_type: str(s.stone_type),
				color: str(s.color),
				cut: str(s.cut),
				weight_carats: str(s.weight_carats),
				dimensions: str(s.dimensions),
				country: str(s.country),
				price_usd: str(s.price_usd),
				price_eur: str(s.price_eur),
				shipment_usd: str(s.shipment_usd),
				shipment_eur: str(s.shipment_eur),
				vat_usd: str(s.vat_usd),
				vat_eur: str(s.vat_eur),
				gross_usd: str(s.gross_usd),
				gross_eur: str(s.gross_eur),
				errors: {},
				saveStatus: "idle" as const,
				saveError: null,
			}));

			if (stones.length === 0) {
				throw new Error("No stones found in the invoice");
			}

			setParsedInvoice(invoiceFormData);
			setParsedStones(stones);
			setParseState("reviewing");
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Failed to parse invoice");
			setParseState("idle");
		}
	}, [invoice.signed_url, invoice.id, invoice.is_processed, form.is_paid]);

	const handleSaveStones = useCallback(async () => {
		let hasError = false;
		const validated = parsedStones.map((stone) => {
			const errors: Record<string, string> = {};
			if (!stone.name.trim()) {
				errors.name = "Name is required";
				hasError = true;
			}
			return { ...stone, errors };
		});

		if (hasError) {
			setParsedStones(validated);
			return;
		}

		setParseState("saving");

		if (parsedInvoice) {
			try {
				await fetch(`/api/invoices/${invoice.id}`, {
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						invoice_number: parsedInvoice.invoice_number || null,
						order_number: parsedInvoice.order_number || null,
						supplier: parsedInvoice.supplier || null,
						invoice_date: parsedInvoice.invoice_date || null,
						price_usd: toNum(parsedInvoice.price_usd),
						price_eur: toNum(parsedInvoice.price_eur),
						shipment_usd: toNum(parsedInvoice.shipment_usd),
						shipment_eur: toNum(parsedInvoice.shipment_eur),
						vat_rate: toNum(parsedInvoice.vat_rate),
						vat_usd: toNum(parsedInvoice.vat_usd),
						vat_eur: toNum(parsedInvoice.vat_eur),
						gross_usd: toNum(parsedInvoice.gross_usd),
						gross_eur: toNum(parsedInvoice.gross_eur),
					}),
				});
			} catch {
				toast.error("Failed to save invoice metadata");
			}
		}

		const updated = [...parsedStones];
		for (let i = 0; i < updated.length; i++) {
			if (updated[i].saveStatus === "saved") continue;

			updated[i] = { ...updated[i], saveStatus: "saving" };
			setParsedStones([...updated]);

			try {
				const payload = buildStonePayload(updated[i], invoice.id);
				const res = await fetch("/api/stones", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(payload),
				});

				if (!res.ok) {
					const data = await res.json();
					throw new Error(data.error || "Failed to save");
				}

				updated[i] = { ...updated[i], saveStatus: "saved" };
			} catch (err) {
				updated[i] = { ...updated[i], saveStatus: "error", saveError: err instanceof Error ? err.message : "Failed to save" };
			}

			setParsedStones([...updated]);
		}

		const allSaved = updated.every((s) => s.saveStatus === "saved");
		if (allSaved) {
			router.refresh();
			setTimeout(() => {
				setParsedInvoice(null);
				setParsedStones([]);
				setParseState("idle");
			}, 1000);
		}
	}, [parsedStones, parsedInvoice, invoice.id, router]);

	const handleUploadRefund = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		e.target.value = "";

		setIsUploadingRefund(true);
		try {
			const formData = new FormData();
			formData.append("file", file);
			const uploadRes = await fetch("/api/invoices", { method: "POST", body: formData });
			if (!uploadRes.ok) throw new Error("Failed to upload credit note");
			const newInvoice = await uploadRes.json();

			const patchRes = await fetch(`/api/invoices/${newInvoice.id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ refund_of: invoice.id }),
			});
			if (!patchRes.ok) throw new Error("Failed to link credit note");

			toast.success("Credit note uploaded");
			router.refresh();
		} catch {
			toast.error("Failed to upload credit note");
		} finally {
			setIsUploadingRefund(false);
		}
	}, [invoice.id, router]);

	const handleRetrySave = useCallback(() => {
		const updated = parsedStones.map((s) =>
			s.saveStatus === "error" ? { ...s, saveStatus: "idle" as const, saveError: null } : s
		);
		setParsedStones(updated);
		setParseState("reviewing");
	}, [parsedStones]);

	const handleUpdateInvoiceField = useCallback((field: keyof InvoiceFormData, value: string) => {
		setParsedInvoice((prev) => prev ? { ...prev, [field]: value } : prev);
	}, []);

	const handleUpdateStoneField = useCallback((index: number, field: string, value: string) => {
		setParsedStones((prev) => {
			const next = [...prev];
			const updated = { ...next[index], [field]: value };
			if (next[index].errors[field]) {
				const { [field]: _, ...rest } = next[index].errors;
				updated.errors = rest;
			}
			next[index] = updated;
			return next;
		});
	}, []);

	const savedCount = parsedStones.filter((s) => s.saveStatus === "saved").length;
	const failedCount = parsedStones.filter((s) => s.saveStatus === "error").length;
	const isSaveComplete = parsedStones.length > 0 && savedCount + failedCount === parsedStones.length;
	const allSaved = savedCount === parsedStones.length && parsedStones.length > 0;

	const parseButtonLabel = invoice.is_processed ? "Re-parse Invoice" : "Parse Invoice";


	return (
		<div className="min-h-screen relative pt-16">
			<div className="fixed inset-0 z-0 opacity-10 pointer-events-none"
			     style={{
				     backgroundImage: 'url("/NNNoise Texture Generator.svg")',
				     backgroundSize: "400px 400px",
				     backgroundRepeat: "repeat",
			     }} />

			<section className="relative py-12 px-4 sm:px-6 lg:px-8 z-10">
				<div className="max-w-4xl mx-auto">
					<motion.div variants={fadeInUp}
					            initial="hidden"
					            animate="visible">
						<Link href="/invoices"
						      className="inline-flex items-center gap-1 text-sm text-text-gray hover:text-foreground transition-colors mb-6">
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
					</motion.div>

					<motion.div variants={staggerContainer}
					            initial="hidden"
					            animate="visible"
					            className="mb-8">
						<motion.div variants={staggerItem}
						            className="flex flex-col gap-1">
							<h1 className="text-2xl font-medium text-foreground">
								{invoice.invoice_number || "Invoice"}
							</h1>

							<div className="flex items-center justify-between">
								<span className="text-xs text-text-gray">{formatDateTime(invoice.created_at)}</span>
								<div className="flex items-center gap-2">
									<span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium">
										<span className={`h-2 w-2 rounded-full ${invoice.is_paid ? "bg-green-500" : "bg-amber-400"}`} />
										{invoice.is_paid ? "Paid" : "Unpaid"}
									</span>
									{invoice.refund_of && (
										<span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
											Credit Note
										</span>
									)}
								</div>
							</div>
						</motion.div>
					</motion.div>

					{invoice.parent_invoice && (
						<div className="mb-6 rounded-lg border border-amber-200 bg-amber-50/50 p-4">
							<p className="text-sm text-foreground">
								Credit note for{" "}
								<Link href={`/invoices/${invoice.parent_invoice.id}`}
								      className="font-medium text-callout-accent hover:underline">
									Invoice {invoice.parent_invoice.invoice_number || invoice.parent_invoice.id.slice(0, 8)}
								</Link>
							</p>
						</div>
					)}

					<AnimatePresence mode="wait">
						{parseState === "parsing" && (
							<motion.div key="parsing"
							            initial={{ opacity: 0, y: 10 }}
							            animate={{ opacity: 1, y: 0 }}
							            exit={{ opacity: 0, y: -10 }}
							            className="mb-10 flex flex-col items-center py-12">
								<motion.div className="h-10 w-10 rounded-full border-2 border-callout-accent border-t-transparent"
								            animate={{ rotate: 360 }}
								            transition={{ duration: 1, repeat: Infinity, ease: "linear" }} />
								<p className="mt-4 text-sm text-text-gray">Parsing invoice with AI...</p>
							</motion.div>
						)}

						{(parseState === "reviewing" || parseState === "saving") && parsedStones.length > 0 && (
							<motion.div key="review"
							            initial={{ opacity: 0, y: 10 }}
							            animate={{ opacity: 1, y: 0 }}
							            exit={{ opacity: 0, y: -10 }}
							            className="mb-10 space-y-6">
								<div className="flex items-center justify-between">
									<h2 className="text-xs font-medium uppercase tracking-wider text-text-gray">
										Parsed data
									</h2>
									<div className="flex gap-2">
										{parseState === "reviewing" && (
											<>
												<Button variant="ghost"
												        size="sm"
												        onClick={() => { setParsedInvoice(null); setParsedStones([]); setParseState("idle"); }}>
													Cancel
												</Button>
												<Button variant="primary"
												        size="sm"
												        onClick={handleSaveStones}>
													Save All
												</Button>
											</>
										)}
										{isSaveComplete && !allSaved && (
											<>
												<Button variant="ghost"
												        size="sm"
												        onClick={() => { setParsedInvoice(null); setParsedStones([]); setParseState("idle"); }}>
													Close
												</Button>
												<Button variant="primary"
												        size="sm"
												        onClick={handleRetrySave}>
													Retry Failed
												</Button>
											</>
										)}
										{allSaved && (
											<span className="text-sm text-green-600 font-medium">All saved</span>
										)}
									</div>
								</div>

								{parseState === "saving" && (
									<div>
										<div className="flex items-center justify-between text-xs text-text-gray mb-1">
											<span>Saving...</span>
											<span>{savedCount + failedCount}/{parsedStones.length}</span>
										</div>
										<div className="h-1.5 overflow-hidden rounded-full bg-border">
											<motion.div className="h-full rounded-full bg-callout-accent"
											            initial={{ width: 0 }}
											            animate={{ width: `${Math.round(((savedCount + failedCount) / parsedStones.length) * 100)}%` }}
											            transition={{ duration: 0.3 }} />
										</div>
									</div>
								)}

								{parsedInvoice && parseState === "reviewing" && (
									<div className="rounded-lg border border-border p-4">
										<h3 className="text-sm font-medium text-foreground mb-3">Invoice Details</h3>
										<InvoiceForm invoice={parsedInvoice}
										             onChange={handleUpdateInvoiceField} />
									</div>
								)}

								<div>
									<h3 className="text-sm font-medium text-foreground mb-3">
										Stones ({parsedStones.length})
									</h3>
									<div className="space-y-3">
										{parsedStones.map((stone, i) => (
											<div key={stone._id}
											     className={`rounded-lg border p-4 ${
												     stone.saveStatus === "saved" ? "border-green-200 bg-green-50/50" :
												     stone.saveStatus === "error" ? "border-red-200 bg-red-50/50" :
												     "border-border"
											     }`}>
												<div className="flex items-center gap-2 mb-3">
													{stone.saveStatus === "saving" && (
														<motion.div className="h-4 w-4 shrink-0 rounded-full border-2 border-callout-accent border-t-transparent"
														            animate={{ rotate: 360 }}
														            transition={{ duration: 1, repeat: Infinity, ease: "linear" }} />
													)}
													{stone.saveStatus === "saved" && (
														<svg className="h-4 w-4 text-green-600"
														     fill="none"
														     viewBox="0 0 24 24"
														     stroke="currentColor"
														     strokeWidth={2.5}>
															<path strokeLinecap="round"
															      strokeLinejoin="round"
															      d="M5 13l4 4L19 7" />
														</svg>
													)}
													{stone.saveStatus === "error" && (
														<svg className="h-4 w-4 text-red-500"
														     fill="none"
														     viewBox="0 0 24 24"
														     stroke="currentColor"
														     strokeWidth={2.5}>
															<path strokeLinecap="round"
															      strokeLinejoin="round"
															      d="M6 18L18 6M6 6l12 12" />
														</svg>
													)}
													<span className="text-sm font-medium text-foreground">
														Stone {i + 1}: {stone.name || "Unnamed"}
													</span>
													{stone.saveError && (
														<span className="text-xs text-red-500 ml-auto">{stone.saveError}</span>
													)}
												</div>

												{parseState === "reviewing" ? (
													<StoneEditForm stone={stone}
													               onChange={(field, value) => handleUpdateStoneField(i, field, value)} />
												) : (
													<div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
														<div><span className="text-xs text-text-gray">Type:</span> {stone.stone_type || "-"}</div>
														<div><span className="text-xs text-text-gray">Color:</span> {stone.color || "-"}</div>
														<div><span className="text-xs text-text-gray">Weight:</span> {stone.weight_carats ? `${stone.weight_carats} ct` : "-"}</div>
													</div>
												)}
											</div>
										))}
									</div>
								</div>
							</motion.div>
						)}
					</AnimatePresence>

					<motion.div variants={staggerContainer}
					            initial="hidden"
					            animate="visible"
					            className="space-y-10">
						<motion.div variants={staggerItem}>
							<div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-background-creme/30 p-4">
								<div className="flex flex-wrap items-center gap-6">
									<Checkbox label="Paid"
									          checked={form.is_paid}
									          onChange={() => updateField("is_paid", !form.is_paid)} />
									<Checkbox label="Processed"
									          checked={form.is_processed}
									          onChange={() => updateField("is_processed", !form.is_processed)} />
								</div>

								<div className="flex items-center gap-2">
									{invoice.signed_url && parseState === "idle" && (
										<Button variant="secondary"
										        size="sm"
										        onClick={() => setShowParseConfirm(true)}>
											{parseButtonLabel}
										</Button>
									)}
									<AnimatePresence>
										{isDirty && (
											<motion.div initial={{ opacity: 0, scale: 0.95 }}
											            animate={{ opacity: 1, scale: 1 }}
											            exit={{ opacity: 0, scale: 0.95 }}>
												<Button variant="primary"
												        size="sm"
												        loading={isSaving}
												        onClick={handleSave}>
													Save
												</Button>
											</motion.div>
										)}
									</AnimatePresence>
									<Button variant="ghost"
									        size="sm"
									        onClick={() => setShowDeleteDialog(true)}>
										<svg className="h-4 w-4 text-red-500"
										     fill="none"
										     viewBox="0 0 24 24"
										     stroke="currentColor">
											<path strokeLinecap="round"
											      strokeLinejoin="round"
											      strokeWidth={1.5}
											      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
										</svg>
									</Button>
								</div>
							</div>
						</motion.div>

						<motion.div variants={staggerItem}>
							<div className="space-y-4">
								<div className="grid gap-4 sm:grid-cols-2">
									<Input label="Invoice Number"
									       size="sm"
									       value={form.invoice_number}
									       onChange={(e) => updateField("invoice_number", e.target.value)}
									       placeholder="e.g., 1261/2026" />

									<Input label="Supplier"
									       size="sm"
									       value={form.supplier}
									       onChange={(e) => updateField("supplier", e.target.value)}
									       placeholder="e.g., LD GEMS BV" />
								</div>

								<div className="grid gap-4 sm:grid-cols-2">
									<Input label="Invoice Date"
									       size="sm"
									       type="date"
									       value={form.invoice_date}
									       onChange={(e) => updateField("invoice_date", e.target.value)} />

									<Input label="Order Number"
									       size="sm"
									       value={form.order_number}
									       onChange={(e) => updateField("order_number", e.target.value)}
									       placeholder="e.g., ORD-12345" />
								</div>
							</div>
						</motion.div>

						<motion.div variants={staggerItem}>
							<h2 className="text-xs font-medium uppercase tracking-wider text-text-gray mb-4">Pricing</h2>
							<div className="space-y-6">
								<div className="max-w-xs">
									<Input label="VAT Rate (%)"
									       size="sm"
									       type="number"
									       step="0.01"
									       min="0"
									       value={form.vat_rate}
									       onChange={(e) => updateField("vat_rate", e.target.value)}
									       placeholder="0" />
								</div>

								<div className="grid gap-8 sm:grid-cols-2">
									<div className="space-y-4">
										<h3 className="text-xs font-medium uppercase tracking-wider text-text-gray">EUR</h3>
										<Input label="Price"
										       size="sm"
										       type="number"
										       step="0.01"
										       min="0"
										       value={form.price_eur}
										       onChange={(e) => updateField("price_eur", e.target.value)}
										       placeholder="0.00" />
										<Input label="Shipment"
										       size="sm"
										       type="number"
										       step="0.01"
										       min="0"
										       value={form.shipment_eur}
										       onChange={(e) => updateField("shipment_eur", e.target.value)}
										       placeholder="0.00" />
										<Input label="VAT"
										       size="sm"
										       type="number"
										       step="0.01"
										       min="0"
										       value={form.vat_eur}
										       onChange={(e) => updateField("vat_eur", e.target.value)}
										       placeholder="0.00" />
										<Input label="Gross"
										       size="sm"
										       type="number"
										       step="0.01"
										       min="0"
										       value={form.gross_eur}
										       onChange={(e) => updateField("gross_eur", e.target.value)}
										       placeholder="0.00" />
									</div>

									<div className="space-y-4">
										<h3 className="text-xs font-medium uppercase tracking-wider text-text-gray">USD</h3>
										<Input label="Price"
										       size="sm"
										       type="number"
										       step="0.01"
										       min="0"
										       value={form.price_usd}
										       onChange={(e) => updateField("price_usd", e.target.value)}
										       placeholder="0.00" />
										<Input label="Shipment"
										       size="sm"
										       type="number"
										       step="0.01"
										       min="0"
										       value={form.shipment_usd}
										       onChange={(e) => updateField("shipment_usd", e.target.value)}
										       placeholder="0.00" />
										<Input label="VAT"
										       size="sm"
										       type="number"
										       step="0.01"
										       min="0"
										       value={form.vat_usd}
										       onChange={(e) => updateField("vat_usd", e.target.value)}
										       placeholder="0.00" />
										<Input label="Gross"
										       size="sm"
										       type="number"
										       step="0.01"
										       min="0"
										       value={form.gross_usd}
										       onChange={(e) => updateField("gross_usd", e.target.value)}
										       placeholder="0.00" />
									</div>
								</div>
							</div>
						</motion.div>

						<motion.div variants={staggerItem}>
							<TextArea label="Notes"
							          size="sm"
							          rows={3}
							          value={form.notes}
							          onChange={(e) => updateField("notes", e.target.value)}
							          placeholder="Optional notes..." />
						</motion.div>

						<motion.div variants={staggerItem}>
							<h2 className="text-xs font-medium uppercase tracking-wider text-text-gray mb-4">Documents</h2>
							<div className="space-y-2">
								{invoice.signed_url && (
									<div className="flex items-center gap-2">
										<svg className="h-4 w-4 shrink-0 text-text-gray"
										     fill="none"
										     viewBox="0 0 24 24"
										     stroke="currentColor"
										     strokeWidth={1.5}>
											<path strokeLinecap="round"
											      strokeLinejoin="round"
											      d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
										</svg>
										<a href={invoice.signed_url}
										   target="_blank"
										   rel="noopener noreferrer"
										   className="font-mono text-sm text-callout-accent hover:underline transition-colors">
											{invoice.id}
										</a>
									</div>
								)}

								{!invoice.refund_of && (
									<div className="pl-6 space-y-1.5">
										{invoice.refund_invoices && invoice.refund_invoices.length > 0 && (
											invoice.refund_invoices.map((refund) => (
												<div key={refund.id}
												     className="flex items-center gap-2">
													<svg className="h-3.5 w-3.5 shrink-0 text-amber-500"
													     fill="none"
													     viewBox="0 0 24 24"
													     stroke="currentColor"
													     strokeWidth={1.5}>
														<path strokeLinecap="round"
														      strokeLinejoin="round"
														      d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
													</svg>
													{refund.signed_url ? (
														<a href={refund.signed_url}
														   target="_blank"
														   rel="noopener noreferrer"
														   className="font-mono text-sm text-callout-accent hover:underline transition-colors">
															{refund.id}
														</a>
													) : (
														<Link href={`/invoices/${refund.id}`}
														      className="font-mono text-sm text-callout-accent hover:underline transition-colors">
															{refund.id}
														</Link>
													)}
												</div>
											))
										)}

										<input ref={refundInputRef}
										       type="file"
										       accept=".pdf,application/pdf"
										       onChange={handleUploadRefund}
										       className="hidden" />
										<button onClick={() => refundInputRef.current?.click()}
										        disabled={isUploadingRefund}
										        className="inline-flex items-center gap-1.5 text-xs text-text-gray hover:text-foreground transition-colors mt-1">
											<svg className="h-3.5 w-3.5"
											     fill="none"
											     viewBox="0 0 24 24"
											     stroke="currentColor"
											     strokeWidth={1.5}>
												<path strokeLinecap="round"
												      strokeLinejoin="round"
												      d="M12 4.5v15m7.5-7.5h-15" />
											</svg>
											{isUploadingRefund ? "Uploading..." : "Add credit note"}
										</button>
									</div>
								)}
							</div>
						</motion.div>

						<motion.div variants={staggerItem}>
							<h2 className="text-xs font-medium uppercase tracking-wider text-text-gray mb-4">
								Stones ({invoice.stones.length})
							</h2>
							{invoice.stones.length === 0 ? (
								<p className="text-sm text-text-gray">No stones linked to this invoice.</p>
							) : (
								<div className="overflow-x-auto">
									<table className="w-full text-sm">
										<thead>
											<tr className="border-b border-border text-left text-xs text-text-gray uppercase tracking-wider">
												<th className="pb-3 pr-4 font-medium">Name</th>
												<th className="pb-3 pr-4 font-medium hidden sm:table-cell">Type</th>
												<th className="pb-3 pr-4 font-medium hidden sm:table-cell">Color</th>
												<th className="pb-3 pr-4 font-medium text-right">Weight</th>
												<th className="pb-3 pr-4 font-medium text-right">Price</th>
												<th className="pb-3 font-medium">Status</th>
											</tr>
										</thead>
										<tbody>
											{invoice.stones.map((stone) => (
												<tr key={stone.id}
												    className="border-b border-border-light hover:bg-background-creme/50 transition-colors">
													<td className="py-3 pr-4">
														<Link href={`/stones/${stone.id}`}
														      className="font-medium text-foreground hover:text-callout-accent transition-colors">
															{stone.name}
														</Link>
													</td>
													<td className="py-3 pr-4 text-text-gray hidden sm:table-cell">
														{stone.stone_type || "-"}
													</td>
													<td className="py-3 pr-4 text-text-gray hidden sm:table-cell">
														{stone.color || "-"}
													</td>
													<td className="py-3 pr-4 text-right tabular-nums">
														{stone.weight_carats ? `${stone.weight_carats} ct` : "-"}
													</td>
													<td className="py-3 pr-4 text-right tabular-nums">
														{formatPrice(stone.selling_price)}
													</td>
													<td className="py-3">
														<span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
															stone.is_sold
																? "bg-gray-100 text-gray-800"
																: "bg-green-100 text-green-800"
														}`}>
															{stone.is_sold ? "Sold" : "Available"}
														</span>
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							)}
						</motion.div>
					</motion.div>
				</div>
			</section>

			<ConfirmDialog isOpen={showParseConfirm}
			              onClose={() => setShowParseConfirm(false)}
			              onConfirm={handleParse}
			              title={parseButtonLabel}
			              message={invoice.is_processed
				              ? "Re-parse this invoice? This will reset all fields and extract data again."
				              : "Parse this invoice PDF? This will extract stone data using AI."}
			              confirmText={invoice.is_processed ? "Re-parse" : "Parse"} />

			<DeleteDialog isOpen={showDeleteDialog}
			              onClose={() => setShowDeleteDialog(false)}
			              onConfirm={handleDelete}
			              title="Delete Invoice"
			              message={`Are you sure you want to delete invoice "${invoice.invoice_number || invoice.id}"? This action cannot be undone.`}
			              isPending={isDeleting} />

		</div>
	);
}
