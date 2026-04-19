"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

import { Button } from "../../components/Button";
import { DeleteDialog } from "../../components/DeleteDialog";
import { InlineEntitySearch } from "../../components/InlineEntitySearch";
import { StoneEditPanel, StoneDocumentsList, StonePriceBreakdown } from "../../components/StoneDetail";
import { money, fmtDate } from "@/app/lib/format";
import type { LinkedReportSummary, Stone } from "../../api/stones/types";


interface ReportSearchResult {
	id: string;
	title: string;
	stone: string | null;
	created_at: string;
}


interface StoneDetailClientProps {
	stone: Stone;
}


const pillBase = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";


function ToggleSwitch({ label, checked, onToggle }: {
	label: string;
	checked: boolean;
	onToggle: () => Promise<void>;
}) {
	const [display, setDisplay] = useState(checked);
	const [pending, setPending] = useState(false);

	const handleClick = useCallback(async (e: React.MouseEvent) => {
		e.stopPropagation();
		if (pending) return;
		const next = !display;
		setDisplay(next);
		setPending(true);
		try {
			await onToggle();
		} catch {
			setDisplay(!next);
			toast.error(`Failed to update ${label.toLowerCase()}`);
		} finally {
			setPending(false);
		}
	}, [pending, display, onToggle, label]);

	return (
		<button className={`flex items-start gap-1.5 group ${pending ? "opacity-70" : ""}`}
		        onClick={handleClick}
		        role="switch"
		        aria-checked={display}
		        aria-label={`Toggle ${label}`}
		        disabled={pending}>
			<span className="text-xs text-text-gray group-hover:text-foreground transition-colors">
				{label}
			</span>
			<div className={`relative w-7 h-4 rounded-full transition-colors mt-0.5 ${display ? "bg-foreground" : "bg-border"}`}>
				<motion.div className="absolute top-0.5 w-3 h-3 rounded-full bg-background shadow-sm"
				            animate={{ left: display ? 14 : 2 }}
				            transition={{ type: "spring", stiffness: 500, damping: 30 }} />
			</div>
		</button>
	);
}


export function StoneDetailClient({ stone: initialStone }: StoneDetailClientProps) {
	const router = useRouter();
	const [stone, setStone] = useState(initialStone);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [editing, setEditing] = useState(false);
	const [isUnlinkingReport, setIsUnlinkingReport] = useState(false);

	const linkedReport: LinkedReportSummary | null = initialStone.linked_report ?? null;

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

	const patchStone = useCallback(async (data: Record<string, unknown>) => {
		const res = await fetch(`/api/stones/${stone.id}`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(data),
		});
		if (!res.ok) throw new Error("Failed to update");
	}, [stone.id]);

	const toggleSold = useCallback(async () => {
		const next = !stone.is_sold;
		setStone((prev) => ({ ...prev, is_sold: next, sold_at: next ? new Date().toISOString() : prev.sold_at }));
		try {
			await patchStone({
				is_sold: next,
				sold_at: next ? new Date().toISOString() : null,
			});
			router.refresh();
		} catch (e) {
			setStone((prev) => ({ ...prev, is_sold: !next }));
			throw e;
		}
	}, [stone.is_sold, patchStone, router]);

	const putLinkedReport = async (reportId: string | null) => {
		const res = await fetch(`/api/stones/${stone.id}/linked-report`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ report_id: reportId }),
		});

		if (res.status === 409) {
			const body = await res.json().catch(() => null);
			const title = body?.linked_report_title;
			toast.error(
				title
					? `Report already linked to another stone (“${title}”).`
					: "Report is already linked to another stone."
			);
			return false;
		}

		if (!res.ok) {
			toast.error("Could not update link. Try again.");
			return false;
		}

		return true;
	};


	const handlePickReport = async (report: ReportSearchResult) => {
		const ok = await putLinkedReport(report.id);
		if (!ok) throw new Error();
		toast.success("Linked");
		router.refresh();
	};


	const handleUnlinkReport = async () => {
		setIsUnlinkingReport(true);
		try {
			const ok = await putLinkedReport(null);
			if (!ok) return;
			toast.success("Unlinked");
			router.refresh();
		} finally {
			setIsUnlinkingReport(false);
		}
	};


	const stoneInvoices = stone.stone_invoices ?? [];
	const hasPricing = stone.price_eur != null || stone.price_usd != null || stone.gross_eur != null || stone.gross_usd != null;


	return (
		<div className="min-h-screen relative pt-16">
			<div className="fixed inset-0 z-0 opacity-10 pointer-events-none"
			     style={{
				     backgroundImage: 'url("/NNNoise Texture Generator.svg")',
				     backgroundSize: "400px 400px",
				     backgroundRepeat: "repeat",
			     }} />

			<section className="relative py-8 px-4 sm:px-6 lg:px-8 z-10">
				<div className="max-w-4xl mx-auto">

					<Link href="/stones"
					      className="inline-flex items-center gap-1 text-sm text-text-gray hover:text-foreground transition-colors mb-5">
						<svg className="h-4 w-4"
						     fill="none"
						     viewBox="0 0 24 24"
						     stroke="currentColor">
							<path strokeLinecap="round"
							      strokeLinejoin="round"
							      strokeWidth={1.5}
							      d="M15.75 19.5L8.25 12l7.5-7.5" />
						</svg>
						Back to stones
					</Link>


					<div className="flex items-start justify-between gap-3 mb-6">
						<div className="min-w-0">
							<h1 className="text-2xl font-medium font-heading text-foreground">
								{stone.name}
							</h1>
							<div className="flex items-center gap-1.5 mt-1.5">
								<span className={`${pillBase} ${
									stone.is_sold
										? "bg-gray-100 text-gray-800 border"
										: "bg-green-100 text-green-800 border"
								}`}>
									{stone.is_sold ? "Sold" : "Available"}
								</span>
							</div>
						</div>
						<div className="flex items-center gap-2 shrink-0">
							<Button variant="ghost"
							        size="sm"
							        aria-label="Delete stone"
							        onClick={() => setDeleteDialogOpen(true)}>
								<svg className="h-4 w-4 text-text-gray"
								     fill="none"
								     viewBox="0 0 24 24"
								     stroke="currentColor">
									<path strokeLinecap="round"
									      strokeLinejoin="round"
									      strokeWidth={1.5}
									      d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
								</svg>
							</Button>
						</div>
					</div>


					<div className="space-y-5">

						<div className="rounded-lg bg-white border border-border-light p-5 relative group/summary cursor-pointer hover:border-border transition-colors"
						     onClick={() => setEditing(true)}>

							<div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
								<div className="flex-1 min-w-0">
									<div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2 text-sm">
										<div>
											<div className="text-xs text-text-gray">Stone Type</div>
											<div className="font-medium truncate">{stone.stone_type ?? "---"}</div>
										</div>
										<div>
											<div className="text-xs text-text-gray">Color</div>
											<div className="font-medium">{stone.color ?? "---"}</div>
										</div>
										<div>
											<div className="text-xs text-text-gray">Cut</div>
											<div className="font-medium">{stone.cut ?? "---"}</div>
										</div>
										<div>
											<div className="text-xs text-text-gray">Weight</div>
											<div className="font-medium">{stone.weight_carats ? `${stone.weight_carats} ct` : "---"}</div>
										</div>
										<div>
											<div className="text-xs text-text-gray">Dimensions</div>
											<div className="font-medium">{stone.dimensions ?? "---"}</div>
										</div>
										<div>
											<div className="text-xs text-text-gray">Country</div>
											<div className="font-medium">{stone.country ?? "---"}</div>
										</div>
									</div>

									{stone.description && (
										<div className="mt-3 text-xs text-text-gray italic">{stone.description}</div>
									)}

									<div className="flex items-baseline gap-6 mt-4 pt-3 border-t border-border-light">
										{stone.selling_price != null ? (
											<div>
												<span className="text-xs text-text-gray mr-1.5">Selling</span>
												<span className="text-lg font-medium tabular-nums">{money(stone.selling_price, "usd")}</span>
											</div>
										) : (
											<div className="text-xs text-text-gray">No selling price set</div>
										)}
										{stone.is_sold && stone.sold_price != null && (
											<div>
												<span className="text-xs text-text-gray mr-1.5">Sold for</span>
												<span className="text-lg font-medium tabular-nums">{money(stone.sold_price, "usd")}</span>
											</div>
										)}
										{stone.is_sold && stone.sold_at && (
											<div>
												<span className="text-xs text-text-gray mr-1.5">Sold</span>
												<span className="text-sm font-medium">{fmtDate(stone.sold_at)}</span>
											</div>
										)}
									</div>

									{stone.notes && (
										<div className="mt-3 text-xs text-text-gray italic">{stone.notes}</div>
									)}

									<div className="mt-2 text-xs text-text-gray/60">
										Created {fmtDate(stone.created_at)}
										{stone.updated_at !== stone.created_at && <> · Updated {fmtDate(stone.updated_at)}</>}
									</div>
								</div>

								<div className="flex sm:flex-col items-center sm:items-end gap-3 shrink-0"
								     onClick={(e) => e.stopPropagation()}>
									<ToggleSwitch label="Sold"
									              checked={stone.is_sold}
									              onToggle={toggleSold} />
								</div>
							</div>
						</div>


						{hasPricing && (
							<StonePriceBreakdown stone={stone}
							                     onEdit={() => setEditing(true)} />
						)}


						<div className="rounded-lg bg-white border border-border-light p-5">
							<h3 className="text-sm font-medium text-foreground mb-3">Linked Report</h3>
							{linkedReport ? (
								<div className="relative">
									<Link href={`/reports/${linkedReport.id}`}
									      className="flex flex-col gap-1 rounded-md border border-border px-4 py-3 pr-9 hover:bg-background-creme transition-colors">
										<span className="text-sm font-medium text-foreground">
											{linkedReport.title}
										</span>
										<span className="text-xs text-text-gray">
											Created {fmtDate(linkedReport.created_at)}
										</span>
									</Link>
									<button className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-text-gray hover:text-foreground transition-colors disabled:opacity-40"
									        onClick={handleUnlinkReport}
									        disabled={isUnlinkingReport}
									        aria-label="Unlink report">
										<svg className="h-3.5 w-3.5"
										     fill="none"
										     viewBox="0 0 24 24"
										     stroke="currentColor">
											<path strokeLinecap="round"
											      strokeLinejoin="round"
											      strokeWidth={2}
											      d="M6 18L18 6M6 6l12 12" />
										</svg>
									</button>
								</div>
							) : (
								<InlineEntitySearch<ReportSearchResult> searchUrl="/api/reports/search"
								                                         placeholder="Search reports..."
								                                         getId={(r) => r.id}
								                                         onSelect={handlePickReport}
								                                         renderItem={(r) => (
									                                         <div className="flex flex-col gap-0.5">
										                                         <span className="text-sm font-medium text-foreground">{r.title}</span>
										                                         <span className="text-xs text-text-gray">
											                                         {[r.stone, fmtDate(r.created_at)].filter(Boolean).join(" · ")}
										                                         </span>
									                                         </div>
								                                         )} />
							)}
						</div>


						<StoneDocumentsList stoneInvoices={stoneInvoices} />
					</div>
				</div>
			</section>

			<StoneEditPanel isOpen={editing}
			                onClose={() => setEditing(false)}
			                stone={stone}
			                onSaved={() => router.refresh()} />

			<DeleteDialog isOpen={deleteDialogOpen}
			              onClose={() => setDeleteDialogOpen(false)}
			              onConfirm={handleDelete}
			              title="Delete Stone"
			              message={`Are you sure you want to delete "${stone.name}"? This action cannot be undone.`}
			              isPending={isDeleting} />


		</div>
	);
}
