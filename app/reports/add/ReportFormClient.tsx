"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { z } from "zod";
import { Input } from "../../components/Input";
import { TextArea } from "../../components/TextArea";
import { Button } from "../../components/Button";
import { ImageUpload, type UploadedImage } from "../../components/ImageUpload";
import type { Report } from "../../api/reports/types";

// Client-side validation schema
const reportFormSchema = z.object({
	title: z.string().min(1, "Title is required").max(255, "Title is too long"),
	description: z.string().max(5000, "Description is too long").optional(),
	note: z.string().max(5000, "Note is too long").optional(),
	first_name: z.string().min(1, "First name is required").max(100, "First name is too long"),
	last_name: z.string().min(1, "Last name is required").max(100, "Last name is too long"),
	owner_email: z.string().email("Invalid email format"),
	public: z.boolean(),
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

export function ReportFormClient({ mode, initialData }: ReportFormClientProps) {
	const router = useRouter();
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [errors, setErrors] = useState<FormErrors>({});

	const [formData, setFormData] = useState<FormData>({
		title: initialData?.title || "",
		description: initialData?.description || "",
		note: initialData?.note || "",
		first_name: initialData?.first_name || "",
		last_name: initialData?.last_name || "",
		owner_email: initialData?.owner_email || "",
		public: initialData?.public || false,
	});

	const [images, setImages] = useState<UploadedImage[]>(() => {
		if (initialData?.report_images) {
			return initialData.report_images.map((img) => ({
				id: img.id,
				url: img.image_url,
				name: "Existing image",
				display_order: img.display_order,
			}));
		}
		return [];
	});

	const handleChange = (field: keyof FormData, value: string | boolean) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
		// Clear error when user starts typing
		if (errors[field]) {
			setErrors((prev) => ({ ...prev, [field]: undefined }));
		}
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
			const payload = {
				...formData,
				description: formData.description || null,
				note: formData.note || null,
				images: images.map((img, index) => ({
					image_url: img.url,
					display_order: index,
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
				<div className="max-w-2xl mx-auto">
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

					{/* Header */}
					<motion.div className="mb-8"
					            variants={fadeInUp}
					            initial="hidden"
					            animate="show">
						<h1 className="mb-2">
							{mode === "create" ? "New Report" : "Edit Report"}
						</h1>
						<p className="text-text-gray">
							{mode === "create"
								? "Create a new gem lab report"
								: "Update the report details"}
						</p>
					</motion.div>

					{/* Form */}
					<motion.form onSubmit={handleSubmit}
					             className="space-y-8"
					             variants={fadeInUp}
					             initial="hidden"
					             animate="show"
					             transition={{ delay: 0.1 }}>
						{/* Report Details Section */}
						<div className="border border-border rounded-lg bg-background overflow-hidden">
							<div className="border-b border-border bg-background-creme px-6 py-4">
								<h2 className="text-lg font-medium">Report Details</h2>
							</div>
							<div className="p-6 space-y-5">
								<Input label="Report Title"
								       id="title"
								       value={formData.title}
								       onChange={(e) => handleChange("title", e.target.value)}
								       placeholder="e.g., Diamond Authentication Report"
								       error={errors.title}
								       required />

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
									       required />

									<Input label="Last Name"
									       id="last_name"
									       value={formData.last_name}
									       onChange={(e) => handleChange("last_name", e.target.value)}
									       placeholder="Doe"
									       error={errors.last_name}
									       required />
								</div>

								<Input label="Email"
								       id="owner_email"
								       type="email"
								       value={formData.owner_email}
								       onChange={(e) => handleChange("owner_email", e.target.value)}
								       placeholder="john.doe@example.com"
								       error={errors.owner_email}
								       required />
							</div>
						</div>

						{/* Images Section */}
						<div className="border border-border rounded-lg bg-background overflow-hidden">
							<div className="border-b border-border bg-background-creme px-6 py-4">
								<h2 className="text-lg font-medium">Images</h2>
							</div>
							<div className="p-6">
								<ImageUpload images={images}
								             onImagesChange={setImages}
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
