"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

import { Button } from "../../components/Button";
import { DeleteDialog } from "../../components/DeleteDialog";
import { PageHeader } from "../../components/PageHeader";
import type { Stone, Invoice } from "../../api/stones/types";

interface StoneDetailClientProps {
	stone: Stone;
}

function FieldDisplay({ label, value, suffix }: { label: string; value: string | number | null | undefined; suffix?: string }) {
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

function formatPrice(price: number | null, symbol = "$"): string {
	if (price == null) return "-";
	return `${symbol}${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function StoneDetailClient({ stone: initialStone }: StoneDetailClientProps) {
	const router = useRouter();
	const [stone] = useState(initialStone);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

	const handleDelete = async () => {
		setIsDeleting(true);
		try {
			const response = await fetch(`/api/stones/${stone.id}`, { method: "DELETE" });
			if (!response.ok) throw new Error("Failed to delete stone");
			router.push("/stones");
		} catch {
			toast.error("Failed to delete stone. Please try again.");
			setIsDeleting(false);
		}
	};

	const invoice = stone.invoices as (Invoice & { signed_url?: string }) | null;

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
					<Link href="/stones"
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
						Back to Stones
					</Link>

					<PageHeader title={<>
					            {stone.name}
					            <span className={`ml-3 align-middle rounded-full px-2.5 py-0.5 text-xs font-medium ${
						            stone.is_sold
							            ? "bg-gray-100 text-gray-800 border"
							            : "bg-green-100 text-green-800 border"
					            }`}>
						            {stone.is_sold ? "Sold" : "Available"}
					            </span>
				            </>} />

					<div className="flex flex-wrap items-center gap-2 -mt-4 mb-8">
						<div className="ml-auto flex flex-wrap items-center gap-2">
							<Link href={`/stones/${stone.id}/edit`}>
								<Button variant="secondary" size="sm">Edit</Button>
							</Link>
							<Button variant="accent"
							        size="sm"
							        onClick={() => setDeleteDialogOpen(true)}>
								Delete
							</Button>
						</div>
					</div>

					<motion.div initial={{ opacity: 0 }}
					            animate={{ opacity: 1 }}
					            transition={{ duration: 0.4, delay: 0.1 }}
					            className="space-y-8">
						{/* Stone Information */}
						<div className="border border-border rounded-lg bg-background overflow-hidden">
							<div className="border-b border-border bg-background-creme px-6 py-4">
								<h2 className="font-medium">Stone Information</h2>
							</div>
							<div className="p-6">
								<dl className="grid sm:grid-cols-2 gap-x-12">
									<FieldDisplay label="Stone Type" value={stone.stone_type} />
									<FieldDisplay label="Color" value={stone.color} />
									<FieldDisplay label="Cut" value={stone.cut} />
									<FieldDisplay label="Weight" value={stone.weight_carats} suffix="ct" />
									<FieldDisplay label="Dimensions" value={stone.dimensions} />
									<FieldDisplay label="Country" value={stone.country} />
								</dl>
								{stone.description && (
									<div className="mt-4 pt-4 border-t border-border">
										<dt className="text-xs font-medium uppercase tracking-wider text-text-gray">Description</dt>
										<dd className="mt-1 text-sm text-foreground whitespace-pre-wrap">{stone.description}</dd>
									</div>
								)}
							</div>
						</div>

						{/* Pricing */}
						<div className="border border-border rounded-lg bg-background overflow-hidden">
							<div className="border-b border-border bg-background-creme px-6 py-4">
								<h2 className="font-medium">Pricing</h2>
							</div>
							<div className="p-6">
								<dl className="grid sm:grid-cols-2 gap-x-12">
									<div className="py-2">
										<dt className="text-xs font-medium uppercase tracking-wider text-text-gray">Price (USD)</dt>
										<dd className="mt-1 text-sm text-foreground">{formatPrice(stone.price_usd)}</dd>
									</div>
									<div className="py-2">
										<dt className="text-xs font-medium uppercase tracking-wider text-text-gray">Price (EUR)</dt>
										<dd className="mt-1 text-sm text-foreground">{formatPrice(stone.price_eur, "\u20AC")}</dd>
									</div>
									<div className="py-2">
										<dt className="text-xs font-medium uppercase tracking-wider text-text-gray">Selling Price</dt>
										<dd className="mt-1 text-lg font-medium text-foreground">{formatPrice(stone.selling_price)}</dd>
									</div>
									{stone.is_sold && stone.sold_price != null && (
										<div className="py-2">
											<dt className="text-xs font-medium uppercase tracking-wider text-text-gray">Sold Price</dt>
											<dd className="mt-1 text-sm text-foreground">{formatPrice(stone.sold_price)}</dd>
										</div>
									)}
									{stone.is_sold && stone.sold_at && (
										<div className="py-2">
											<dt className="text-xs font-medium uppercase tracking-wider text-text-gray">Sold Date</dt>
											<dd className="mt-1 text-sm text-foreground">
												{new Date(stone.sold_at).toLocaleDateString("en-US", {
													year: "numeric",
													month: "long",
													day: "numeric",
												})}
											</dd>
										</div>
									)}
								</dl>
							</div>
						</div>

						{/* Invoice */}
						{invoice && (
							<div className="border border-border rounded-lg bg-background overflow-hidden">
								<div className="border-b border-border bg-background-creme px-6 py-4">
									<h2 className="font-medium">Linked Invoice</h2>
								</div>
								<div className="p-6">
									<dl className="grid sm:grid-cols-2 gap-x-12">
										<FieldDisplay label="Invoice Number" value={invoice.invoice_number} />
										<FieldDisplay label="Supplier" value={invoice.supplier} />
										<FieldDisplay label="Invoice Date"
										              value={invoice.invoice_date ? new Date(invoice.invoice_date).toLocaleDateString() : null} />
										<FieldDisplay label="Price (USD)"
										              value={invoice.price_usd != null ? formatPrice(invoice.price_usd) : null} />
									<FieldDisplay label="Price (EUR)"
									              value={invoice.price_eur != null ? formatPrice(invoice.price_eur, "\u20AC") : null} />
									</dl>
									{invoice.signed_url && (
										<div className="mt-4 pt-4 border-t border-border">
											<a href={invoice.signed_url}
											   target="_blank"
											   rel="noopener noreferrer"
											   className="inline-flex items-center gap-2 text-sm text-callout-accent hover:underline">
												<svg className="h-4 w-4"
												     fill="none"
												     viewBox="0 0 24 24"
												     stroke="currentColor">
													<path strokeLinecap="round"
													      strokeLinejoin="round"
													      strokeWidth={1.5}
													      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
												</svg>
												Download Invoice PDF
											</a>
										</div>
									)}
								</div>
							</div>
						)}

						{/* Notes */}
						{stone.notes && (
							<div className="border border-border rounded-lg bg-background overflow-hidden">
								<div className="border-b border-border bg-background-creme px-6 py-4">
									<h2 className="font-medium">Notes</h2>
								</div>
								<div className="p-6">
									<p className="text-sm text-foreground whitespace-pre-wrap">{stone.notes}</p>
								</div>
							</div>
						)}

						{/* Metadata */}
						<div className="border border-border rounded-lg bg-background overflow-hidden">
							<div className="border-b border-border bg-background-creme px-6 py-4">
								<h2 className="font-medium">Metadata</h2>
							</div>
							<div className="p-6">
								<dl className="grid sm:grid-cols-2 gap-x-12">
									<div className="py-2">
										<dt className="text-xs font-medium uppercase tracking-wider text-text-gray">Created</dt>
										<dd className="mt-1 text-sm text-foreground">
											{new Date(stone.created_at).toLocaleDateString("en-US", {
												year: "numeric",
												month: "long",
												day: "numeric",
											})}
										</dd>
									</div>
									<div className="py-2">
										<dt className="text-xs font-medium uppercase tracking-wider text-text-gray">Updated</dt>
										<dd className="mt-1 text-sm text-foreground">
											{new Date(stone.updated_at).toLocaleDateString("en-US", {
												year: "numeric",
												month: "long",
												day: "numeric",
											})}
										</dd>
									</div>
								</dl>
							</div>
						</div>
					</motion.div>
				</div>
			</section>

			<DeleteDialog isOpen={deleteDialogOpen}
			              onClose={() => setDeleteDialogOpen(false)}
			              onConfirm={handleDelete}
			              title="Delete Stone"
			              message={`Are you sure you want to delete "${stone.name}"? This action cannot be undone.`}
			              isPending={isDeleting} />
		</div>
	);
}
