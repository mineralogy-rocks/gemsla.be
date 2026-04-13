"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

import { SlidePanel } from "@/app/components/SlidePanel";
import { Button } from "@/app/components/Button";
import { Input } from "@/app/components/Input";
import { TextArea } from "@/app/components/TextArea";
import type { InvoiceItem, StoneListItem } from "@/app/api/stones/types";
import type { ItemFormData } from "@/app/components/InvoiceForms/InvoiceForms.types";


interface CreditNoteItemData {
	invoiceId: string;
	invoiceNumber: string | null;
	item: InvoiceItem;
	allItems: InvoiceItem[];
}

interface ItemEditPanelProps {
	isOpen: boolean;
	onClose: () => void;
	item: ItemFormData | null;
	itemIndex: number;
	onItemChange: (index: number, field: string, value: string) => void;
	onSave: () => void;
	isSaving: boolean;
	creditNoteData: CreditNoteItemData[];
	onSaveCreditNoteItem: (creditNoteInvoiceId: string, updatedItems: InvoiceItem[]) => Promise<void>;
	linkedStone?: StoneListItem;
	onCreateStone: () => void;
	isCreatingStone: boolean;
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


interface CnFormState {
	price_eur: string;
	price_usd: string;
	shipment_eur: string;
	shipment_usd: string;
	vat_eur: string;
	vat_usd: string;
	gross_eur: string;
	gross_usd: string;
}

function initCnForm(item: InvoiceItem): CnFormState {
	return {
		price_eur: str(item.price_eur),
		price_usd: str(item.price_usd),
		shipment_eur: str(item.shipment_eur),
		shipment_usd: str(item.shipment_usd),
		vat_eur: str(item.vat_eur),
		vat_usd: str(item.vat_usd),
		gross_eur: str(item.gross_eur),
		gross_usd: str(item.gross_usd),
	};
}

function cnFormToItem(form: CnFormState, original: InvoiceItem): InvoiceItem {
	return {
		...original,
		price_eur: toNum(form.price_eur),
		price_usd: toNum(form.price_usd),
		shipment_eur: toNum(form.shipment_eur),
		shipment_usd: toNum(form.shipment_usd),
		vat_eur: toNum(form.vat_eur),
		vat_usd: toNum(form.vat_usd),
		gross_eur: toNum(form.gross_eur),
		gross_usd: toNum(form.gross_usd),
	};
}

const pillBase = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";


export function ItemEditPanel({
	isOpen,
	onClose,
	item,
	itemIndex,
	onItemChange,
	onSave,
	isSaving,
	creditNoteData,
	onSaveCreditNoteItem,
	linkedStone,
	onCreateStone,
	isCreatingStone,
}: ItemEditPanelProps) {
	const [cnForms, setCnForms] = useState<Map<string, CnFormState>>(new Map());
	const [cnInitial, setCnInitial] = useState<Map<string, CnFormState>>(new Map());
	const [isSavingCn, setIsSavingCn] = useState(false);

	useEffect(() => {
		if (isOpen && creditNoteData.length > 0) {
			const forms = new Map<string, CnFormState>();
			const initial = new Map<string, CnFormState>();
			for (const cn of creditNoteData) {
				const f = initCnForm(cn.item);
				forms.set(cn.invoiceId, f);
				initial.set(cn.invoiceId, { ...f });
			}
			setCnForms(forms);
			setCnInitial(initial);
		} else {
			setCnForms(new Map());
			setCnInitial(new Map());
		}
	}, [isOpen, creditNoteData]);

	const handleCnFieldChange = useCallback((invoiceId: string, field: keyof CnFormState, value: string) => {
		setCnForms((prev) => {
			const next = new Map(prev);
			const current = next.get(invoiceId);
			if (current) {
				next.set(invoiceId, { ...current, [field]: value });
			}
			return next;
		});
	}, []);

	const handleSave = useCallback(async () => {
		onSave();

		const dirtyCns = creditNoteData.filter((cn) => {
			const form = cnForms.get(cn.invoiceId);
			const initial = cnInitial.get(cn.invoiceId);
			return form && initial && JSON.stringify(form) !== JSON.stringify(initial);
		});

		if (dirtyCns.length > 0) {
			setIsSavingCn(true);
			for (const cn of dirtyCns) {
				const form = cnForms.get(cn.invoiceId);
				if (!form) continue;
				const updatedItem = cnFormToItem(form, cn.item);
				const updatedItems = cn.allItems.map((it) =>
					it.item_number === cn.item.item_number ? updatedItem : it
				);
				await onSaveCreditNoteItem(cn.invoiceId, updatedItems);
			}
			setIsSavingCn(false);
		}
	}, [onSave, creditNoteData, cnForms, cnInitial, onSaveCreditNoteItem]);

	const change = useCallback((field: string, value: string) => {
		onItemChange(itemIndex, field, value);
	}, [onItemChange, itemIndex]);

	if (!item) return null;


	return (
		<SlidePanel isOpen={isOpen}
		            onClose={onClose}
		            title={item.name || "Edit Item"}
		            footer={
			            <div className="flex justify-end gap-3">
				            <Button variant="secondary"
				                    size="sm"
				                    onClick={onClose}>
					            Cancel
				            </Button>
				            <Button variant="primary"
				                    size="sm"
				                    loading={isSaving || isSavingCn}
				                    onClick={handleSave}>
					            Save
				            </Button>
			            </div>
		            }>
			<div className="space-y-5">
				<div className="flex items-center gap-2 flex-wrap">
					{item.item_number && (
						<span className={`${pillBase} bg-gray-100 text-gray-700 font-mono`}>
							#{item.item_number}
						</span>
					)}
					{linkedStone ? (
						<Link href={`/stones/${linkedStone.id}`}
						      className={`${pillBase} bg-green-100 text-green-800 hover:bg-green-200 transition-colors`}>
							Linked to stone
						</Link>
					) : (
						<>
							<span className={`${pillBase} bg-amber-100 text-amber-800`}>No stone yet</span>
							<button onClick={onCreateStone}
							        disabled={isCreatingStone}
							        className="text-xs px-2.5 py-1 rounded border border-border-light hover:bg-background-creme/50 transition-colors">
								{isCreatingStone ? "Creating..." : "Create stone"}
							</button>
						</>
					)}
				</div>


				<div>
					<div className="text-xs font-medium uppercase tracking-wider text-text-gray mb-3">Details</div>
					<div className="space-y-3">
						<div className="grid gap-3 grid-cols-[1fr_2fr]">
							<Input label="Item #"
							       size="sm"
							       value={item.item_number}
							       onChange={(e) => change("item_number", e.target.value)} />
							<Input label="Name"
							       size="sm"
							       value={item.name}
							       onChange={(e) => change("name", e.target.value)} />
						</div>
						<TextArea label="Description"
						          size="sm"
						          rows={2}
						          value={item.description}
						          onChange={(e) => change("description", e.target.value)} />
						<div className="grid gap-3 sm:grid-cols-3">
							<Input label="Carat Weight"
							       size="sm"
							       type="number"
							       step="0.01"
							       value={item.carat_weight}
							       onChange={(e) => change("carat_weight", e.target.value)} />
							<Input label="Dimensions"
							       size="sm"
							       value={item.dimensions}
							       onChange={(e) => change("dimensions", e.target.value)} />
							<Input label="Shape"
							       size="sm"
							       value={item.shape}
							       onChange={(e) => change("shape", e.target.value)} />
						</div>
						<div className="grid gap-3 sm:grid-cols-3">
							<Input label="Color"
							       size="sm"
							       value={item.color}
							       onChange={(e) => change("color", e.target.value)} />
							<Input label="Treatment"
							       size="sm"
							       value={item.treatment}
							       onChange={(e) => change("treatment", e.target.value)} />
							<Input label="Origin"
							       size="sm"
							       value={item.origin}
							       onChange={(e) => change("origin", e.target.value)} />
						</div>
						<div className="max-w-[33%]">
							<Input label="Piece Count"
							       size="sm"
							       type="number"
							       value={item.piece_count}
							       onChange={(e) => change("piece_count", e.target.value)} />
						</div>
					</div>
				</div>


				<div>
					<div className="text-xs font-medium uppercase tracking-wider text-text-gray mb-3">Pricing</div>
					<div className="grid gap-6 sm:grid-cols-2">
						<div className="space-y-3">
							<div className="text-xs font-medium uppercase tracking-wider text-text-gray">EUR</div>
							<Input label="Price"
							       size="sm"
							       type="number"
							       step="0.01"
							       value={item.price_eur}
							       onChange={(e) => change("price_eur", e.target.value)} />
							<Input label="Shipment"
							       size="sm"
							       type="number"
							       step="0.01"
							       value={item.shipment_eur}
							       onChange={(e) => change("shipment_eur", e.target.value)} />
							<Input label="VAT"
							       size="sm"
							       type="number"
							       step="0.01"
							       value={item.vat_eur}
							       onChange={(e) => change("vat_eur", e.target.value)} />
							<Input label="Gross"
							       size="sm"
							       type="number"
							       step="0.01"
							       value={item.gross_eur}
							       onChange={(e) => change("gross_eur", e.target.value)} />
						</div>
						<div className="space-y-3">
							<div className="text-xs font-medium uppercase tracking-wider text-text-gray">USD</div>
							<Input label="Price"
							       size="sm"
							       type="number"
							       step="0.01"
							       value={item.price_usd}
							       onChange={(e) => change("price_usd", e.target.value)} />
							<Input label="Shipment"
							       size="sm"
							       type="number"
							       step="0.01"
							       value={item.shipment_usd}
							       onChange={(e) => change("shipment_usd", e.target.value)} />
							<Input label="VAT"
							       size="sm"
							       type="number"
							       step="0.01"
							       value={item.vat_usd}
							       onChange={(e) => change("vat_usd", e.target.value)} />
							<Input label="Gross"
							       size="sm"
							       type="number"
							       step="0.01"
							       value={item.gross_usd}
							       onChange={(e) => change("gross_usd", e.target.value)} />
						</div>
					</div>
				</div>


				{creditNoteData.length > 0 && (
					<div>
						<div className="text-xs font-medium uppercase tracking-wider text-text-gray mb-3">Credit Note Adjustments</div>
						{creditNoteData.map((cn) => {
							const form = cnForms.get(cn.invoiceId);
							if (!form) return null;
							return (
								<div key={cn.invoiceId}
								     className="mb-4 last:mb-0">
									{creditNoteData.length > 1 && (
										<div className="text-xs text-text-gray mb-2">
											{cn.invoiceNumber || cn.invoiceId}
										</div>
									)}
									<div className="grid gap-6 sm:grid-cols-2">
										<div className="space-y-3">
											<div className="text-xs font-medium uppercase tracking-wider text-text-gray">EUR</div>
											<Input label="Price"
											       size="sm"
											       type="number"
											       step="0.01"
											       value={form.price_eur}
											       onChange={(e) => handleCnFieldChange(cn.invoiceId, "price_eur", e.target.value)} />
											<Input label="Shipment"
											       size="sm"
											       type="number"
											       step="0.01"
											       value={form.shipment_eur}
											       onChange={(e) => handleCnFieldChange(cn.invoiceId, "shipment_eur", e.target.value)} />
											<Input label="VAT"
											       size="sm"
											       type="number"
											       step="0.01"
											       value={form.vat_eur}
											       onChange={(e) => handleCnFieldChange(cn.invoiceId, "vat_eur", e.target.value)} />
											<Input label="Gross"
											       size="sm"
											       type="number"
											       step="0.01"
											       value={form.gross_eur}
											       onChange={(e) => handleCnFieldChange(cn.invoiceId, "gross_eur", e.target.value)} />
										</div>
										<div className="space-y-3">
											<div className="text-xs font-medium uppercase tracking-wider text-text-gray">USD</div>
											<Input label="Price"
											       size="sm"
											       type="number"
											       step="0.01"
											       value={form.price_usd}
											       onChange={(e) => handleCnFieldChange(cn.invoiceId, "price_usd", e.target.value)} />
											<Input label="Shipment"
											       size="sm"
											       type="number"
											       step="0.01"
											       value={form.shipment_usd}
											       onChange={(e) => handleCnFieldChange(cn.invoiceId, "shipment_usd", e.target.value)} />
											<Input label="VAT"
											       size="sm"
											       type="number"
											       step="0.01"
											       value={form.vat_usd}
											       onChange={(e) => handleCnFieldChange(cn.invoiceId, "vat_usd", e.target.value)} />
											<Input label="Gross"
											       size="sm"
											       type="number"
											       step="0.01"
											       value={form.gross_usd}
											       onChange={(e) => handleCnFieldChange(cn.invoiceId, "gross_usd", e.target.value)} />
										</div>
									</div>
								</div>
							);
						})}
					</div>
				)}
			</div>
		</SlidePanel>
	);
}
