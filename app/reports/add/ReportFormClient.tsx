"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { z } from "zod";
import { Input } from "../../components/Input";
import { TextArea } from "../../components/TextArea";
import { Button } from "../../components/Button";
import { Select } from "../../components/Select";
import { PageHeader } from "../../components/PageHeader";
import { ImageUpload, type UploadedImage } from "../../components/ImageUpload";
import type { Report } from "../../api/reports/types";

const reportFormSchema = z.object({
	title: z.string().min(1, "Title is required").max(255, "Title is too long"),
	stone: z.string().min(1, "Stone is required").max(200, "Stone name is too long"),
	description: z.string().max(5000, "Description is too long").optional(),
	note: z.string().max(5000, "Note is too long").optional(),
	first_name: z.string().max(100, "First name is too long").optional(),
	last_name: z.string().max(100, "Last name is too long").optional(),
	owner_email: z.string().email("Invalid email format").optional().or(z.literal("")),
	public: z.boolean(),
	shape_cutting_style: z.string().optional(),
	measurements: z.string().optional(),
	carat_weight: z.string().optional(),
	specific_gravity: z.string().optional(),
	refractive_index: z.string().optional(),
	double_refraction: z.string().optional(),
	polariscope: z.string().optional(),
	pleochroism: z.string().optional(),
	chelsea_color_filter: z.string().optional(),
	fluorescence_sw: z.string().optional(),
	fluorescence_lw: z.string().optional(),
	microscope: z.string().optional(),
	treatment: z.string().optional(),
	origin: z.string().optional(),
	owner_telephone: z.string().optional(),
	currency: z.string().optional(),
	price: z.string().optional(),
});

type FormData = z.infer<typeof reportFormSchema>;
type FormErrors = Partial<Record<keyof FormData, string>>;

interface ReportFormClientProps {
	mode: "create" | "edit";
	initialData?: Report;
}

const fadeInUp = {
	hidden: { opacity: 0, y: 20 },
	show: { opacity: 1, y: 0 },
};

const CURRENCY_OPTIONS = [
	{ value: "USD", label: "USD" },
	{ value: "EUR", label: "EUR" },
	{ value: "UAH", label: "UAH" },
];

export function ReportFormClient({ mode, initialData }: ReportFormClientProps) {
	const router = useRouter();
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [errors, setErrors] = useState<FormErrors>({});

	const [formData, setFormData] = useState<FormData>({
		title: initialData?.title || "",
		stone: initialData?.stone || "",
		description: initialData?.description || "",
		note: initialData?.note || "",
		first_name: initialData?.first_name || "",
		last_name: initialData?.last_name || "",
		owner_email: initialData?.owner_email || "",
		public: initialData?.public || false,
		shape_cutting_style: initialData?.shape_cutting_style || "",
		measurements: initialData?.measurements || "",
		carat_weight: initialData?.carat_weight != null ? String(initialData.carat_weight) : "",
		specific_gravity: initialData?.specific_gravity || "",
		refractive_index: initialData?.refractive_index || "",
		double_refraction: initialData?.double_refraction || "",
		polariscope: initialData?.polariscope || "",
		pleochroism: initialData?.pleochroism || "",
		chelsea_color_filter: initialData?.chelsea_color_filter || "",
		fluorescence_sw: initialData?.fluorescence_sw || "",
		fluorescence_lw: initialData?.fluorescence_lw || "",
		microscope: initialData?.microscope || "",
		treatment: initialData?.treatment || "",
		origin: initialData?.origin || "",
		owner_telephone: initialData?.owner_telephone || "",
		currency: initialData?.currency || "",
		price: initialData?.price != null ? String(initialData.price) : "",
	});

	const [images, setImages] = useState<UploadedImage[]>(() => {
		if (initialData?.report_images) {
			return initialData.report_images.map((img) => ({
				id: img.id,
				url: img.signed_url || img.image_url,
				path: img.image_url,
				name: "Existing image",
				display_order: img.display_order,
				title: img.title || "",
				caption: img.caption || "",
				is_headline: img.is_headline || false,
			}));
		}
		return [];
	});

	const handleChange = (field: keyof FormData, value: string | boolean) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
		if (errors[field]) {
			setErrors((prev) => ({ ...prev, [field]: undefined }));
		}
	};

	const handleHeadlineChange = (imageId: string, isHeadline: boolean) => {
		setImages((prev) =>
			prev.map((img) => ({
				...img,
				is_headline: img.id === imageId ? isHeadline : false,
			}))
		);
	};

	const handleImageFieldChange = (imageId: string, field: "title" | "caption", value: string) => {
		setImages((prev) =>
			prev.map((img) =>
				img.id === imageId ? { ...img, [field]: value } : img
			)
		);
	};

	const validateForm = (): boolean => {
		const result = reportFormSchema.safeParse(formData);
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

		if (!validateForm()) {
			return;
		}

		setIsSubmitting(true);

		try {
			const caratWeight = formData.carat_weight ? parseFloat(formData.carat_weight) : null;
			const priceVal = formData.price ? parseFloat(formData.price) : null;

			const payload = {
				title: formData.title,
				stone: formData.stone,
				description: formData.description || null,
				note: formData.note || null,
				first_name: formData.first_name || null,
				last_name: formData.last_name || null,
				owner_email: formData.owner_email || null,
				public: formData.public,
				shape_cutting_style: formData.shape_cutting_style || null,
				measurements: formData.measurements || null,
				carat_weight: caratWeight != null && !isNaN(caratWeight) ? caratWeight : null,
				specific_gravity: formData.specific_gravity || null,
				refractive_index: formData.refractive_index || null,
				double_refraction: formData.double_refraction || null,
				polariscope: formData.polariscope || null,
				pleochroism: formData.pleochroism || null,
				chelsea_color_filter: formData.chelsea_color_filter || null,
				fluorescence_sw: formData.fluorescence_sw || null,
				fluorescence_lw: formData.fluorescence_lw || null,
				microscope: formData.microscope || null,
				treatment: formData.treatment || null,
				origin: formData.origin || null,
				owner_telephone: formData.owner_telephone || null,
				currency: formData.currency || null,
				price: priceVal != null && !isNaN(priceVal) ? priceVal : null,
				images: images.map((img, index) => ({
					image_url: img.path || img.url,
					display_order: index,
					title: img.title || null,
					caption: img.caption || null,
					is_headline: img.is_headline || false,
				})),
			};

			const url = mode === "create"
				? "/api/reports"
				: `/api/reports/${initialData?.id}`;

			const method = mode === "create" ? "POST" : "PATCH";

			const response = await fetch(url, {
				method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || "Failed to save report");
			}

			router.push(`/reports/${data.id}`);
		} catch (error) {
			setSubmitError(error instanceof Error ? error.message : "Failed to save report");
		} finally {
			setIsSubmitting(false);
		}
	};

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
					{/* Back link */}
					<Link href={mode === "edit" && initialData ? `/reports/${initialData.id}` : "/reports"}
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
						{mode === "edit" ? "Back to Report" : "Back to Reports"}
					</Link>

					<PageHeader title={mode === "create" ? "New Report" : "Edit Report"}
					            subtitle={mode === "create" ? "Create a new gem lab report" : "Update the report details"} />

					<motion.form onSubmit={handleSubmit}
					             className="space-y-8"
					             variants={fadeInUp}
					             initial="hidden"
					             animate="show"
					             transition={{ delay: 0.1 }}>
					<div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
						{/* Left Column */}
						<div className="lg:col-span-3 space-y-8">
						{/* Report Details Section */}
						<div className="border border-border rounded-lg bg-background overflow-hidden">
							<div className="border-b border-border bg-background-creme px-6 py-4">
								<h2 className="font-medium">Report Details</h2>
							</div>
							<div className="p-6 space-y-5">
								<Input label="Report Title"
								       id="title"
								       value={formData.title}
								       onChange={(e) => handleChange("title", e.target.value)}
								       placeholder="e.g., Diamond Authentication Report"
								       error={errors.title} />

								<Input label="Stone"
								       id="stone"
								       value={formData.stone}
								       onChange={(e) => handleChange("stone", e.target.value)}
								       placeholder="e.g., Ruby, Sapphire, Emerald"
								       error={errors.stone} />

								<TextArea label="Description"
								          id="description"
								          value={formData.description || ""}
								          onChange={(e) => handleChange("description", e.target.value)}
								          placeholder="Public description of the report..."
								          error={errors.description}
								          rows={4} />

								<TextArea label="Internal Note"
								          id="note"
								          value={formData.note || ""}
								          onChange={(e) => handleChange("note", e.target.value)}
								          placeholder="Private notes (not visible to public)..."
								          error={errors.note}
								          rows={3} />
							</div>
						</div>

						{/* Gemological Properties Section */}
						<div className="border border-border rounded-lg bg-background overflow-hidden">
							<div className="border-b border-border bg-background-creme px-6 py-4">
								<h2 className="font-medium">Gemological Properties</h2>
							</div>
							<div className="p-6 space-y-5">
								<h3 className="text-sm font-medium text-text-gray">Physical Properties</h3>
								<div className="grid gap-5 sm:grid-cols-2">
									<Input label="Shape / Cutting Style"
									       id="shape_cutting_style"
									       value={formData.shape_cutting_style || ""}
									       onChange={(e) => handleChange("shape_cutting_style", e.target.value)}
									       placeholder="e.g., Round Brilliant" />

									<Input label="Measurements"
									       id="measurements"
									       value={formData.measurements || ""}
									       onChange={(e) => handleChange("measurements", e.target.value)}
									       placeholder="e.g., 6.5 x 6.5 x 4.0 mm" />
								</div>

								<div className="grid gap-5 sm:grid-cols-2">
									<Input label="Carat Weight"
									       id="carat_weight"
									       type="number"
									       step="0.01"
									       min="0"
									       value={formData.carat_weight || ""}
									       onChange={(e) => handleChange("carat_weight", e.target.value)}
									       placeholder="e.g., 1.05" />

									<Input label="Specific Gravity"
									       id="specific_gravity"
									       value={formData.specific_gravity || ""}
									       onChange={(e) => handleChange("specific_gravity", e.target.value)}
									       placeholder="e.g., 3.52" />
								</div>

								<h3 className="text-sm font-medium text-text-gray pt-2">Optical Properties</h3>
								<div className="grid gap-5 sm:grid-cols-2">
									<Input label="Refractive Index"
									       id="refractive_index"
									       value={formData.refractive_index || ""}
									       onChange={(e) => handleChange("refractive_index", e.target.value)}
									       placeholder="e.g., 1.544 - 1.553" />

									<Input label="Double Refraction"
									       id="double_refraction"
									       value={formData.double_refraction || ""}
									       onChange={(e) => handleChange("double_refraction", e.target.value)}
									       placeholder="e.g., 0.009" />
								</div>

								<div className="grid gap-5 sm:grid-cols-2">
									<Input label="Polariscope"
									       id="polariscope"
									       value={formData.polariscope || ""}
									       onChange={(e) => handleChange("polariscope", e.target.value)}
									       placeholder="e.g., Doubly Refractive" />

									<Input label="Pleochroism"
									       id="pleochroism"
									       value={formData.pleochroism || ""}
									       onChange={(e) => handleChange("pleochroism", e.target.value)}
									       placeholder="e.g., Weak to Moderate" />
								</div>

								<Input label="Chelsea Color Filter"
								       id="chelsea_color_filter"
								       value={formData.chelsea_color_filter || ""}
								       onChange={(e) => handleChange("chelsea_color_filter", e.target.value)}
								       placeholder="e.g., No reaction" />

								<TextArea label="Microscope"
								          id="microscope"
								          value={formData.microscope || ""}
								          onChange={(e) => handleChange("microscope", e.target.value)}
								          placeholder="Microscope observations..."
								          rows={3} />

								<h3 className="text-sm font-medium text-text-gray pt-2">Fluorescence</h3>
								<div className="grid gap-5 sm:grid-cols-2">
									<Input label="Fluorescence SW"
									       id="fluorescence_sw"
									       value={formData.fluorescence_sw || ""}
									       onChange={(e) => handleChange("fluorescence_sw", e.target.value)}
									       placeholder="e.g., Inert" />

									<Input label="Fluorescence LW"
									       id="fluorescence_lw"
									       value={formData.fluorescence_lw || ""}
									       onChange={(e) => handleChange("fluorescence_lw", e.target.value)}
									       placeholder="e.g., Strong Blue" />
								</div>

								<h3 className="text-sm font-medium text-text-gray pt-2">Determination</h3>
								<div className="grid gap-5 sm:grid-cols-2">
									<Input label="Treatment"
									       id="treatment"
									       value={formData.treatment || ""}
									       onChange={(e) => handleChange("treatment", e.target.value)}
									       placeholder="e.g., None detected" />

									<Input label="Origin"
									       id="origin"
									       value={formData.origin || ""}
									       onChange={(e) => handleChange("origin", e.target.value)}
									       placeholder="e.g., Sri Lanka" />
								</div>
							</div>
						</div>

						{/* Client Information Section */}
						<div className="border border-border rounded-lg bg-background overflow-hidden">
							<div className="border-b border-border bg-background-creme px-6 py-4">
								<h2 className="text-lg font-medium">Client Information</h2>
							</div>
							<div className="p-6 space-y-5">
								<div className="grid gap-5 sm:grid-cols-2">
									<Input label="First Name"
									       id="first_name"
									       value={formData.first_name}
									       onChange={(e) => handleChange("first_name", e.target.value)}
									       placeholder="John"
									       error={errors.first_name}
									       />

									<Input label="Last Name"
									       id="last_name"
									       value={formData.last_name}
									       onChange={(e) => handleChange("last_name", e.target.value)}
									       placeholder="Doe"
									       error={errors.last_name}
									       />
								</div>

								<Input label="Email"
								       id="owner_email"
								       type="email"
								       value={formData.owner_email}
								       onChange={(e) => handleChange("owner_email", e.target.value)}
								       placeholder="john.doe@example.com"
								       error={errors.owner_email}
								       />
							</div>
						</div>

						{/* Internal (Admin only) Section */}
						<div className="border border-border rounded-lg bg-background overflow-hidden">
							<div className="border-b border-border bg-background-creme px-6 py-4">
								<h2 className="text-lg font-medium">
									Internal
									<span className="ml-2 text-xs text-text-gray">(Admin only)</span>
								</h2>
							</div>
							<div className="p-6 space-y-5">
								<Input label="Telephone"
								       id="owner_telephone"
								       type="tel"
								       value={formData.owner_telephone || ""}
								       onChange={(e) => handleChange("owner_telephone", e.target.value)}
								       placeholder="+380 XX XXX XX XX" />

								<div className="grid gap-5 sm:grid-cols-2">
									<Select label="Currency"
									        id="currency"
									        options={CURRENCY_OPTIONS}
									        placeholder="Select currency"
									        value={formData.currency || ""}
									        onChange={(e) => handleChange("currency", e.target.value)} />

									<Input label="Price"
									       id="price"
									       type="number"
									       step="0.01"
									       min="0"
									       value={formData.price || ""}
									       onChange={(e) => handleChange("price", e.target.value)}
									       placeholder="0.00" />
								</div>
							</div>
						</div>
						</div>

						{/* Right Column */}
						<div className="lg:col-span-2 space-y-8 lg:sticky lg:top-24 lg:self-start">
						{/* Images Section */}
						<div className="border border-border rounded-lg bg-background overflow-hidden">
							<div className="border-b border-border bg-background-creme px-6 py-4">
								<h2 className="text-lg font-medium">Images</h2>
							</div>
							<div className="p-6">
								<ImageUpload images={images}
								             onImagesChange={setImages}
								             onImageFieldChange={handleImageFieldChange}
								             onHeadlineChange={handleHeadlineChange}
								             reportId={initialData?.id}
								             maxImages={10}
								             disabled={isSubmitting} />
							</div>
						</div>

						{/* Visibility Section */}
						<div className="border border-border rounded-lg bg-background overflow-hidden">
							<div className="border-b border-border bg-background-creme px-6 py-4">
								<h2 className="text-lg font-medium">Visibility</h2>
							</div>
							<div className="p-6">
								<label className="flex items-start gap-3 cursor-pointer">
									<input type="checkbox"
									       checked={formData.public}
									       onChange={(e) => handleChange("public", e.target.checked)}
									       className="mt-1 h-4 w-4 rounded border-border text-callout-accent focus:ring-callout-accent" />
									<div>
										<span className="font-medium text-foreground">
											Make this report public
										</span>
										<p className="text-sm text-text-gray mt-1">
											Public reports can be viewed by anyone with the link.
											Private reports are only visible to administrators.
										</p>
									</div>
								</label>
							</div>
						</div>
						</div>
					</div>

						{/* Error Message */}
						{submitError && (
							<div className="rounded-lg border border-red-200 bg-red-50 p-4"
							     role="alert">
								<p className="text-sm text-red-600">{submitError}</p>
							</div>
						)}

						{/* Actions */}
						<div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
							<Link href={mode === "edit" && initialData ? `/reports/${initialData.id}` : "/reports"}>
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
									? (mode === "create" ? "Creating..." : "Saving...")
									: (mode === "create" ? "Create Report" : "Save Changes")}
							</Button>
						</div>
					</motion.form>
				</div>
			</section>
		</div>
	);
}
