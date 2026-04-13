"use client";

import { useState, useCallback, useMemo } from "react";
import toast from "react-hot-toast";

import { SlidePanel } from "@/app/components/SlidePanel";
import { Button } from "@/app/components/Button";
import { Input } from "@/app/components/Input";
import { TextArea } from "@/app/components/TextArea";
import type { Stone } from "@/app/api/stones/types";


interface StoneEditPanelProps {
	isOpen: boolean;
	onClose: () => void;
	stone: Stone;
	onSaved: () => void;
}


interface FormState {
	name: string;
	stone_type: string;
	color: string;
	cut: string;
	weight_carats: string;
	dimensions: string;
	country: string;
	description: string;
	price_eur: string;
	price_usd: string;
	shipment_eur: string;
	shipment_usd: string;
	vat_eur: string;
	vat_usd: string;
	gross_eur: string;
	gross_usd: string;
	selling_price: string;
	is_sold: boolean;
	sold_at: string;
	sold_price: string;
	notes: string;
}


function str(val: unknown): string {
	if (val == null) return "";
	return String(val);
}

function toNum(val: string): number | null {
	if (!val) return null;
	const n = parseFloat(val);
	return !isNaN(n) ? n : null;
}


function initForm(stone: Stone): FormState {
	return {
		name: str(stone.name),
		stone_type: str(stone.stone_type),
		color: str(stone.color),
		cut: str(stone.cut),
		weight_carats: str(stone.weight_carats),
		dimensions: str(stone.dimensions),
		country: str(stone.country),
		description: str(stone.description),
		price_eur: str(stone.price_eur),
		price_usd: str(stone.price_usd),
		shipment_eur: str(stone.shipment_eur),
		shipment_usd: str(stone.shipment_usd),
		vat_eur: str(stone.vat_eur),
		vat_usd: str(stone.vat_usd),
		gross_eur: str(stone.gross_eur),
		gross_usd: str(stone.gross_usd),
		selling_price: str(stone.selling_price),
		is_sold: stone.is_sold,
		sold_at: str(stone.sold_at ? stone.sold_at.split("T")[0] : ""),
		sold_price: str(stone.sold_price),
		notes: str(stone.notes),
	};
}


export function StoneEditPanel({ isOpen, onClose, stone, onSaved }: StoneEditPanelProps) {
	const [form, setForm] = useState<FormState>(() => initForm(stone));
	const [isSaving, setIsSaving] = useState(false);

	const initialForm = useMemo(() => initForm(stone), [stone]);
	const isDirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(initialForm), [form, initialForm]);

	const hasLinkedInvoice = (stone.stone_invoices?.length ?? 0) > 0;

	const updateField = useCallback((field: keyof FormState, value: string | boolean) => {
		setForm((prev) => ({ ...prev, [field]: value }));
	}, []);

	const handleCancel = useCallback(() => {
		setForm(initForm(stone));
		onClose();
	}, [stone, onClose]);

	const handleSave = useCallback(async () => {
		if (!form.name.trim()) {
			toast.error("Name is required");
			return;
		}

		setIsSaving(true);
		try {
			const payload: Record<string, unknown> = {
				name: form.name,
				stone_type: form.stone_type || null,
				color: form.color || null,
				cut: form.cut || null,
				weight_carats: toNum(form.weight_carats),
				dimensions: form.dimensions || null,
				country: form.country || null,
				description: form.description || null,
				selling_price: toNum(form.selling_price),
				is_sold: form.is_sold,
				sold_at: form.sold_at ? new Date(form.sold_at).toISOString() : null,
				sold_price: toNum(form.sold_price),
				notes: form.notes || null,
			};

			if (!hasLinkedInvoice) {
				payload.price_eur = toNum(form.price_eur);
				payload.price_usd = toNum(form.price_usd);
				payload.shipment_eur = toNum(form.shipment_eur);
				payload.shipment_usd = toNum(form.shipment_usd);
				payload.vat_eur = toNum(form.vat_eur);
				payload.vat_usd = toNum(form.vat_usd);
				payload.gross_eur = toNum(form.gross_eur);
				payload.gross_usd = toNum(form.gross_usd);
			}

			const res = await fetch(`/api/stones/${stone.id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});

			if (!res.ok) throw new Error("Failed to save");

			toast.success("Stone saved");
			onSaved();
			onClose();
		} catch {
			toast.error("Failed to save. Please try again.");
		} finally {
			setIsSaving(false);
		}
	}, [form, stone.id, hasLinkedInvoice, onSaved, onClose]);


	return (
		<SlidePanel isOpen={isOpen}
		            onClose={handleCancel}
		            title="Edit Stone"
		            footer={
			            <div className="flex justify-end gap-3">
				            <Button variant="secondary"
				                    size="sm"
				                    onClick={handleCancel}>
					            Cancel
				            </Button>
				            <Button variant="primary"
				                    size="sm"
				                    loading={isSaving}
				                    onClick={handleSave}
				                    disabled={!isDirty}>
					            Save
				            </Button>
			            </div>
		            }>
			<div className="space-y-5">
				<div>
					<div className="text-xs font-medium uppercase tracking-wider text-text-gray mb-3">Basic Info</div>
					<div className="space-y-3">
						<Input label="Name"
						       size="sm"
						       value={form.name}
						       onChange={(e) => updateField("name", e.target.value)} />
						<div className="grid gap-3 sm:grid-cols-2">
							<Input label="Stone Type"
							       size="sm"
							       value={form.stone_type}
							       onChange={(e) => updateField("stone_type", e.target.value)} />
							<Input label="Color"
							       size="sm"
							       value={form.color}
							       onChange={(e) => updateField("color", e.target.value)} />
						</div>
						<div className="grid gap-3 sm:grid-cols-2">
							<Input label="Cut"
							       size="sm"
							       value={form.cut}
							       onChange={(e) => updateField("cut", e.target.value)} />
							<Input label="Weight (ct)"
							       size="sm"
							       type="number"
							       step="0.01"
							       value={form.weight_carats}
							       onChange={(e) => updateField("weight_carats", e.target.value)} />
						</div>
						<div className="grid gap-3 sm:grid-cols-2">
							<Input label="Dimensions"
							       size="sm"
							       value={form.dimensions}
							       onChange={(e) => updateField("dimensions", e.target.value)} />
							<Input label="Country"
							       size="sm"
							       value={form.country}
							       onChange={(e) => updateField("country", e.target.value)} />
						</div>
					</div>
				</div>


				<div>
					<TextArea label="Description"
					          size="sm"
					          rows={3}
					          value={form.description}
					          onChange={(e) => updateField("description", e.target.value)} />
				</div>


				<div>
					<div className="text-xs font-medium uppercase tracking-wider text-text-gray mb-3">
						Pricing
						{hasLinkedInvoice && (
							<span className="ml-2 font-normal normal-case tracking-normal text-text-gray/60">
								(read-only, linked to invoice)
							</span>
						)}
					</div>
					<div className="grid gap-6 sm:grid-cols-2">
						<div className="space-y-3">
							<div className="text-xs font-medium uppercase tracking-wider text-text-gray">EUR</div>
							<Input label="Price"
							       size="sm"
							       type="number"
							       step="0.01"
							       value={form.price_eur}
							       readOnly={hasLinkedInvoice}
							       onChange={(e) => updateField("price_eur", e.target.value)} />
							<Input label="Shipment"
							       size="sm"
							       type="number"
							       step="0.01"
							       value={form.shipment_eur}
							       readOnly={hasLinkedInvoice}
							       onChange={(e) => updateField("shipment_eur", e.target.value)} />
							<Input label="VAT"
							       size="sm"
							       type="number"
							       step="0.01"
							       value={form.vat_eur}
							       readOnly={hasLinkedInvoice}
							       onChange={(e) => updateField("vat_eur", e.target.value)} />
							<Input label="Gross"
							       size="sm"
							       type="number"
							       step="0.01"
							       value={form.gross_eur}
							       readOnly={hasLinkedInvoice}
							       onChange={(e) => updateField("gross_eur", e.target.value)} />
						</div>
						<div className="space-y-3">
							<div className="text-xs font-medium uppercase tracking-wider text-text-gray">USD</div>
							<Input label="Price"
							       size="sm"
							       type="number"
							       step="0.01"
							       value={form.price_usd}
							       readOnly={hasLinkedInvoice}
							       onChange={(e) => updateField("price_usd", e.target.value)} />
							<Input label="Shipment"
							       size="sm"
							       type="number"
							       step="0.01"
							       value={form.shipment_usd}
							       readOnly={hasLinkedInvoice}
							       onChange={(e) => updateField("shipment_usd", e.target.value)} />
							<Input label="VAT"
							       size="sm"
							       type="number"
							       step="0.01"
							       value={form.vat_usd}
							       readOnly={hasLinkedInvoice}
							       onChange={(e) => updateField("vat_usd", e.target.value)} />
							<Input label="Gross"
							       size="sm"
							       type="number"
							       step="0.01"
							       value={form.gross_usd}
							       readOnly={hasLinkedInvoice}
							       onChange={(e) => updateField("gross_usd", e.target.value)} />
						</div>
					</div>
				</div>


				<div>
					<div className="text-xs font-medium uppercase tracking-wider text-text-gray mb-3">Selling</div>
					<div className="space-y-3">
						<Input label="Selling Price"
						       size="sm"
						       type="number"
						       step="0.01"
						       value={form.selling_price}
						       onChange={(e) => updateField("selling_price", e.target.value)} />

						<div className="flex items-center gap-3 py-2">
							<button type="button"
							        onClick={() => updateField("is_sold", !form.is_sold)}
							        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
								        form.is_sold ? "bg-foreground" : "bg-border"
							        }`}
							        role="switch"
							        aria-checked={form.is_sold}>
								<span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-background shadow ring-0 transition-transform ${
									form.is_sold ? "translate-x-4" : "translate-x-0"
								}`} />
							</button>
							<span className="text-sm text-foreground">Sold</span>
						</div>

						{form.is_sold && (
							<div className="grid gap-3 sm:grid-cols-2">
								<Input label="Sold Date"
								       size="sm"
								       type="date"
								       value={form.sold_at}
								       onChange={(e) => updateField("sold_at", e.target.value)} />
								<Input label="Sold Price"
								       size="sm"
								       type="number"
								       step="0.01"
								       value={form.sold_price}
								       onChange={(e) => updateField("sold_price", e.target.value)} />
							</div>
						)}
					</div>
				</div>


				<div>
					<TextArea label="Notes"
					          size="sm"
					          rows={3}
					          value={form.notes}
					          onChange={(e) => updateField("notes", e.target.value)} />
				</div>
			</div>
		</SlidePanel>
	);
}
