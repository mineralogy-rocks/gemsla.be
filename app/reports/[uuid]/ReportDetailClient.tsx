"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "../../components/Button";
import { PageHeader } from "../../components/PageHeader";
import { DeleteDialog } from "../../components/DeleteDialog";
import { ImageGallery } from "../../components/ImageGallery";
import type { Report } from "../../api/reports/types";

interface ReportDetailClientProps {
	report: Report;
	isAdmin: boolean;
}

const fadeInUp = {
	hidden: { opacity: 0, y: 20 },
	show: { opacity: 1, y: 0 },
};

interface FieldDisplayProps {
	label: string;
	value: string | number | null | undefined;
	suffix?: string;
}

function FieldDisplay({ label, value, suffix }: FieldDisplayProps) {
	if (value == null || value === "") return null;
	return (
		<div>
			<dt className="text-sm font-medium text-text-gray">{label}</dt>
			<dd className="mt-1 text-foreground">
				{value}{suffix && <span className="text-text-gray ml-1">{suffix}</span>}
			</dd>
		</div>
	);
}

export function ReportDetailClient({ report: initialReport, isAdmin }: ReportDetailClientProps) {
	const router = useRouter();
	const [report, setReport] = useState(initialReport);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [copied, setCopied] = useState(false);

	const handleTogglePublic = async () => {
		const previousReport = report;
		setReport({ ...report, public: !report.public });

		try {
			const response = await fetch(`/api/reports/${report.id}/toggle-public`, {
				method: "PATCH",
			});

			if (!response.ok) {
				throw new Error("Failed to toggle public status");
			}

			const updatedReport = await response.json();
			setReport(updatedReport);
		} catch (error) {
			setReport(previousReport);
			console.error("Error toggling public status:", error);
		}
	};

	const handleDelete = async () => {
		setIsDeleting(true);
		try {
			const response = await fetch(`/api/reports/${report.id}`, {
				method: "DELETE",
			});

			if (!response.ok) {
				throw new Error("Failed to delete report");
			}

			router.push("/reports");
		} catch (error) {
			console.error("Error deleting report:", error);
			setIsDeleting(false);
		}
	};

	const galleryImages = (report.report_images || []).map((img) => ({
		id: img.id,
		url: img.signed_url || img.image_url,
		alt: `${report.title} image`,
		title: img.title || undefined,
		caption: img.caption || undefined,
	}));

	const gemologicalFields: FieldDisplayProps[] = [
		{ label: "Shape / Cutting Style", value: report.shape_cutting_style },
		{ label: "Measurements", value: report.measurements },
		{
			label: "Carat Weight",
			value: report.carat_weight,
			suffix: report.carat_weight != null ? `ct (${(report.carat_weight * 0.2).toFixed(4)} g)` : undefined,
		},
		{ label: "Specific Gravity", value: report.specific_gravity, suffix: report.specific_gravity ? "(hydrostatic weight)" : undefined },
		{ label: "Refractive Index", value: report.refractive_index },
		{ label: "Double Refraction", value: report.double_refraction },
		{ label: "Polariscope", value: report.polariscope },
		{ label: "Pleochroism", value: report.pleochroism },
		{ label: "Chelsea Color Filter", value: report.chelsea_color_filter },
		{ label: "Fluorescence SW", value: report.fluorescence_sw },
		{ label: "Fluorescence LW", value: report.fluorescence_lw },
		{ label: "Microscope", value: report.microscope },
		{ label: "Treatment", value: report.treatment },
		{ label: "Origin", value: report.origin },
	];

	const hasGemologicalData = gemologicalFields.some((f) => f.value != null && f.value !== "");

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
					{/* Back link */}
					{isAdmin && (
						<Link href="/reports"
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
							Back to Reports
						</Link>
					)}

					{/* Header */}
					<PageHeader
						title={
							<span className="flex items-center gap-3">
								{report.title}
								<span className={`rounded-full px-3 py-1 text-sm font-medium ${
									report.public
										? "bg-green-100 text-green-800"
										: "bg-gray-100 text-gray-800"
								}`}>
									{report.public ? "Public" : "Private"}
								</span>
							</span>
						}
						subtitle={`Report for ${report.first_name} ${report.last_name}`}
					/>

					{isAdmin && (
						<div className="flex flex-wrap gap-2 justify-end my-6">
							<Button variant="outline"
							        size="sm"
							        onClick={handleTogglePublic}>
								{report.public ? "Make Private" : "Make Public"}
							</Button>
							<Link href={`/reports/${report.id}/edit`}>
								<Button variant="secondary" size="sm">
									Edit
								</Button>
							</Link>
							<Button variant="accent"
							        size="sm"
							        onClick={() => setDeleteDialogOpen(true)}>
								Delete
							</Button>
						</div>
					)}

					<motion.div className="space-y-6"
					            variants={fadeInUp}
					            initial="hidden"
					            animate="show"
					            transition={{ delay: 0.1 }}>
						<div className="border border-border rounded-lg bg-background overflow-hidden">
							<div className="border-b border-border bg-background-creme px-6 py-3">
								<h2 className="text-base font-medium">Report Information</h2>
							</div>
							<div className="px-6 py-4">
								<dl className="grid gap-4 sm:grid-cols-2">
									<div>
										<dt className="text-sm font-medium text-text-gray">Client Name</dt>
										<dd className="mt-1 text-foreground">
											{report.first_name} {report.last_name}
										</dd>
									</div>
									<div>
										<dt className="text-sm font-medium text-text-gray">Email</dt>
										<dd className="mt-1 text-foreground">
											<a href={`mailto:${report.owner_email}`}
											   className="text-callout-accent hover:underline">
												{report.owner_email}
											</a>
										</dd>
									</div>
									<div>
										<dt className="text-sm font-medium text-text-gray">Created</dt>
										<dd className="mt-1 text-foreground">
											{new Date(report.created_at).toLocaleDateString("en-US", {
												year: "numeric",
												month: "long",
												day: "numeric",
											})}
										</dd>
									</div>
									<div>
										<dt className="text-sm font-medium text-text-gray">Last Updated</dt>
										<dd className="mt-1 text-foreground">
											{new Date(report.updated_at).toLocaleDateString("en-US", {
												year: "numeric",
												month: "long",
												day: "numeric",
											})}
										</dd>
									</div>
								</dl>

								{report.description && (
									<div className="mt-4 pt-4 border-t border-border">
										<dt className="text-sm font-medium text-text-gray">Description</dt>
										<dd className="mt-1 text-foreground whitespace-pre-wrap">
											{report.description}
										</dd>
									</div>
								)}

								{report.note && isAdmin && (
									<div className="mt-4 pt-4 border-t border-border">
										<dt className="text-sm font-medium text-text-gray">
											Internal Note
											<span className="ml-2 text-xs text-gray-500">(Admin only)</span>
										</dt>
										<dd className="mt-1 text-foreground whitespace-pre-wrap bg-background-creme p-3 rounded-md">
											{report.note}
										</dd>
									</div>
								)}
							</div>
						</div>

						{/* Gemological Properties Card */}
						{hasGemologicalData && (
							<div className="border border-border rounded-lg bg-background overflow-hidden">
								<div className="border-b border-border bg-background-creme px-6 py-3">
									<h2 className="text-base font-medium">Gemological Properties</h2>
								</div>
								<div className="px-6 py-4">
									<dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
										{gemologicalFields.map((field) => {
											if (field.value == null || field.value === "") return null;
											if (field.label === "Carat Weight") {
												return (
													<div key={field.label}>
														<dt className="text-sm font-medium text-text-gray">{field.label}</dt>
														<dd className="mt-1 text-foreground">
															{field.value} {field.suffix}
														</dd>
													</div>
												);
											}
											return (
												<FieldDisplay key={field.label}
												              label={field.label}
												              value={field.value}
												              suffix={field.suffix} />
											);
										})}
									</dl>
								</div>
							</div>
						)}

						{isAdmin && (report.owner_telephone || report.price != null) && (
							<div className="border border-border rounded-lg bg-background overflow-hidden">
								<div className="border-b border-border bg-background-creme px-6 py-3">
									<h2 className="text-base font-medium">
										Internal
										<span className="ml-2 text-xs text-text-gray">(Admin only)</span>
									</h2>
								</div>
								<div className="px-6 py-4">
									<dl className="grid gap-4 sm:grid-cols-2">
										{report.owner_telephone && (
											<div>
												<dt className="text-sm font-medium text-text-gray">Telephone</dt>
												<dd className="mt-1 text-foreground">
													<a href={`tel:${report.owner_telephone}`}
													   className="text-callout-accent hover:underline">
														{report.owner_telephone}
													</a>
												</dd>
											</div>
										)}
										{report.price != null && (
											<div>
												<dt className="text-sm font-medium text-text-gray">Price</dt>
												<dd className="mt-1 text-foreground">
													{report.price} {report.currency || ""}
												</dd>
											</div>
										)}
									</dl>
								</div>
							</div>
						)}

						<div className="border border-border rounded-lg bg-background overflow-hidden">
							<div className="border-b border-border bg-background-creme px-6 py-3">
								<h2 className="text-base font-medium">
									Images ({galleryImages.length})
								</h2>
							</div>
							<div className="p-6">
								<ImageGallery images={galleryImages} columns={3} />
							</div>
						</div>

						{report.public && (
							<div className="border border-border rounded-lg bg-background overflow-hidden">
								<div className="border-b border-border bg-background-creme px-6 py-3">
									<h2 className="text-base font-medium">Share This Report</h2>
								</div>
								<div className="p-6">
									<p className="text-sm text-text-gray mb-3">
										This report is publicly accessible. Share the link below:
									</p>
									<div className="flex gap-2">
										<input type="text"
										       value={typeof window !== "undefined" ? `${window.location.origin}/reports/${report.id}` : ""}
										       readOnly
										       className="flex-1 rounded-md border border-border bg-background-creme px-3 py-2 text-sm text-foreground" />
										<Button variant="secondary"
										        size="sm"
										        onClick={async () => {
											        const shareUrl = `${window.location.origin}/reports/${report.id}`;
											        try {
												        if (navigator.clipboard) {
													        await navigator.clipboard.writeText(shareUrl);
												        } else {
													        const textarea = document.createElement("textarea");
													        textarea.value = shareUrl;
													        textarea.style.position = "fixed";
													        textarea.style.opacity = "0";
													        document.body.appendChild(textarea);
													        textarea.select();
													        document.execCommand("copy");
													        document.body.removeChild(textarea);
												        }
												        setCopied(true);
												        setTimeout(() => setCopied(false), 2000);
											        } catch {}
										        }}>
											{copied ? "Copied!" : "Copy"}
										</Button>
									</div>
								</div>
							</div>
						)}
					</motion.div>
				</div>
			</section>

			<DeleteDialog isOpen={deleteDialogOpen}
			              onClose={() => setDeleteDialogOpen(false)}
			              onConfirm={handleDelete}
			              title="Delete Report"
			              message={`Are you sure you want to delete "${report.title}"? This action cannot be undone. All associated images will also be deleted.`}
			              isPending={isDeleting} />
		</div>
	);
}
