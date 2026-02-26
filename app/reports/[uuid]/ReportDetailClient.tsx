"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";

import { Button } from "../../components/Button";
import { DeleteDialog } from "../../components/DeleteDialog";
import { ImageGallery } from "../../components/ImageGallery";
import { PageHeader } from "../../components/PageHeader";
import type { Report } from "../../api/reports/types";

const QRCode = dynamic(() => import("../../components/QRCode/QRCode"), { ssr: false });

interface ReportDetailClientProps {
	report: Report;
	isAdmin: boolean;
}

interface FieldDisplayProps {
	label: string;
	value: string | number | null | undefined;
	suffix?: string;
}

function FieldDisplay({ label, value, suffix }: FieldDisplayProps) {
	if (value == null || value === "") return null;
	return (
		<div className="py-2">
			<dt className="text-xs font-medium uppercase tracking-wider text-text-gray">{label}</dt>
			<dd className="mt-1 text-sm text-foreground">
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

	const downloadQR = () => {
		const svg = document.querySelector<SVGSVGElement>("#report-qr-svg svg");
		if (!svg) return;
		const serializer = new XMLSerializer();
		const svgStr = serializer.serializeToString(svg);
		const canvas = document.createElement("canvas");
		const size = 320;
		canvas.width = size;
		canvas.height = size;
		const ctx = canvas.getContext("2d");
		const img = new Image();
		img.onload = () => {
			ctx!.fillStyle = "#ffffff";
			ctx!.fillRect(0, 0, size, size);
			ctx!.drawImage(img, 0, 0, size, size);
			const a = document.createElement("a");
			a.download = `${report.title.toLowerCase().replace(/\s+/g, "-")}-qr.png`;
			a.href = canvas.toDataURL("image/png");
			a.click();
		};
		img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgStr)))}`;
	};

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

	const gemologicalGroups = [
		{
			label: "Physical Properties",
			fields: [
				{ label: "Shape / Cutting Style", value: report.shape_cutting_style },
				{ label: "Measurements", value: report.measurements },
				{
					label: "Carat Weight",
					value: report.carat_weight,
					suffix: report.carat_weight != null ? `ct (${(report.carat_weight * 0.2).toFixed(4)} g)` : undefined,
				},
				{ label: "Specific Gravity", value: report.specific_gravity, suffix: report.specific_gravity ? "(hydrostatic weight)" : undefined },
			],
		},
		{
			label: "Optical Properties",
			fields: [
				{ label: "Refractive Index", value: report.refractive_index },
				{ label: "Double Refraction", value: report.double_refraction },
				{ label: "Polariscope", value: report.polariscope },
				{ label: "Pleochroism", value: report.pleochroism },
				{ label: "Chelsea Color Filter", value: report.chelsea_color_filter },
				{ label: "Microscope", value: report.microscope },
			],
		},
		{
			label: "Fluorescence",
			fields: [
				{ label: "Fluorescence SW", value: report.fluorescence_sw },
				{ label: "Fluorescence LW", value: report.fluorescence_lw },
			],
		},
		{
			label: "Determination",
			fields: [
				{ label: "Treatment", value: report.treatment },
				{ label: "Origin", value: report.origin },
			],
		},
	];

	const hasGemologicalData = gemologicalGroups.some((g) =>
		g.fields.some((f) => f.value != null && f.value !== "")
	);


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

					<PageHeader title={<>
					            {report.title}
					            <span className={`ml-3 align-middle rounded-full px-2.5 py-0.5 text-xs font-medium ${
						            report.public
							            ? "bg-green-100 text-green-800 border"
							            : "bg-gray-100 text-gray-800 border"
					            }`}>
						            {report.public ? "Public" : "Private"}
					            </span>
				            </>}
				            />
					<p className="text-2xl font-semibold text-callout-accent tracking-wide -mt-4 mb-6">
						{report.stone}
					</p>

					{(isAdmin || report.public) && (
						<div className="flex flex-wrap items-center gap-2 -mt-4 mb-8">
							{isAdmin && (
								<Button variant="ghost"
								        size="sm"
								        onClick={async () => {
									        try {
										        if (navigator.clipboard) {
											        await navigator.clipboard.writeText(window.location.href);
										        } else {
											        const textarea = document.createElement("textarea");
											        textarea.value = window.location.href;
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
									<svg className="h-4 w-4 mr-1.5"
									     fill="none"
									     viewBox="0 0 24 24"
									     stroke="currentColor">
										<path strokeLinecap="round"
										      strokeLinejoin="round"
										      strokeWidth={1.5}
										      d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
									</svg>
									{copied ? "Copied!" : "Share Link"}
								</Button>
							)}
							{report.public && (
								<Button variant="ghost"
								        size="sm"
								        onClick={downloadQR}>
									Download QR
								</Button>
							)}
							{isAdmin && (
								<div className="ml-auto flex flex-wrap items-center gap-2">
									<Button variant="outline"
									        size="sm"
									        onClick={handleTogglePublic}>
										{report.public ? "Make Private" : "Make Public"}
									</Button>
									<Link href={`/reports/${report.id}/edit`}>
										<Button variant="secondary" size="sm">Edit</Button>
									</Link>
									<Button variant="accent"
									        size="sm"
									        onClick={() => setDeleteDialogOpen(true)}>
										Delete
									</Button>
								</div>
							)}
						</div>
					)}


					<motion.div initial={{ opacity: 0 }}
					            animate={{ opacity: 1 }}
					            transition={{ duration: 0.4, delay: 0.1 }}
					            className="space-y-8">
						<div className="border border-border rounded-lg bg-background overflow-hidden">
							<div className="border-b border-border bg-background-creme px-6 py-4">
								<h2 className="font-medium">Report Information</h2>
							</div>
							<div className="p-6">
								{(() => {
									const headlineImage = (report.report_images || []).find((img) => img.is_headline);
									return headlineImage?.signed_url ? (
										<div className="flex flex-col sm:flex-row gap-6">
											<div className="flex-1">
												<dl className="grid gap-y-3">
													<div className="py-2">
														<dt className="text-xs font-medium uppercase tracking-wider text-text-gray">Stone Identification</dt>
														<dd className="mt-1 text-sm text-foreground">{report.stone}</dd>
													</div>
													{(report.first_name || report.last_name) && (
														<div className="py-2">
															<dt className="text-xs font-medium uppercase tracking-wider text-text-gray">Client</dt>
															<dd className="mt-1 text-sm text-foreground">{[report.first_name, report.last_name].filter(Boolean).join(" ")}</dd>
														</div>
													)}
													{report.owner_email && (
														<div className="py-2">
															<dt className="text-xs font-medium uppercase tracking-wider text-text-gray">Email</dt>
															<dd className="mt-1 text-sm text-foreground">
																<a href={`mailto:${report.owner_email}`}
																   className="text-callout-accent hover:underline">
																	{report.owner_email}
																</a>
															</dd>
														</div>
													)}
													{report.description && (
														<div className="py-2">
															<dt className="text-xs font-medium uppercase tracking-wider text-text-gray">Description</dt>
															<dd className="mt-1 text-sm text-foreground whitespace-pre-wrap">{report.description}</dd>
														</div>
													)}
													{report.note && isAdmin && (
														<div className="py-2 pl-3 border-l-2 border-page-header-accent">
															<dt className="text-xs font-medium uppercase tracking-wider text-text-gray">Internal Note</dt>
															<dd className="mt-1 text-sm text-foreground whitespace-pre-wrap">{report.note}</dd>
														</div>
													)}
													<div className="grid sm:grid-cols-2 gap-x-12">
														<div className="py-2">
															<dt className="text-xs font-medium uppercase tracking-wider text-text-gray">Created</dt>
															<dd className="mt-1 text-sm text-foreground">
																{new Date(report.created_at).toLocaleDateString("en-US", {
																	year: "numeric",
																	month: "long",
																	day: "numeric",
																})}
															</dd>
														</div>
														<div className="py-2">
															<dt className="text-xs font-medium uppercase tracking-wider text-text-gray">Updated</dt>
															<dd className="mt-1 text-sm text-foreground">
																{new Date(report.updated_at).toLocaleDateString("en-US", {
																	year: "numeric",
																	month: "long",
																	day: "numeric",
																})}
															</dd>
														</div>
													</div>
												</dl>
											</div>
											<div className="sm:w-48 md:w-56 shrink-0">
												<img src={headlineImage.signed_url}
												     alt={`${report.title} headline`}
												     className="w-full rounded-lg object-contain" />
												<p className="mt-1 text-xs text-text-gray text-center">(colors may be distorted)</p>
											</div>
										</div>
									) : null;
								})()}
								<dl className={`grid gap-y-3 ${(report.report_images || []).some((img) => img.is_headline && img.signed_url) ? "hidden" : ""}`}>
									<div className="py-2">
										<dt className="text-xs font-medium uppercase tracking-wider text-text-gray">Stone</dt>
										<dd className="mt-1 text-sm text-foreground">{report.stone}</dd>
									</div>
									{(report.first_name || report.last_name) && (
										<div className="py-2">
											<dt className="text-xs font-medium uppercase tracking-wider text-text-gray">Client</dt>
											<dd className="mt-1 text-sm text-foreground">{[report.first_name, report.last_name].filter(Boolean).join(" ")}</dd>
										</div>
									)}
									{report.owner_email && (
										<div className="py-2">
											<dt className="text-xs font-medium uppercase tracking-wider text-text-gray">Email</dt>
											<dd className="mt-1 text-sm text-foreground">
												<a href={`mailto:${report.owner_email}`}
												   className="text-callout-accent hover:underline">
													{report.owner_email}
												</a>
											</dd>
										</div>
									)}
									{report.description && (
										<div className="py-2">
											<dt className="text-xs font-medium uppercase tracking-wider text-text-gray">Description</dt>
											<dd className="mt-1 text-sm text-foreground whitespace-pre-wrap">{report.description}</dd>
										</div>
									)}
									{report.note && isAdmin && (
										<div className="py-2 pl-3 border-l-2 border-page-header-accent">
											<dt className="text-xs font-medium uppercase tracking-wider text-text-gray">Internal Note</dt>
											<dd className="mt-1 text-sm text-foreground whitespace-pre-wrap">{report.note}</dd>
										</div>
									)}
									<div className="grid sm:grid-cols-2 gap-x-12">
										<div className="py-2">
											<dt className="text-xs font-medium uppercase tracking-wider text-text-gray">Created</dt>
											<dd className="mt-1 text-sm text-foreground">
												{new Date(report.created_at).toLocaleDateString("en-US", {
													year: "numeric",
													month: "long",
													day: "numeric",
												})}
											</dd>
										</div>
										<div className="py-2">
											<dt className="text-xs font-medium uppercase tracking-wider text-text-gray">Updated</dt>
											<dd className="mt-1 text-sm text-foreground">
												{new Date(report.updated_at).toLocaleDateString("en-US", {
													year: "numeric",
													month: "long",
													day: "numeric",
												})}
											</dd>
										</div>
									</div>
								</dl>
							</div>
						</div>


						{hasGemologicalData && (
							<div className="border border-border rounded-lg bg-background overflow-hidden">
								<div className="border-b border-border bg-background-creme px-6 py-4">
									<h2 className="font-medium">Gemological Properties</h2>
								</div>
								<div className="p-6">
									{gemologicalGroups
										.filter((group) => group.fields.some((f) => f.value != null && f.value !== ""))
										.map((group, i) => (
											<dl key={group.label}
											    className={`grid sm:grid-cols-2 gap-x-12 ${i > 0 ? "mt-10" : ""}`}>
												{group.fields
													.filter((f) => f.value != null && f.value !== "")
													.map((field) => {
														if (field.label === "Carat Weight") {
															return (
																<div key={field.label}
																     className="py-2">
																	<dt className="text-xs font-medium uppercase tracking-wider text-text-gray">{field.label}</dt>
																	<dd className="mt-1 text-sm text-foreground">
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
										))}
								</div>
							</div>
						)}


						{isAdmin && (report.owner_telephone || report.price != null) && (
							<div className="border border-border rounded-lg bg-background overflow-hidden">
								<div className="border-b border-border bg-background-creme px-6 py-4">
									<h2 className="font-medium">
										Internal
										<span className="ml-2 text-xs text-text-gray">(Admin only)</span>
									</h2>
								</div>
								<div className="p-6">
									<dl className="grid sm:grid-cols-2 gap-x-12">
										{report.owner_telephone && (
											<div className="py-2">
												<dt className="text-xs font-medium uppercase tracking-wider text-text-gray">Telephone</dt>
												<dd className="mt-1 text-sm text-foreground">
													<a href={`tel:${report.owner_telephone}`}
													   className="text-callout-accent hover:underline">
														{report.owner_telephone}
													</a>
												</dd>
											</div>
										)}
										{report.price != null && (
											<div className="py-2">
												<dt className="text-xs font-medium uppercase tracking-wider text-text-gray">Price</dt>
												<dd className="mt-1 text-sm text-foreground">{report.price} {report.currency || ""}</dd>
											</div>
										)}
									</dl>
								</div>
							</div>
						)}


						{galleryImages.length > 0 && (
							<div className="border border-border rounded-lg bg-background overflow-hidden">
								<div className="border-b border-border bg-background-creme px-6 py-4">
									<h2 className="font-medium">Images</h2>
								</div>
								<div className="p-6">
									<ImageGallery images={galleryImages} columns={3} />
								</div>
							</div>
						)}
					</motion.div>


					{report.public && (
						<div id="report-qr-svg"
						     style={{ position: "absolute", left: "-9999px", top: "-9999px" }}>
							<QRCode value={typeof window !== "undefined" ? `${window.location.origin}/reports/${report.id}` : `https://gemsla.be/reports/${report.id}`}
							        size={100} />
						</div>
					)}
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
