"use client";

import { Input } from "@/app/components/Input";
import type { InvoiceFormData } from "./InvoiceForms.types";


interface InvoiceFormProps {
	invoice: InvoiceFormData;
	onChange: (field: keyof InvoiceFormData, value: string) => void;
}


export function InvoiceForm({ invoice, onChange }: InvoiceFormProps) {
	return (
		<div className="space-y-4">
			<div className="grid gap-4 sm:grid-cols-2">
				<Input label="Invoice Number"
				       size="sm"
				       value={invoice.invoice_number}
				       onChange={(e) => onChange("invoice_number", e.target.value)}
				       placeholder="e.g., CN-1261/2026" />

				<Input label="Original Invoice Number"
				       size="sm"
				       value={invoice.original_invoice_number}
				       onChange={(e) => onChange("original_invoice_number", e.target.value)}
				       placeholder="e.g., 1261/2026" />
			</div>

			<div className="grid gap-4 sm:grid-cols-2">
				<Input label="Supplier"
				       size="sm"
				       value={invoice.supplier}
				       onChange={(e) => onChange("supplier", e.target.value)}
				       placeholder="e.g., LD GEMS BV" />
			</div>

			<div className="grid gap-4 sm:grid-cols-2">
				<Input label="Invoice Date"
				       size="sm"
				       type="date"
				       value={invoice.invoice_date}
				       onChange={(e) => onChange("invoice_date", e.target.value)} />

				<Input label="Order Number"
				       size="sm"
				       value={invoice.order_number}
				       onChange={(e) => onChange("order_number", e.target.value)}
				       placeholder="e.g., ORD-12345" />
			</div>

			<div className="grid gap-4 sm:grid-cols-2">
				<Input label="Price (EUR)"
				       size="sm"
				       type="number"
				       step="0.01"
				       value={invoice.price_eur}
				       onChange={(e) => onChange("price_eur", e.target.value)}
				       placeholder="0.00" />

				<Input label="Price (USD)"
				       size="sm"
				       type="number"
				       step="0.01"
				       value={invoice.price_usd}
				       onChange={(e) => onChange("price_usd", e.target.value)}
				       placeholder="0.00" />
			</div>

			<div className="grid gap-4 sm:grid-cols-2">
				<Input label="Shipment (EUR)"
				       size="sm"
				       type="number"
				       step="0.01"
				       value={invoice.shipment_eur}
				       onChange={(e) => onChange("shipment_eur", e.target.value)}
				       placeholder="0.00" />

				<Input label="Shipment (USD)"
				       size="sm"
				       type="number"
				       step="0.01"
				       value={invoice.shipment_usd}
				       onChange={(e) => onChange("shipment_usd", e.target.value)}
				       placeholder="0.00" />
			</div>

			<div className="grid gap-4 sm:grid-cols-3">
				<Input label="VAT Rate (%)"
				       size="sm"
				       type="number"
				       step="0.01"
				       min="0"
				       value={invoice.vat_rate}
				       onChange={(e) => onChange("vat_rate", e.target.value)}
				       placeholder="0" />

				<Input label="VAT (EUR)"
				       size="sm"
				       type="number"
				       step="0.01"
				       value={invoice.vat_eur}
				       onChange={(e) => onChange("vat_eur", e.target.value)}
				       placeholder="0.00" />

				<Input label="VAT (USD)"
				       size="sm"
				       type="number"
				       step="0.01"
				       value={invoice.vat_usd}
				       onChange={(e) => onChange("vat_usd", e.target.value)}
				       placeholder="0.00" />
			</div>
		</div>
	);
}
