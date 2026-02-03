"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "../../components/Button";
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

export function ReportDetailClient({ report: initialReport, isAdmin }: ReportDetailClientProps) {
	const router = useRouter();
	const [report, setReport] = useState(initialReport);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

	const handleTogglePublic = async () => {
		// Store previous state for rollback
		const previousReport = report;

		// Optimistic update - update UI immediately
		setReport({ ...report, public: !report.public });

		try {
			const response = await fetch(`/api/reports/${report.id}/toggle-public`, {
				method: "PATCH",
			});

			if (!response.ok) {
				throw new Error("Failed to toggle public status");
			}

			// Update with server response (in case of any server-side changes)
			const updatedReport = await response.json();
			setReport(updatedReport);
		} catch (error) {
			// Rollback on error
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
		url: img.image_url,
		alt: `${report.title} image`,
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
					<motion.div className="mb-8"
					            variants={fadeInUp}
					            initial="hidden"
					            animate="show">
						<div className="flex flex-col sm:flex-row justify-between items-start gap-4">
							<div>
								<div className="flex items-center gap-3 mb-2">
									<h1>{report.title}</h1>
									<span className={`rounded-full px-3 py-1 text-sm font-medium ${
										report.public
											? "bg-green-100 text-green-800"
											: "bg-gray-100 text-gray-800"
									}`}>
										{report.public ? "Public" : "Private"}
									</span>
								</div>
								<p className="text-text-gray">
									Report for {report.first_name} {report.last_name}
								</p>
							</div>

							{isAdmin && (
								<div className="flex flex-wrap gap-2">
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
									<Button variant="outline"
									        size="sm"
									        onClick={() => setDeleteDialogOpen(true)}
									        className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700">
										Delete
									</Button>
								</div>
							)}
						</div>
					</motion.div>

					{/* Report Details */}
					<motion.div className="space-y-8"
					            variants={fadeInUp}
					            initial="hidden"
					            animate="show"
					            transition={{ delay: 0.1 }}>
						{/* Info Card */}
						<div className="border border-border rounded-lg bg-background overflow-hidden">
							<div className="border-b border-border bg-background-creme px-6 py-4">
								<h2 className="text-lg font-medium">Report Information</h2>
							</div>
							<div className="p-6">
								<dl className="grid gap-6 sm:grid-cols-2">
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
									<div className="mt-6 pt-6 border-t border-border">
										<dt className="text-sm font-medium text-text-gray">Description</dt>
										<dd className="mt-2 text-foreground whitespace-pre-wrap">
											{report.description}
										</dd>
									</div>
								)}

								{report.note && isAdmin && (
									<div className="mt-6 pt-6 border-t border-border">
										<dt className="text-sm font-medium text-text-gray">
											Internal Note
											<span className="ml-2 text-xs text-gray-500">(Admin only)</span>
										</dt>
										<dd className="mt-2 text-foreground whitespace-pre-wrap bg-background-creme p-4 rounded-md">
											{report.note}
										</dd>
									</div>
								)}
							</div>
						</div>

						{/* Images */}
						<div className="border border-border rounded-lg bg-background overflow-hidden">
							<div className="border-b border-border bg-background-creme px-6 py-4">
								<h2 className="text-lg font-medium">
									Images ({galleryImages.length})
								</h2>
							</div>
							<div className="p-6">
								<ImageGallery images={galleryImages} columns={3} />
							</div>
						</div>

						{/* Share Link for Public Reports */}
						{report.public && (
							<div className="border border-border rounded-lg bg-background overflow-hidden">
								<div className="border-b border-border bg-background-creme px-6 py-4">
									<h2 className="text-lg font-medium">Share This Report</h2>
								</div>
								<div className="p-6">
									<p className="text-sm text-text-gray mb-3">
										This report is publicly accessible. Share the link below:
									</p>
									<div className="flex gap-2">
										<input type="text"
										       value={typeof window !== "undefined" ? window.location.href : ""}
										       readOnly
										       className="flex-1 rounded-md border border-border bg-background-creme px-3 py-2 text-sm text-foreground" />
										<Button variant="secondary"
										        size="sm"
										        onClick={() => {
											        navigator.clipboard.writeText(window.location.href);
										        }}>
											Copy
										</Button>
									</div>
								</div>
							</div>
						)}
					</motion.div>
				</div>
			</section>

			{/* Delete Confirmation Dialog */}
			<DeleteDialog isOpen={deleteDialogOpen}
			              onClose={() => setDeleteDialogOpen(false)}
			              onConfirm={handleDelete}
			              title="Delete Report"
			              message={`Are you sure you want to delete "${report.title}"? This action cannot be undone. All associated images will also be deleted.`}
			              isPending={isDeleting} />
		</div>
	);
}
