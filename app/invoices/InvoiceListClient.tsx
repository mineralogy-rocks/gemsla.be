"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

import { Button } from "../components/Button";
import { Checkbox } from "../components/Checkbox";
import { PageHeader } from "../components/PageHeader";
import { Pagination } from "../components/Pagination";
import { SearchInput } from "../components/SearchInput";
import { BulkActionBar } from "../components/BulkActionBar";
import { DeleteDialog } from "../components/DeleteDialog";
import type { InvoiceListItem, InvoiceStats, PaginatedInvoicesResponse } from "../api/stones/types";

interface InvoiceListClientProps {
	initialData: PaginatedInvoicesResponse;
	stats: InvoiceStats;
}

type SortColumn = "invoice_number" | "supplier" | "invoice_date" | "gross_eur" | "gross_usd";

function useDebounce<T>(value: T, delay: number): T {
	const [debouncedValue, setDebouncedValue] = useState<T>(value);

	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedValue(value);
		}, delay);

		return () => {
			clearTimeout(timer);
		};
	}, [value, delay]);

	return debouncedValue;
}

const staggerContainer = {
	hidden: { opacity: 0 },
	show: {
		opacity: 1,
		transition: { staggerChildren: 0.02 },
	},
};

const staggerItem = {
	hidden: { opacity: 0, y: 3 },
	show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] } },
};


function formatCurrency(amount: number | null, currency: string): string {
	if (amount == null) return "-";
	const symbol = currency === "EUR" ? "\u20AC" : "$";
	return `${symbol}${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(date: string | null): string {
	if (!date) return "-";
	return new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function SortArrow({ active, direction }: { active: boolean; direction: string }) {
	if (!active) {
		return (
			<svg className="h-3 w-3 text-text-gray/30"
			     viewBox="0 0 12 12"
			     fill="currentColor">
				<path d="M6 2l3 4H3zM6 10l3-4H3z" />
			</svg>
		);
	}

	return (
		<svg className="h-3 w-3 text-foreground"
		     viewBox="0 0 12 12"
		     fill="currentColor">
			{direction === "asc"
				? <path d="M6 3l3 4H3z" />
				: <path d="M6 9l3-4H3z" />
			}
		</svg>
	);
}


export function InvoiceListClient({ initialData, stats }: InvoiceListClientProps) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	const currentPage = parseInt(searchParams.get("page") || "1", 10);
	const currentSortBy = searchParams.get("sort_by") || "";
	const currentSortDir = searchParams.get("sort_dir") || "";
	const currentSearch = searchParams.get("q") || "";
	const currentShowProcessed = searchParams.get("is_processed") === '1';
	const currentShowPaid = searchParams.get("is_paid") === '1';
	const currentShowRefunds = searchParams.get("show_refunds") === '1';

	const [search, setSearch] = useState(currentSearch);
	const debouncedSearch = useDebounce(search, 300);

	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const [deleteTarget, setDeleteTarget] = useState<InvoiceListItem | null>(null);
	const [showBulkDelete, setShowBulkDelete] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [isMarkingPaid, setIsMarkingPaid] = useState(false);
	const [isUploading, setIsUploading] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const checkboxRef = useRef<HTMLInputElement>(null);

	const { data: invoices, total, totalPages } = initialData;
	const showPagination = totalPages > 1;

	const allOnPageSelected = invoices.length > 0 && invoices.every((inv) => selectedIds.has(inv.id));
	const someSelected = selectedIds.size > 0;


	useEffect(() => {
		setSelectedIds(new Set());
	}, [currentPage]);

	useEffect(() => {
		if (checkboxRef.current) {
			checkboxRef.current.indeterminate = someSelected && !allOnPageSelected;
		}
	}, [someSelected, allOnPageSelected]);


	const createQueryString = useCallback((params: Record<string, string | number | boolean>) => {
		const urlParams = new URLSearchParams(searchParams.toString());
		Object.entries(params).forEach(([key, value]) => {
			if (value === "" || value === false || value === 1) {
				urlParams.delete(key);
			} else {
				urlParams.set(key, String(value));
			}
		});
		return urlParams.toString();
	}, [searchParams]);

	useEffect(() => {
		if (debouncedSearch !== currentSearch) {
			const query = createQueryString({ q: debouncedSearch, page: 1 });
			router.push(`${pathname}${query ? `?${query}` : ""}`);
		}
	}, [debouncedSearch, currentSearch, createQueryString, pathname, router]);

	const handleShowProcessedChange = () => {
		const query = createQueryString({ is_processed: currentShowProcessed ? '' : '1', page: 1 });
		router.push(`${pathname}${query ? `?${query}` : ""}`);
	};

	const handleShowPaidChange = () => {
		const query = createQueryString({ is_paid: currentShowPaid ? '' : '1', page: 1 });
		router.push(`${pathname}${query ? `?${query}` : ""}`);
	};

	const handleShowRefundsChange = () => {
		const query = createQueryString({ show_refunds: currentShowRefunds ? '' : '1', page: 1 });
		router.push(`${pathname}${query ? `?${query}` : ""}`);
	};

	const handlePageChange = (newPage: number) => {
		const query = createQueryString({ page: newPage });
		router.push(`${pathname}${query ? `?${query}` : ""}`);
	};

	const handleSort = (column: SortColumn) => {
		let newDir = "asc";
		if (currentSortBy === column) {
			if (currentSortDir === "asc") newDir = "desc";
			else if (currentSortDir === "desc") {
				const query = createQueryString({ sort_by: "", sort_dir: "", page: 1 });
				router.push(`${pathname}${query ? `?${query}` : ""}`);
				return;
			}
		}
		const query = createQueryString({ sort_by: column, sort_dir: newDir, page: 1 });
		router.push(`${pathname}${query ? `?${query}` : ""}`);
	};

	const handleSelectAll = () => {
		if (allOnPageSelected) {
			setSelectedIds(new Set());
		} else {
			setSelectedIds(new Set(invoices.map((inv) => inv.id)));
		}
	};

	const handleSelectOne = (id: string) => {
		setSelectedIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) {
				next.delete(id);
			} else {
				next.add(id);
			}
			return next;
		});
	};

	const handleDelete = async () => {
		if (!deleteTarget) return;
		setIsDeleting(true);
		try {
			const response = await fetch(`/api/invoices/${deleteTarget.id}`, { method: "DELETE" });
			if (!response.ok) throw new Error("Failed to delete invoice");
			setSelectedIds((prev) => {
				const next = new Set(prev);
				next.delete(deleteTarget.id);
				return next;
			});
			router.refresh();
		} catch {
			toast.error("Failed to delete invoice. Please try again.");
		} finally {
			setIsDeleting(false);
			setDeleteTarget(null);
		}
	};

	const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = Array.from(e.target.files ?? []);
		if (files.length === 0) return;
		e.target.value = "";

		setIsUploading(true);
		try {
			const uploads = files.map(async (file) => {
				const formData = new FormData();
				formData.append("file", file);
				const response = await fetch("/api/invoices", { method: "POST", body: formData });
				if (!response.ok) throw new Error(`Failed to upload ${file.name}`);
			});
			await Promise.all(uploads);
			router.refresh();
		} catch {
			toast.error("Failed to upload invoice(s). Please try again.");
		} finally {
			setIsUploading(false);
		}
	};

	const handleBulkMarkPaid = async (paid: boolean) => {
		setIsMarkingPaid(true);
		try {
			const response = await fetch("/api/invoices/bulk-update", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ ids: [...selectedIds], data: { is_paid: paid } }),
			});
			if (!response.ok) throw new Error(`Failed to mark invoices as ${paid ? "paid" : "unpaid"}`);
			setSelectedIds(new Set());
			router.refresh();
		} catch {
			toast.error("Failed to update invoices. Please try again.");
		} finally {
			setIsMarkingPaid(false);
		}
	};

	const handleBulkDelete = async () => {
		setIsDeleting(true);
		try {
			const response = await fetch("/api/invoices/bulk-delete", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ ids: [...selectedIds] }),
			});
			if (!response.ok) throw new Error("Failed to delete invoices");
			setSelectedIds(new Set());
			router.refresh();
		} catch {
			toast.error("Failed to delete invoices. Please try again.");
		} finally {
			setIsDeleting(false);
			setShowBulkDelete(false);
		}
	};


	function renderSortableHeader(column: SortColumn, label: string, className?: string) {
		const isActive = currentSortBy === column;
		return (
			<th className={`py-2 px-3 text-[11px] font-normal text-text-gray tracking-wide ${className || ""}`}>
				<button type="button"
				        onClick={() => handleSort(column)}
				        className="inline-flex items-center gap-1 hover:text-foreground transition-colors">
					{label}
					<SortArrow active={isActive}
					           direction={currentSortDir} />
				</button>
			</th>
		);
	}


	return (
		<div className="min-h-screen relative pt-16">
			<div className="fixed inset-0 z-0 opacity-10 pointer-events-none"
			     style={{
				     backgroundImage: 'url("/NNNoise Texture Generator.svg")',
				     backgroundSize: "400px 400px",
				     backgroundRepeat: "repeat",
			     }} />

			<section className="relative py-12 px-4 sm:px-6 lg:px-8 z-10">
				<div className="max-w-6xl mx-auto">
					<PageHeader title="Invoices"
					            subtitle={`${total} invoice${total !== 1 ? "s" : ""}`} />

					<div className="flex flex-col gap-4 my-6">
						<div className="flex items-center gap-3">
							<div className="flex-1">
								<SearchInput value={search}
								             onChange={(e) => setSearch(e.target.value)}
								             onClear={() => setSearch("")}
								             placeholder="Search invoices..." />
							</div>

							<div className="ml-auto">
								<input ref={fileInputRef}
								       type="file"
								       accept=".pdf,application/pdf"
								       multiple
								       onChange={handleUpload}
								       className="hidden" />
								<Button variant="primary"
								        size="sm"
								        loading={isUploading}
								        onClick={() => fileInputRef.current?.click()}>
									<svg className="h-3 w-3 mr-0.5"
									     fill="none"
									     viewBox="0 0 24 24"
									     stroke="currentColor">
										<path strokeLinecap="round"
										      strokeLinejoin="round"
										      strokeWidth={2}
										      d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
									</svg>
									Upload Invoice
								</Button>
							</div>
						</div>

						<div className="flex flex-wrap items-center gap-4">
							<Checkbox label="Processed"
							          checked={currentShowProcessed}
							          onChange={handleShowProcessedChange} />
							<Checkbox label="Paid"
							          checked={currentShowPaid}
							          onChange={handleShowPaidChange} />
							<Checkbox label="Refunds"
							          checked={currentShowRefunds}
							          onChange={handleShowRefundsChange} />
						</div>
					</div>

					<div className="flex flex-wrap justify-center gap-3 mb-6">
						<div className="rounded-md border border-border-light bg-background-creme/40 px-4 py-3 min-w-40">
							<p className="text-[11px] text-text-gray tracking-wide">Invested (EUR)</p>
							<p className="text-sm font-medium text-foreground tabular-nums mt-0.5">
								{formatCurrency(stats.total_eur || null, "EUR")}
							</p>
						</div>
						<div className="rounded-md border border-border-light bg-background-creme/40 px-4 py-3 min-w-40">
							<p className="text-[11px] text-text-gray tracking-wide">Revenue</p>
							<p className="text-sm font-medium text-foreground tabular-nums mt-0.5">
								{formatCurrency(stats.total_revenue || null, "USD")}
							</p>
						</div>
						<div className="rounded-md border border-border-light bg-background-creme/40 px-4 py-3 min-w-40">
							<p className="text-[11px] text-text-gray tracking-wide">Processed</p>
							<p className="text-sm font-medium text-foreground tabular-nums mt-0.5">
								{stats.processed_count}
							</p>
						</div>
						<div className="rounded-md border border-border-light bg-background-creme/40 px-4 py-3 min-w-40">
							<p className="text-[11px] text-text-gray tracking-wide">Pending</p>
							<p className="text-sm font-medium text-foreground tabular-nums mt-0.5">
								{stats.pending_count}
							</p>
						</div>
					</div>

					{invoices.length === 0 ? (
						<div className="rounded-md border border-border-light bg-background-creme/40 py-16 px-8 text-center">
							<p className="text-text-gray">
								{currentSearch || currentShowProcessed || currentShowPaid || currentShowRefunds
									? "No invoices match your search criteria"
									: "No invoices yet. Upload your first invoice."}
							</p>
						</div>
					) : (
						<>
							<div className="overflow-x-auto">
								<table className="w-full text-sm">
									<thead>
										<tr className="border-b border-border-light text-left">
											<th className="py-2 px-3 w-10">
												<input ref={checkboxRef}
												       type="checkbox"
												       checked={allOnPageSelected}
												       onChange={handleSelectAll}
												       className="h-3.5 w-3.5 rounded border-border accent-foreground cursor-pointer" />
											</th>
											<th className="py-2 px-3 text-[11px] font-normal text-text-gray tracking-wide">ID</th>
											{renderSortableHeader("invoice_number", "Invoice #")}
											{renderSortableHeader("supplier", "Supplier", "hidden sm:table-cell")}
											{renderSortableHeader("invoice_date", "Date", "hidden md:table-cell")}
											{renderSortableHeader("gross_eur", "EUR", "text-right")}
											{renderSortableHeader("gross_usd", "USD", "text-right")}
											<th className="py-2 px-3 text-[11px] font-normal text-text-gray tracking-wide text-right">Stones</th>
											<th className="py-2 px-3 w-10"></th>
										</tr>
									</thead>
									<motion.tbody variants={staggerContainer}
									              initial="hidden"
									              animate="show"
									              key={`${currentPage}-${currentSortBy}-${currentSortDir}-${currentSearch}-${currentShowProcessed}-${currentShowPaid}-${currentShowRefunds}-${total}`}>
										{invoices.map((invoice) => (
											<motion.tr key={invoice.id}
											           variants={staggerItem}
											           className={`border-b border-border-light/60 group transition-colors duration-150 ${
												           selectedIds.has(invoice.id)
													           ? "bg-gold/[0.04]"
													           : "hover:bg-background-creme/40"
											           }`}>
												<td className="py-2.5 px-3">
													<div className="row-checkbox"
													     data-visible={someSelected || selectedIds.has(invoice.id) || undefined}>
														<input type="checkbox"
														       checked={selectedIds.has(invoice.id)}
														       onChange={() => handleSelectOne(invoice.id)}
														       className="h-3.5 w-3.5 rounded border-border accent-foreground cursor-pointer" />
													</div>
												</td>
												<td className="py-2.5 px-3 font-medium">
													<Link href={`/invoices/${invoice.id}`}
													      className="inline-flex items-center gap-2 text-xs text-text-gray/60 hover:text-foreground transition-colors font-mono">
														<span className={`h-1.5 w-1.5 shrink-0 rounded-full ${
															invoice.is_paid && invoice.is_processed
																? "bg-green-500"
																: !invoice.is_paid && !invoice.is_processed
																	? "bg-red-500"
																	: "bg-amber-500"
														}`} />
														{invoice.id}
													</Link>
												</td>
												<td className="py-2.5 px-3 font-medium text-foreground">
													{invoice.invoice_number || "-"}
												</td>
												<td className="py-2.5 px-3 text-[13px] text-text-gray hidden sm:table-cell">
													{invoice.supplier || "-"}
												</td>
												<td className="py-2.5 px-3 text-[13px] text-text-gray hidden md:table-cell">
													{formatDate(invoice.invoice_date)}
												</td>
												<td className={`py-2.5 px-3 text-right text-[13px] tabular-nums ${invoice.gross_eur == null ? "text-text-gray/40" : ""}`}>
													{formatCurrency(invoice.gross_eur, "EUR")}
												</td>
												<td className={`py-2.5 px-3 text-right text-[13px] tabular-nums ${invoice.gross_usd == null ? "text-text-gray/40" : ""}`}>
													{formatCurrency(invoice.gross_usd, "USD")}
												</td>
												<td className="py-2.5 px-3 text-right text-[13px] text-text-gray tabular-nums">
													{invoice.stone_count}
												</td>
												<td className="py-2.5 px-3">
													<button type="button"
													        onClick={() => setDeleteTarget(invoice)}
													        className="text-text-gray hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
													        aria-label="Delete invoice">
														<svg className="h-4 w-4"
														     fill="none"
														     viewBox="0 0 24 24"
														     stroke="currentColor">
															<path strokeLinecap="round"
															      strokeLinejoin="round"
															      strokeWidth={1.5}
															      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
														</svg>
													</button>
												</td>
											</motion.tr>
										))}
									</motion.tbody>
								</table>
							</div>

							{showPagination && (
								<Pagination currentPage={currentPage}
								            totalPages={totalPages}
								            onPageChange={handlePageChange}
								            className="mt-8" />
							)}
						</>
					)}
				</div>
			</section>

			<BulkActionBar isOpen={someSelected}
			               selectedCount={selectedIds.size}>
				<Button variant="ghost"
				        size="sm"
				        disabled={isMarkingPaid}
				        onClick={() => handleBulkMarkPaid(true)}>
					<svg className="h-3.5 w-3.5 mr-1 text-green-500"
					     fill="none"
					     viewBox="0 0 24 24"
					     stroke="currentColor">
						<path strokeLinecap="round"
						      strokeLinejoin="round"
						      strokeWidth={1.5}
						      d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
					Mark Paid
				</Button>
				<Button variant="ghost"
				        size="sm"
				        disabled={isMarkingPaid}
				        onClick={() => handleBulkMarkPaid(false)}>
					<svg className="h-3.5 w-3.5 mr-1 text-amber-500"
					     fill="none"
					     viewBox="0 0 24 24"
					     stroke="currentColor">
						<path strokeLinecap="round"
						      strokeLinejoin="round"
						      strokeWidth={1.5}
						      d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
					Mark Unpaid
				</Button>
				<div className="h-4 w-px bg-border" />
				<Button variant="ghost"
				        size="sm"
				        onClick={() => setShowBulkDelete(true)}>
					<svg className="h-3.5 w-3.5 mr-1 text-red-500"
					     fill="none"
					     viewBox="0 0 24 24"
					     stroke="currentColor">
						<path strokeLinecap="round"
						      strokeLinejoin="round"
						      strokeWidth={1.5}
						      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
					</svg>
					Delete
				</Button>
			</BulkActionBar>

			<DeleteDialog isOpen={!!deleteTarget}
			              onClose={() => setDeleteTarget(null)}
			              onConfirm={handleDelete}
			              title="Delete Invoice"
			              message={`Are you sure you want to delete invoice "${deleteTarget?.invoice_number || deleteTarget?.id}"? This action cannot be undone.`}
			              isPending={isDeleting} />

			<DeleteDialog isOpen={showBulkDelete}
			              onClose={() => setShowBulkDelete(false)}
			              onConfirm={handleBulkDelete}
			              title="Delete Invoices"
			              message={`Are you sure you want to delete ${selectedIds.size} invoice${selectedIds.size !== 1 ? "s" : ""}? This action cannot be undone.`}
			              isPending={isDeleting} />

		</div>
	);
}
