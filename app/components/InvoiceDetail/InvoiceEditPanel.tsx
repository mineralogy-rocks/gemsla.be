"use client";

import { SlidePanel } from "@/app/components/SlidePanel";
import { Button } from "@/app/components/Button";
import { Input } from "@/app/components/Input";
import { TextArea } from "@/app/components/TextArea";
import type { FieldIssue } from "@/app/components/Input";


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


interface InvoiceEditPanelProps {
	isOpen: boolean;
	onClose: () => void;
	form: FormState;
	onFieldChange: (field: keyof FormState, value: string) => void;
	onSave: () => void;
	onCancel: () => void;
	isSaving: boolean;
	isDirty: boolean;
	canSave: boolean;
	issuesFor: (field: string) => FieldIssue[] | undefined;
}


export function InvoiceEditPanel({
	isOpen,
	onClose,
	form,
	onFieldChange,
	onSave,
	onCancel,
	isSaving,
	isDirty,
	canSave,
	issuesFor,
}: InvoiceEditPanelProps) {
	return (
		<SlidePanel isOpen={isOpen}
		            onClose={onCancel}
		            title="Edit Invoice"
		            footer={
			            <div className="flex justify-end gap-3">
				            <Button variant="secondary"
				                    size="sm"
				                    onClick={onCancel}>
					            Cancel
				            </Button>
				            <Button variant="primary"
				                    size="sm"
				                    loading={isSaving}
				                    onClick={onSave}
				                    disabled={!isDirty || !canSave}>
					            Save
				            </Button>
			            </div>
		            }>
			<div className="space-y-5">
				<div>
					<div className="text-xs font-medium uppercase tracking-wider text-text-gray mb-3">Details</div>
					<div className="space-y-3">
						<div className="grid gap-3 sm:grid-cols-2">
							<Input label="Invoice Number"
							       size="sm"
							       value={form.invoice_number}
							       issues={issuesFor("invoice_number")}
							       onChange={(e) => onFieldChange("invoice_number", e.target.value)} />
							<Input label="Original Invoice Number"
							       size="sm"
							       value={form.original_invoice_number}
							       issues={issuesFor("original_invoice_number")}
							       onChange={(e) => onFieldChange("original_invoice_number", e.target.value)} />
						</div>
						<div className="grid gap-3 sm:grid-cols-3">
							<Input label="Invoice Date"
							       size="sm"
							       type="date"
							       value={form.invoice_date}
							       issues={issuesFor("invoice_date")}
							       onChange={(e) => onFieldChange("invoice_date", e.target.value)} />
							<Input label="Supplier"
							       size="sm"
							       value={form.supplier}
							       issues={issuesFor("supplier")}
							       onChange={(e) => onFieldChange("supplier", e.target.value)} />
							<div>
								<label className="block text-xs font-medium text-text-gray mb-1">Type</label>
								<select value={form.type}
								        onChange={(e) => onFieldChange("type", e.target.value)}
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
						       onChange={(e) => onFieldChange("order_number", e.target.value)} />
					</div>
				</div>


				<div>
					<div className="text-xs font-medium uppercase tracking-wider text-text-gray mb-3">Pricing</div>
					<div className="max-w-xs mb-4">
						<Input label="VAT Rate (%)"
						       size="sm"
						       type="number"
						       step="0.01"
						       value={form.vat_rate}
						       issues={issuesFor("vat_rate")}
						       onChange={(e) => onFieldChange("vat_rate", e.target.value)} />
					</div>
					<div className="grid gap-6 sm:grid-cols-2">
						<div className="space-y-3">
							<div className="text-xs font-medium uppercase tracking-wider text-text-gray">EUR</div>
							<Input label="Price"
							       size="sm"
							       type="number"
							       step="0.01"
							       value={form.price_eur}
							       issues={issuesFor("price_eur")}
							       onChange={(e) => onFieldChange("price_eur", e.target.value)} />
							<Input label="Shipment"
							       size="sm"
							       type="number"
							       step="0.01"
							       value={form.shipment_eur}
							       issues={issuesFor("shipment_eur")}
							       onChange={(e) => onFieldChange("shipment_eur", e.target.value)} />
							<Input label="VAT"
							       size="sm"
							       type="number"
							       step="0.01"
							       value={form.vat_eur}
							       issues={issuesFor("vat_eur")}
							       onChange={(e) => onFieldChange("vat_eur", e.target.value)} />
							<Input label="Gross"
							       size="sm"
							       type="number"
							       step="0.01"
							       value={form.gross_eur}
							       issues={issuesFor("gross_eur")}
							       onChange={(e) => onFieldChange("gross_eur", e.target.value)} />
						</div>
						<div className="space-y-3">
							<div className="text-xs font-medium uppercase tracking-wider text-text-gray">USD</div>
							<Input label="Price"
							       size="sm"
							       type="number"
							       step="0.01"
							       value={form.price_usd}
							       issues={issuesFor("price_usd")}
							       onChange={(e) => onFieldChange("price_usd", e.target.value)} />
							<Input label="Shipment"
							       size="sm"
							       type="number"
							       step="0.01"
							       value={form.shipment_usd}
							       issues={issuesFor("shipment_usd")}
							       onChange={(e) => onFieldChange("shipment_usd", e.target.value)} />
							<Input label="VAT"
							       size="sm"
							       type="number"
							       step="0.01"
							       value={form.vat_usd}
							       issues={issuesFor("vat_usd")}
							       onChange={(e) => onFieldChange("vat_usd", e.target.value)} />
							<Input label="Gross"
							       size="sm"
							       type="number"
							       step="0.01"
							       value={form.gross_usd}
							       issues={issuesFor("gross_usd")}
							       onChange={(e) => onFieldChange("gross_usd", e.target.value)} />
						</div>
					</div>
				</div>


				<div>
					<TextArea label="Notes"
					          size="sm"
					          rows={3}
					          value={form.notes}
					          issues={issuesFor("notes")}
					          onChange={(e) => onFieldChange("notes", e.target.value)} />
				</div>
			</div>
		</SlidePanel>
	);
}
