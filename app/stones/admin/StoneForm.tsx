"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { z } from "zod";
import { Input } from "../../components/Input";
import { TextArea } from "../../components/TextArea";
import { Button } from "../../components/Button";
import { Select } from "../../components/Select";
import { PageHeader } from "../../components/PageHeader";
import type { Stone, Invoice } from "../../api/stones/types";

const stoneFormSchema = z.object({
	name: z.string().min(1, "Name is required").max(255),
	description: z.string().max(5000).optional(),
	stone_type: z.string().max(100).optional(),
	color: z.string().max(100).optional(),
	cut: z.string().max(100).optional(),
	weight_carats: z.string().optional(),
	dimensions: z.string().max(200).optional(),
	country: z.string().max(100).optional(),
	price_usd: z.string().optional(),
	price_eur: z.string().optional(),
	selling_price: z.string().optional(),
	is_sold: z.boolean(),
	notes: z.string().optional(),
	invoice_id: z.string().optional(),
});

type FormData = z.infer<typeof stoneFormSchema>;
type FormErrors = Partial<Record<keyof FormData, string>>;

interface StoneFormProps {
	mode: "create" | "edit";
	initialData?: Stone;
	invoices: Invoice[];
}

const fadeInUp = {
	hidden: { opacity: 0, y: 20 },
	show: { opacity: 1, y: 0 },
};

export function StoneForm({ mode, initialData, invoices }: StoneFormProps) {
	const router = useRouter();
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [errors, setErrors] = useState<FormErrors>({});

	const [isParsing, setIsParsing] = useState(false);
	const [parseError, setParseError] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const [formData, setFormData] = useState<FormData>({
		name: initialData?.name || "",
		description: initialData?.description || "",
		stone_type: initialData?.stone_type || "",
		color: initialData?.color || "",
		cut: initialData?.cut || "",
		weight_carats: initialData?.weight_carats != null ? String(initialData.weight_carats) : "",
		dimensions: initialData?.dimensions || "",
		country: initialData?.country || "",
		price_usd: initialData?.price_usd != null ? String(initialData.price_usd) : "",
		price_eur: initialData?.price_eur != null ? String(initialData.price_eur) : "",
		selling_price: initialData?.selling_price != null ? String(initialData.selling_price) : "",
		is_sold: initialData?.is_sold || false,
		notes: initialData?.notes || "",
		invoice_id: initialData?.stone_invoices?.[0]?.invoice_id || "",
	});

	const handleChange = (field: keyof FormData, value: string | boolean) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
		if (errors[field]) {
			setErrors((prev) => ({ ...prev, [field]: undefined }));
		}
	};

	const handleParseInvoice = async () => {
		const file = fileInputRef.current?.files?.[0];
		if (!file) return;

		if (file.type !== "application/pdf") {
			setParseError("Only PDF files are accepted");
			return;
		}

		setIsParsing(true);
		setParseError(null);

		try {
			const uploadFormData = new FormData();
			uploadFormData.append("file", file);

			const invoiceRes = await fetch("/api/invoices", {
				method: "POST",
				body: uploadFormData,
			});

			if (!invoiceRes.ok) {
				throw new Error("Failed to upload invoice");
			}

			const invoice = await invoiceRes.json();

			const parseFormData = new FormData();
			parseFormData.append("file", file);

			const parseRes = await fetch("/api/stones/parse-invoice", {
				method: "POST",
				body: parseFormData,
			});

			if (!parseRes.ok) {
				const err = await parseRes.json();
				throw new Error(err.error || "Failed to parse invoice");
			}

			const parsed = await parseRes.json();

			const firstStone = parsed.stones?.[0];
			if (firstStone) {
				setFormData((prev) => ({
					...prev,
					name: firstStone.name || prev.name,
					description: firstStone.description || prev.description,
					stone_type: firstStone.stone_type || prev.stone_type,
					color: firstStone.color || prev.color,
					cut: firstStone.cut || prev.cut,
					weight_carats: firstStone.weight_carats != null ? String(firstStone.weight_carats) : prev.weight_carats,
					dimensions: firstStone.dimensions || prev.dimensions,
					country: firstStone.country || prev.country,
					price_usd: firstStone.price_usd != null ? String(firstStone.price_usd) : prev.price_usd,
					invoice_id: invoice.id,
				}));
			}
		} catch (error) {
			setParseError(error instanceof Error ? error.message : "Failed to parse invoice");
		} finally {
			setIsParsing(false);
		}
	};

	const validateForm = (): boolean => {
		const result = stoneFormSchema.safeParse(formData);
		if (!result.success) {
			const fieldErrors: FormErrors = {};
			result.error.errors.forEach((err) => {
				const field = err.path[0] as keyof FormData;
				fieldErrors[field] = err.message;
			});
			setErrors(fieldErrors);
			return false;
		}
		setErrors({});
		return true;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setSubmitError(null);

		if (!validateForm()) return;

		setIsSubmitting(true);

		try {
			const weightCarats = formData.weight_carats ? parseFloat(formData.weight_carats) : null;
			const priceUsd = formData.price_usd ? parseFloat(formData.price_usd) : null;
			const priceEur = formData.price_eur ? parseFloat(formData.price_eur) : null;
			const sellingPrice = formData.selling_price ? parseFloat(formData.selling_price) : null;

			const payload = {
				name: formData.name,
				description: formData.description || null,
				stone_type: formData.stone_type || null,
				color: formData.color || null,
				cut: formData.cut || null,
				weight_carats: weightCarats != null && !isNaN(weightCarats) ? weightCarats : null,
				dimensions: formData.dimensions || null,
				country: formData.country || null,
				price_usd: priceUsd != null && !isNaN(priceUsd) ? priceUsd : null,
				price_eur: priceEur != null && !isNaN(priceEur) ? priceEur : null,
				selling_price: sellingPrice != null && !isNaN(sellingPrice) ? sellingPrice : null,
				is_sold: formData.is_sold,
				notes: formData.notes || null,
				invoice_id: formData.invoice_id || null,
			};

			const url = mode === "create" ? "/api/stones" : `/api/stones/${initialData?.id}`;
			const method = mode === "create" ? "POST" : "PUT";

			const response = await fetch(url, {
				method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || "Failed to save stone");
			}

			router.push(`/stones/${data.id}`);
		} catch (error) {
			setSubmitError(error instanceof Error ? error.message : "Failed to save stone");
		} finally {
			setIsSubmitting(false);
		}
	};

	const invoiceOptions = invoices.map((inv) => ({
		value: inv.id,
		label: [inv.invoice_number, inv.supplier].filter(Boolean).join(" - ") || `Invoice ${inv.id.slice(0, 8)}`,
	}));

	return (
		<div className="min-h-screen relative pt-16">
			<div className="fixed inset-0 z-0 opacity-10 pointer-events-none"
			     style={{
				     backgroundImage: 'url("/NNNoise Texture Generator.svg")',
				     backgroundSize: "400px 400px",
				     backgroundRepeat: "repeat",
			     }} />

			<section className="relative py-12 px-4 sm:px-6 lg:px-8 z-10">
				<div className="max-w-7xl mx-auto">
					<Link href={mode === "edit" && initialData ? `/stones/${initialData.id}` : "/stones"}
					      className="mb-6 inline-flex items-center gap-2 text-sm text-text-gray hover:text-foreground transition-colors">
						<svg className="h-4 w-4"
						     fill="none"
						     viewBox="0 0 24 24"
						     stroke="currentColor">
							<path strokeLinecap="round"
							      strokeLinejoin="round"
							      strokeWidth={2}
							      d="M15 19l-7-7 7-7" />
						</svg>
						{mode === "edit" ? "Back to Stone" : "Back to Stones"}
					</Link>

					<PageHeader title={mode === "create" ? "Add Stone" : "Edit Stone"}
					            subtitle={mode === "create" ? "Add a new stone to your inventory" : "Update stone details"} />

					<motion.form onSubmit={handleSubmit}
					             className="space-y-8"
					             variants={fadeInUp}
					             initial="hidden"
					             animate="show"
					             transition={{ delay: 0.1 }}>
					<div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
						<div className="lg:col-span-3 space-y-8">
						{/* Invoice Parsing Section */}
						{mode === "create" && (
							<div className="border border-border rounded-lg bg-background overflow-hidden">
								<div className="border-b border-border bg-background-creme px-6 py-4">
									<h2 className="font-medium">Invoice Upload</h2>
								</div>
								<div className="p-6 space-y-4">
									<p className="text-sm text-text-gray">
										Upload a PDF invoice to automatically extract stone details.
									</p>
									<div className="flex flex-col sm:flex-row gap-3">
										<input ref={fileInputRef}
										       type="file"
										       accept="application/pdf"
										       className="block w-full text-sm text-text-gray file:mr-4 file:py-2 file:px-4 file:rounded-md file:border file:border-border file:text-sm file:font-medium file:bg-background-creme file:text-foreground hover:file:bg-background file:cursor-pointer file:transition-colors" />
										<Button type="button"
										        variant="secondary"
										        size="sm"
										        loading={isParsing}
										        disabled={isParsing}
										        onClick={handleParseInvoice}
										        className="shrink-0">
											{isParsing ? "Parsing..." : "Parse Invoice"}
										</Button>
									</div>
									{parseError && (
										<p className="text-sm text-red-600">{parseError}</p>
									)}
								</div>
							</div>
						)}

						{/* Stone Details */}
						<div className="border border-border rounded-lg bg-background overflow-hidden">
							<div className="border-b border-border bg-background-creme px-6 py-4">
								<h2 className="font-medium">Stone Details</h2>
							</div>
							<div className="p-6 space-y-5">
								<Input label="Name"
								       id="name"
								       value={formData.name}
								       onChange={(e) => handleChange("name", e.target.value)}
								       placeholder="e.g., Burma Ruby 2.5ct"
								       error={errors.name} />

								<div className="grid gap-5 sm:grid-cols-2">
									<Input label="Stone Type"
									       id="stone_type"
									       value={formData.stone_type || ""}
									       onChange={(e) => handleChange("stone_type", e.target.value)}
									       placeholder="e.g., Ruby, Sapphire, Emerald" />

									<Input label="Color"
									       id="color"
									       value={formData.color || ""}
									       onChange={(e) => handleChange("color", e.target.value)}
									       placeholder="e.g., Pigeon Blood Red" />
								</div>

								<div className="grid gap-5 sm:grid-cols-2">
									<Input label="Cut"
									       id="cut"
									       value={formData.cut || ""}
									       onChange={(e) => handleChange("cut", e.target.value)}
									       placeholder="e.g., Oval Brilliant" />

									<Input label="Weight (ct)"
									       id="weight_carats"
									       type="number"
									       step="0.001"
									       min="0"
									       value={formData.weight_carats || ""}
									       onChange={(e) => handleChange("weight_carats", e.target.value)}
									       placeholder="e.g., 2.500" />
								</div>

								<div className="grid gap-5 sm:grid-cols-2">
									<Input label="Dimensions"
									       id="dimensions"
									       value={formData.dimensions || ""}
									       onChange={(e) => handleChange("dimensions", e.target.value)}
									       placeholder="e.g., 8.5 x 6.5 x 4.0 mm" />

									<Input label="Country of Origin"
									       id="country"
									       value={formData.country || ""}
									       onChange={(e) => handleChange("country", e.target.value)}
									       placeholder="e.g., Myanmar" />
								</div>

								<TextArea label="Description"
								          id="description"
								          value={formData.description || ""}
								          onChange={(e) => handleChange("description", e.target.value)}
								          placeholder="Detailed description of the stone..."
								          rows={4} />
							</div>
						</div>

						{/* Pricing */}
						<div className="border border-border rounded-lg bg-background overflow-hidden">
							<div className="border-b border-border bg-background-creme px-6 py-4">
								<h2 className="font-medium">Pricing</h2>
							</div>
							<div className="p-6 space-y-5">
								<div className="grid gap-5 sm:grid-cols-2">
									<Input label="Price (USD)"
									       id="price_usd"
									       type="number"
									       step="0.01"
									       min="0"
									       value={formData.price_usd || ""}
									       onChange={(e) => handleChange("price_usd", e.target.value)}
									       placeholder="0.00" />

									<Input label="Price (EUR)"
									       id="price_eur"
									       type="number"
									       step="0.01"
									       min="0"
									       value={formData.price_eur || ""}
									       onChange={(e) => handleChange("price_eur", e.target.value)}
									       placeholder="0.00" />
								</div>

								<div className="grid gap-5 sm:grid-cols-2">

									<Input label="Selling Price"
									       id="selling_price"
									       type="number"
									       step="0.01"
									       min="0"
									       value={formData.selling_price || ""}
									       onChange={(e) => handleChange("selling_price", e.target.value)}
									       placeholder="0.00" />
								</div>
							</div>
						</div>
						</div>

						{/* Right Column */}
						<div className="lg:col-span-2 space-y-8 lg:sticky lg:top-24 lg:self-start">
						{/* Invoice Link */}
						<div className="border border-border rounded-lg bg-background overflow-hidden">
							<div className="border-b border-border bg-background-creme px-6 py-4">
								<h2 className="font-medium">Linked Invoice</h2>
							</div>
							<div className="p-6">
								<Select label="Invoice"
								        id="invoice_id"
								        options={[{ value: "", label: "No invoice" }, ...invoiceOptions]}
								        value={formData.invoice_id || ""}
								        onChange={(e) => handleChange("invoice_id", e.target.value)} />
							</div>
						</div>

						{/* Status */}
						<div className="border border-border rounded-lg bg-background overflow-hidden">
							<div className="border-b border-border bg-background-creme px-6 py-4">
								<h2 className="font-medium">Status</h2>
							</div>
							<div className="p-6">
								<label className="flex items-start gap-3 cursor-pointer">
									<input type="checkbox"
									       checked={formData.is_sold}
									       onChange={(e) => handleChange("is_sold", e.target.checked)}
									       className="mt-1 h-4 w-4 rounded border-border text-callout-accent focus:ring-callout-accent" />
									<div>
										<span className="font-medium text-foreground">
											Mark as sold
										</span>
										<p className="text-sm text-text-gray mt-1">
											Sold stones will be hidden from the default listing.
										</p>
									</div>
								</label>
							</div>
						</div>

						{/* Notes */}
						<div className="border border-border rounded-lg bg-background overflow-hidden">
							<div className="border-b border-border bg-background-creme px-6 py-4">
								<h2 className="font-medium">Notes</h2>
							</div>
							<div className="p-6">
								<TextArea id="notes"
								          value={formData.notes || ""}
								          onChange={(e) => handleChange("notes", e.target.value)}
								          placeholder="Internal notes..."
								          rows={4} />
							</div>
						</div>
						</div>
					</div>

						{submitError && (
							<div className="rounded-lg border border-red-200 bg-red-50 p-4"
							     role="alert">
								<p className="text-sm text-red-600">{submitError}</p>
							</div>
						)}

						<div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
							<Link href={mode === "edit" && initialData ? `/stones/${initialData.id}` : "/stones"}>
								<Button type="button"
								        variant="outline"
								        size="md"
								        disabled={isSubmitting}
								        className="w-full sm:w-auto">
									Cancel
								</Button>
							</Link>
							<Button type="submit"
							        variant="primary"
							        size="md"
							        loading={isSubmitting}
							        disabled={isSubmitting}>
								{isSubmitting
									? (mode === "create" ? "Adding..." : "Saving...")
									: (mode === "create" ? "Add Stone" : "Save Changes")}
							</Button>
						</div>
					</motion.form>
				</div>
			</section>
		</div>
	);
}
