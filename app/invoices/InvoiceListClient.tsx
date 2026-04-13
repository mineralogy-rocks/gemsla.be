"use client";

import React, { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

import { useDebounce } from "@/app/lib/hooks/useDebounce";
import { createQueryString } from "@/app/lib/queryString";
import { money, fmtDate } from "@/app/lib/format";
import { BackgroundTexture } from "@/app/components/BackgroundTexture";
import { Button } from "../components/Button";
import { PageHeader } from "../components/PageHeader";
import { Pagination } from "../components/Pagination";
import { SearchInput } from "../components/SearchInput";
import { BulkActionBar } from "../components/BulkActionBar";
import type { InvoiceListItem, InvoiceStats, PaginatedInvoicesResponse } from "../api/stones/types";

interface InvoiceListClientProps {
	initialData: PaginatedInvoicesResponse;
	stats: InvoiceStats;
}

type SortColumn = "invoice_number" | "original_invoice_number" | "supplier" | "invoice_date" | "gross_eur" | "gross_usd";

function SortArrow({ active, direction }: { active: boolean; direction: string }) {
	if (!active) {
		return (
			<svg className="h-3 w-3 text-text-gray/30"
			     viewBox="0 0 12 12"
			     fill="currentColor">
				<path d="M6 1.5l3 4H3z" />
				<path d="M6 10.5l3-4H3z" />
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


function InvoiceRow({ invoice, isChild, isArchived, selectedIds, someSelected, archivingId, onSelect, onArchive }: {
	invoice: InvoiceListItem;
	isChild?: boolean;
	isArchived: boolean;
	selectedIds: Set<string>;
	someSelected: boolean;
	archivingId: string | null;
	onSelect: (id: string) => void;
	onArchive: (id: string) => void;
}) {
	return (
		<tr className={`border-b border-border-light/60 group transition-colors duration-150 ${
			selectedIds.has(invoice.id)
				? "bg-foreground/[0.03]"
				: "hover:bg-background-creme/40"
		}`}>
			<td className="py-2.5 px-3">
				<div className="row-checkbox"
				     data-visible={someSelected || selectedIds.has(invoice.id) || undefined}>
					<input type="checkbox"
					       checked={selectedIds.has(invoice.id)}
					       onChange={() => onSelect(invoice.id)}
					       className="h-3.5 w-3.5 rounded border-border accent-foreground cursor-pointer" />
				</div>
			</td>
			<td className="py-2.5 px-3 font-medium">
				<Link href={`/invoices/${invoice.id}`}
				      className={`inline-flex items-center gap-2 text-xs hover:text-foreground transition-colors font-mono ${
					      isChild ? "text-text-gray/50 pl-4" : "text-text-gray/60"
				      }`}>
					{isChild && (
						<svg className="h-3 w-3 shrink-0 text-text-gray/40"
						     viewBox="0 0 16 16"
						     fill="none"
						     stroke="currentColor"
						     strokeWidth="1.5">
							<path d="M4 2v8h8"
							      strokeLinecap="round"
							      strokeLinejoin="round" />
						</svg>
					)}
					{invoice.parse_status === "pending" || invoice.parse_status === "parsing" ? (
						<span className="relative shrink-0 flex h-1.5 w-1.5">
							<span className="absolute inset-0 rounded-full bg-amber-400 animate-ping opacity-75" />
							<span className="relative rounded-full h-1.5 w-1.5 bg-amber-400" />
						</span>
					) : (
						<span className={`h-1.5 w-1.5 shrink-0 rounded-full ${
							invoice.parse_status === "failed"
								? "bg-red-500"
								: !invoice.is_parsed
									? "bg-gray-300"
									: invoice.is_validated && invoice.is_paid
										? "bg-green-500"
										: invoice.is_validated
											? "bg-amber-500"
											: "bg-blue-400"
						}`} />
					)}
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
				{fmtDate(invoice.invoice_date)}
			</td>
			<td className={`py-2.5 px-3 text-right text-[13px] tabular-nums ${invoice.gross_eur == null ? "text-text-gray/40" : ""}`}>
				{money(invoice.gross_eur, "eur")}
			</td>
			<td className={`py-2.5 px-3 text-right text-[13px] tabular-nums ${invoice.gross_usd == null ? "text-text-gray/40" : ""}`}>
				{money(invoice.gross_usd, "usd")}
			</td>
			<td className="py-2.5 px-3 text-right text-[13px] text-text-gray tabular-nums">
				{invoice.stone_count}
			</td>
			<td className="py-2.5 px-3 w-8">
				{invoice.type === "credit_note" ? (
					<svg className="h-3.5 w-3.5 text-amber-500"
					     fill="none"
					     viewBox="0 0 24 24"
					     stroke="currentColor">
						<title>Credit note</title>
						<path strokeLinecap="round"
						      strokeLinejoin="round"
						      strokeWidth={1.5}
						      d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
					</svg>
				) : invoice.type === "issued" ? (
					<svg className="h-3.5 w-3.5 text-blue-500"
					     fill="none"
					     viewBox="0 0 24 24"
					     stroke="currentColor">
						<title>Issued</title>
						<path strokeLinecap="round"
						      strokeLinejoin="round"
						      strokeWidth={1.5}
						      d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
					</svg>
				) : (
					<svg className="h-3.5 w-3.5 text-emerald-500"
					     fill="none"
					     viewBox="0 0 24 24"
					     stroke="currentColor">
						<title>Received</title>
						<path strokeLinecap="round"
						      strokeLinejoin="round"
						      strokeWidth={1.5}
						      d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
					</svg>
				)}
			</td>
			<td className="py-2.5 px-3">
				{!isChild && (
					archivingId === invoice.id ? (
						<div className="flex items-center justify-center">
							<div className="h-4 w-4 rounded-full border-2 border-text-gray/40 border-t-text-gray animate-spin" />
						</div>
					) : (
						<button type="button"
						        onClick={() => onArchive(invoice.id)}
						        className="text-text-gray hover:text-foreground transition-colors opacity-0 group-hover:opacity-100"
						        aria-label={isArchived ? "Unarchive invoice" : "Archive invoice"}>
							{isArchived ? (
								<svg className="h-4 w-4"
								     fill="none"
								     viewBox="0 0 24 24"
								     stroke="currentColor">
									<path strokeLinecap="round"
									      strokeLinejoin="round"
									      strokeWidth={1.5}
									      d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.731l3.181 3.182m0-4.991v4.99" />
								</svg>
							) : (
								<svg className="h-4 w-4"
								     fill="none"
								     viewBox="0 0 24 24"
								     stroke="currentColor">
									<path strokeLinecap="round"
									      strokeLinejoin="round"
									      strokeWidth={1.5}
									      d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
								</svg>
							)}
						</button>
					)
				)}
			</td>
		</tr>
	);
}


export function InvoiceListClient({ initialData, stats }: InvoiceListClientProps) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	const isArchived = searchParams.get("is_archived") === "1";
	const currentPage = parseInt(searchParams.get("page") || "1", 10);
	const currentSortBy = searchParams.get("sort_by") || "";
	const currentSortDir = searchParams.get("sort_dir") || "";
	const currentSearch = searchParams.get("q") || "";

	const [search, setSearch] = useState(currentSearch);
	const debouncedSearch = useDebounce(search, 300);

	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const [archivingId, setArchivingId] = useState<string | null>(null);
	const [isMarkingPaid, setIsMarkingPaid] = useState(false);
	const [isUploading, setIsUploading] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const checkboxRef = useRef<HTMLInputElement>(null);

	const { data: invoices, creditNotes = {}, total, totalPages } = initialData;
	const showPagination = totalPages > 1;

	const allPageIds = useMemo(() => {
		const ids = invoices.map((inv) => inv.id);
		for (const children of Object.values(creditNotes)) {
			for (const cn of children) ids.push(cn.id);
		}
		return ids;
	}, [invoices, creditNotes]);

	const allOnPageSelected = allPageIds.length > 0 && allPageIds.every((id) => selectedIds.has(id));
	const someSelected = selectedIds.size > 0;

	const parsingInvoiceIds = useMemo(
		() => invoices
			.filter((inv) => inv.parse_status === "pending" || inv.parse_status === "parsing")
			.map((inv) => inv.id),
		[invoices],
	);
	const hasParsingInvoices = parsingInvoiceIds.length > 0;


	useEffect(() => {
		setSelectedIds(new Set());
	}, [currentPage]);

	useEffect(() => {
		if (checkboxRef.current) {
			checkboxRef.current.indeterminate = someSelected && !allOnPageSelected;
		}
	}, [someSelected, allOnPageSelected]);

	useEffect(() => {
		if (!hasParsingInvoices) return;

		const interval = setInterval(async () => {
			try {
				const res = await fetch("/api/invoices/batch-status", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ ids: parsingInvoiceIds }),
				});
				if (!res.ok) return;

				const statuses: { id: string; parse_status: string }[] = await res.json();
				const anyChanged = statuses.some(
					(s) => s.parse_status === "completed" || s.parse_status === "failed"
				);

				if (anyChanged) router.refresh();
			} catch {}
		}, 3000);

		return () => clearInterval(interval);
	}, [hasParsingInvoices, parsingInvoiceIds, router]);


	const qs = useCallback((params: Record<string, string | number | boolean>) => createQueryString(params, searchParams), [searchParams]);

	useEffect(() => {
		if (debouncedSearch !== currentSearch) {
			const query = qs({ q: debouncedSearch, page: 1 });
			router.push(`${pathname}${query ? `?${query}` : ""}`);
		}
	}, [debouncedSearch, currentSearch, qs, pathname, router]);

	const handlePageChange = (newPage: number) => {
		const query = qs({ page: newPage });
		router.push(`${pathname}${query ? `?${query}` : ""}`);
	};

	const handleSort = (column: SortColumn) => {
		let newDir = "asc";
		if (currentSortBy === column) {
			if (currentSortDir === "asc") newDir = "desc";
			else if (currentSortDir === "desc") {
				const query = qs({ sort_by: "", sort_dir: "", page: 1 });
				router.push(`${pathname}${query ? `?${query}` : ""}`);
				return;
			}
		}
		const query = qs({ sort_by: column, sort_dir: newDir, page: 1 });
		router.push(`${pathname}${query ? `?${query}` : ""}`);
	};

	const handleSelectAll = () => {
		if (allOnPageSelected) {
			setSelectedIds(new Set());
		} else {
			setSelectedIds(new Set(allPageIds));
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

	const handleArchive = async (id: string) => {
		setArchivingId(id);
		try {
			const response = await fetch(`/api/invoices/${id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ is_archived: !isArchived }),
			});
			if (!response.ok) throw new Error("Failed to update invoice");
			setSelectedIds((prev) => {
				const next = new Set(prev);
				next.delete(id);
				return next;
			});
			router.refresh();
		} catch {
			toast.error("Failed to update invoice. Please try again.");
		} finally {
			setArchivingId(null);
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

	const handleBulkArchive = async () => {
		setArchivingId("bulk");
		try {
			const response = await fetch("/api/invoices/bulk-archive", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ ids: [...selectedIds] }),
			});
			if (!response.ok) throw new Error("Failed to archive invoices");
			setSelectedIds(new Set());
			router.refresh();
		} catch {
			toast.error("Failed to archive invoices. Please try again.");
		} finally {
			setArchivingId(null);
		}
	};


	function renderSortableHeader(column: SortColumn, label: string, className?: string) {
		const isActive = currentSortBy === column;
		return (
			<th className={`py-2 px-3 text-[11px] font-normal text-text-gray tracking-wide ${className || ""}`}>
				<button type="button"
				        onClick={() => handleSort(column)}
				        className="inline-flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer">
					{label}
					<SortArrow active={isActive}
					           direction={currentSortDir} />
				</button>
			</th>
		);
	}


	return (
		<div className="min-h-screen relative pt-16">
			<BackgroundTexture />

			<section className="relative py-12 px-4 sm:px-6 lg:px-8 z-10">
				<div className="max-w-6xl mx-auto">
					<PageHeader title="Invoices"
					            subtitle={`${total} invoice${total !== 1 ? "s" : ""}`}
					            actions={
						            !isArchived ? (
							            <>
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
							            </>
						            ) : undefined
					            } />

					<div className="flex items-center gap-4 mb-4 text-[13px] border-b border-border-light">
						<Link href="/invoices"
						      className={`pb-2.5 transition-colors border-b-2 -mb-px ${
							      !isArchived
								      ? "border-foreground text-foreground font-medium"
								      : "border-transparent text-text-gray hover:text-foreground"
						      }`}>
							All
						</Link>
						<Link href="/invoices?is_archived=1"
						      className={`pb-2.5 transition-colors border-b-2 -mb-px ${
							      isArchived
								      ? "border-foreground text-foreground font-medium"
								      : "border-transparent text-text-gray hover:text-foreground"
						      }`}>
							Archived
						</Link>
					</div>

					<div className="flex items-center gap-3">
						<div className="flex-1 max-w-sm">
							<SearchInput value={search}
							             onChange={(e) => setSearch(e.target.value)}
							             onClear={() => setSearch("")}
							             placeholder="Search invoices..." />
						</div>
						<div className="hidden sm:flex items-center gap-3 ml-auto text-[13px] text-text-gray tabular-nums">
							<span>{money(stats.total_eur || null, "eur")} invested</span>
							<span className="text-border-light">|</span>
							<span>{money(stats.total_revenue || null, "usd")} revenue</span>
							<span className="text-border-light">|</span>
							<span>{stats.parsed_count} parsed</span>
							<span className="text-border-light">|</span>
							<span>{stats.validated_count} validated</span>
						</div>
					</div>

					<div className="hidden sm:flex items-center justify-end gap-1.5 mt-2 mb-5 text-[11px] text-text-gray/60">
						<span className="inline-flex items-center gap-1">
							<span className="h-1.5 w-1.5 rounded-full bg-gray-300" />
							New
						</span>
						<svg className="h-2.5 w-2.5 text-border" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
						</svg>
						<span className="inline-flex items-center gap-1">
							<span className="relative flex h-1.5 w-1.5">
								<span className="absolute inset-0 rounded-full bg-amber-400 animate-ping opacity-75" />
								<span className="relative rounded-full h-1.5 w-1.5 bg-amber-400" />
							</span>
							Parsing
						</span>
						<svg className="h-2.5 w-2.5 text-border" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
						</svg>
						<span className="inline-flex items-center gap-1">
							<span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
							Parsed
						</span>
						<svg className="h-2.5 w-2.5 text-border" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
						</svg>
						<span className="inline-flex items-center gap-1">
							<span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
							Validated
						</span>
						<svg className="h-2.5 w-2.5 text-border" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
						</svg>
						<span className="inline-flex items-center gap-1">
							<span className="h-1.5 w-1.5 rounded-full bg-green-500" />
							Complete
						</span>
						<span className="mx-1 text-border-light">·</span>
						<span className="inline-flex items-center gap-1">
							<span className="h-1.5 w-1.5 rounded-full bg-red-500" />
							Failed
						</span>
					</div>


					{invoices.length === 0 ? (
						<div className="rounded-md border border-border py-16 px-8 text-center">
							<p className="text-text-gray">
								{currentSearch
									? "No invoices match your search criteria"
									: isArchived
										? "No archived invoices."
										: "No invoices yet. Upload your first invoice."}
							</p>
						</div>
					) : (
						<>
							<div className="rounded-md border border-border overflow-hidden">
								<div className="overflow-x-auto">
								<table className="w-full text-sm">
									<thead>
										<tr className="border-b border-border text-left bg-background-creme/30">
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
											<th className="py-2 px-3 text-[11px] font-normal text-text-gray tracking-wide text-right">Items</th>
											<th className="py-2 px-3 w-8"></th>
											<th className="py-2 px-3 w-10"></th>
										</tr>
									</thead>
									<tbody key={`${currentPage}-${currentSortBy}-${currentSortDir}-${currentSearch}-${total}`}>
										{invoices.map((invoice) => (
											<React.Fragment key={invoice.id}>
												<InvoiceRow invoice={invoice}
												            isArchived={isArchived}
												            selectedIds={selectedIds}
												            someSelected={someSelected}
												            archivingId={archivingId}
												            onSelect={handleSelectOne}
												            onArchive={handleArchive} />
												{(creditNotes[invoice.id] || []).map((cn) => (
													<InvoiceRow key={cn.id}
													            invoice={cn}
													            isChild
													            isArchived={isArchived}
													            selectedIds={selectedIds}
													            someSelected={someSelected}
													            archivingId={archivingId}
													            onSelect={handleSelectOne}
													            onArchive={handleArchive} />
												))}
											</React.Fragment>
										))}
									</tbody>
								</table>
								</div>
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
				        disabled={archivingId === "bulk"}
				        onClick={handleBulkArchive}>
					<svg className="h-3.5 w-3.5 mr-1 text-text-gray"
					     fill="none"
					     viewBox="0 0 24 24"
					     stroke="currentColor">
						<path strokeLinecap="round"
						      strokeLinejoin="round"
						      strokeWidth={1.5}
						      d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
					</svg>
					Archive
				</Button>
			</BulkActionBar>

		</div>
	);
}
