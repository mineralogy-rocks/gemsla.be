"use client";

import { Input } from "@/app/components/Input";
import { TextArea } from "@/app/components/TextArea";
import type { StoneFormData } from "./InvoiceForms.types";


interface StoneEditFormProps {
	stone: StoneFormData;
	onChange: (field: string, value: string) => void;
}


export function StoneEditForm({ stone, onChange }: StoneEditFormProps) {
	return (
		<div className="space-y-4">
			<Input label="Name"
			       size="sm"
			       value={stone.name}
			       onChange={(e) => onChange("name", e.target.value)}
			       placeholder="e.g., Burma Ruby 2.5ct"
			       error={stone.errors.name} />

			<div className="grid gap-4 sm:grid-cols-2">
				<Input label="Stone Type"
				       size="sm"
				       value={stone.stone_type}
				       onChange={(e) => onChange("stone_type", e.target.value)}
				       placeholder="e.g., Ruby, Sapphire" />

				<Input label="Color"
				       size="sm"
				       value={stone.color}
				       onChange={(e) => onChange("color", e.target.value)}
				       placeholder="e.g., Pigeon Blood Red" />
			</div>

			<div className="grid gap-4 sm:grid-cols-2">
				<Input label="Cut"
				       size="sm"
				       value={stone.cut}
				       onChange={(e) => onChange("cut", e.target.value)}
				       placeholder="e.g., Oval Brilliant" />

				<Input label="Weight (ct)"
				       size="sm"
				       type="number"
				       step="0.001"
				       min="0"
				       value={stone.weight_carats}
				       onChange={(e) => onChange("weight_carats", e.target.value)}
				       placeholder="e.g., 2.500" />
			</div>

			<div className="grid gap-4 sm:grid-cols-2">
				<Input label="Dimensions"
				       size="sm"
				       value={stone.dimensions}
				       onChange={(e) => onChange("dimensions", e.target.value)}
				       placeholder="e.g., 8.5 x 6.5 x 4.0 mm" />

				<Input label="Country"
				       size="sm"
				       value={stone.country}
				       onChange={(e) => onChange("country", e.target.value)}
				       placeholder="e.g., Myanmar" />
			</div>

			<TextArea label="Description"
			          size="sm"
			          value={stone.description}
			          onChange={(e) => onChange("description", e.target.value)}
			          placeholder="Detailed description..."
			          rows={3} />

			<div className="grid gap-4 sm:grid-cols-2">
				<Input label="Price (EUR)"
				       size="sm"
				       type="number"
				       step="0.01"
				       min="0"
				       value={stone.price_eur}
				       onChange={(e) => onChange("price_eur", e.target.value)}
				       placeholder="0.00" />

				<Input label="Price (USD)"
				       size="sm"
				       type="number"
				       step="0.01"
				       min="0"
				       value={stone.price_usd}
				       onChange={(e) => onChange("price_usd", e.target.value)}
				       placeholder="0.00" />
			</div>

			<div className="grid gap-4 sm:grid-cols-2">
				<Input label="Shipment (EUR)"
				       size="sm"
				       type="number"
				       step="0.01"
				       min="0"
				       value={stone.shipment_eur}
				       onChange={(e) => onChange("shipment_eur", e.target.value)}
				       placeholder="0.00" />

				<Input label="Shipment (USD)"
				       size="sm"
				       type="number"
				       step="0.01"
				       min="0"
				       value={stone.shipment_usd}
				       onChange={(e) => onChange("shipment_usd", e.target.value)}
				       placeholder="0.00" />
			</div>
		</div>
	);
}
