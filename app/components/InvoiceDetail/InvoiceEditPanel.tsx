"use client";

import { SlidePanel } from "@/app/components/SlidePanel";
import { Button } from "@/app/components/Button";
import { Input } from "@/app/components/Input";
import { TextArea } from "@/app/components/TextArea";
import { money } from "@/app/invoices/lib/format";
import type { FieldIssue } from "@/app/components/Input";
import type { InvoiceDetail } from "@/app/api/stones/types";


interface FormState {
	invoice_number: string;
	original_invoice_number: string;
	type: string;
	order_number: string;
	supplier: string;
	customer_name: string;
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
	refundInvoices?: InvoiceDetail["refund_invoices"];
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
	refundInvoices,
}: InvoiceEditPanelProps) {
	const hasRefunds = (refundInvoices?.length ?? 0) > 0;

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
							{form.type === "issued" ? (
								<Input label="Customer"
								       size="sm"
								       value={form.customer_name}
								       issues={issuesFor("customer_name")}
								       onChange={(e) => onFieldChange("customer_name", e.target.value)} />
							) : (
								<Input label="Supplier"
								       size="sm"
								       value={form.supplier}
								       issues={issuesFor("supplier")}
								       onChange={(e) => onFieldChange("supplier", e.target.value)} />
							)}
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


				{hasRefunds && (
					<div>
						<div className="text-xs font-medium uppercase tracking-wider text-text-gray mb-3">Credit note adjustments</div>
						<div className="space-y-3">
							{refundInvoices!.map((cn) => {
								const totalRefundEur = Math.abs(cn.gross_eur ?? 0);
								const totalRefundUsd = Math.abs(cn.gross_usd ?? 0);

								return (
									<div key={cn.id}
									     className="rounded-lg border border-border-light p-3">
										<div className="flex items-center justify-between mb-2">
											<span className="text-xs font-medium">
												{cn.invoice_number || cn.original_invoice_number || "Credit note"}
											</span>
											{cn.invoice_date && (
												<span className="text-xs text-text-gray">{cn.invoice_date}</span>
											)}
										</div>
										<table className="w-full text-xs">
											<thead>
												<tr className="text-text-gray/60">
													<th className="text-left font-normal pb-1"></th>
													<th className="text-right font-normal pb-1">EUR</th>
													<th className="text-right font-normal pb-1">USD</th>
												</tr>
											</thead>
											<tbody className="text-red-600">
												<tr>
													<td className="py-0.5 text-text-gray">Price</td>
													<td className="py-0.5 text-right tabular-nums">{money(cn.price_eur, "eur")}</td>
													<td className="py-0.5 text-right tabular-nums">{money(cn.price_usd, "usd")}</td>
												</tr>
												<tr>
													<td className="py-0.5 text-text-gray">Shipment</td>
													<td className="py-0.5 text-right tabular-nums">{money(cn.shipment_eur, "eur")}</td>
													<td className="py-0.5 text-right tabular-nums">{money(cn.shipment_usd, "usd")}</td>
												</tr>
												<tr>
													<td className="py-0.5 text-text-gray">VAT</td>
													<td className="py-0.5 text-right tabular-nums">{money(cn.vat_eur, "eur")}</td>
													<td className="py-0.5 text-right tabular-nums">{money(cn.vat_usd, "usd")}</td>
												</tr>
												<tr className="border-t border-border-light font-medium">
													<td className="pt-1 text-text-gray">Gross</td>
													<td className="pt-1 text-right tabular-nums">{money(cn.gross_eur, "eur")}</td>
													<td className="pt-1 text-right tabular-nums">{money(cn.gross_usd, "usd")}</td>
												</tr>
											</tbody>
										</table>
										{(totalRefundEur > 0 || totalRefundUsd > 0) && (
											<div className="mt-2 pt-2 border-t border-border-light text-xs text-text-gray/60">
												Refund: {totalRefundEur > 0 && <>{money(totalRefundEur, "eur")}</>}
												{totalRefundEur > 0 && totalRefundUsd > 0 && " / "}
												{totalRefundUsd > 0 && <>{money(totalRefundUsd, "usd")}</>}
											</div>
										)}
									</div>
								);
							})}
						</div>
					</div>
				)}


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
