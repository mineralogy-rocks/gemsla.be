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
import { DeleteDialog } from "../components/DeleteDialog";
import type { StoneListItem, PaginatedStonesResponse } from "../api/stones/types";

interface StoneListClientProps {
	initialData: PaginatedStonesResponse;
}

type SortColumn = "name" | "color" | "weight_carats" | "selling_price" | "sold_price" | "country" | "created_at";


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


function StoneRow({ stone, selectedIds, someSelected, onSelect, onDelete }: {
	stone: StoneListItem;
	selectedIds: Set<string>;
	someSelected: boolean;
	onSelect: (id: string) => void;
	onDelete: (id: string) => void;
}) {
	return (
		<tr className={`border-b border-border-light/60 group transition-colors duration-150 ${
			selectedIds.has(stone.id)
				? "bg-foreground/[0.03]"
				: "hover:bg-background-creme/40"
		}`}>
			<td className="py-2.5 px-3">
				<div className="row-checkbox"
				     data-visible={someSelected || selectedIds.has(stone.id) || undefined}>
					<input type="checkbox"
					       checked={selectedIds.has(stone.id)}
					       onChange={() => onSelect(stone.id)}
					       className="h-3.5 w-3.5 rounded border-border accent-foreground cursor-pointer" />
				</div>
			</td>
			<td className="py-2.5 px-3">
				<Link href={`/stones/${stone.id}`}
				      className="font-medium text-foreground hover:text-foreground-muted transition-colors">
					{stone.name}
				</Link>
				{stone.stone_type && (
					<p className="text-xs text-text-gray mt-0.5">{stone.stone_type}</p>
				)}
			</td>
			<td className="py-2.5 px-3 text-[13px] text-text-gray hidden sm:table-cell">
				{stone.color || "—"}
			</td>
			<td className="py-2.5 px-3 text-[13px] text-text-gray tabular-nums">
				{stone.weight_carats != null ? `${stone.weight_carats} ct` : "—"}
			</td>
			<td className="py-2.5 px-3 text-[13px] text-text-gray hidden md:table-cell">
				{stone.country || "—"}
			</td>
			<td className={`py-2.5 px-3 text-right text-[13px] tabular-nums ${stone.selling_price == null ? "text-text-gray/40" : ""}`}>
				{money(stone.selling_price, "usd")}
			</td>
			<td className={`py-2.5 px-3 text-right text-[13px] tabular-nums hidden lg:table-cell ${stone.sold_price == null ? "text-text-gray/40" : ""}`}>
				{money(stone.sold_price, "usd")}
			</td>
			<td className="py-2.5 px-3">
				<span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
					stone.is_sold
						? "bg-gray-100 text-gray-700 border border-gray-200"
						: "bg-green-50 text-green-700 border border-green-200"
				}`}>
					{stone.is_sold ? "Sold" : "Available"}
				</span>
			</td>
			<td className="py-2.5 px-3 text-[13px] text-text-gray hidden md:table-cell tabular-nums">
				{fmtDate(stone.created_at)}
			</td>
			<td className="py-2.5 px-3">
				<button type="button"
				        onClick={() => onDelete(stone.id)}
				        className="text-text-gray hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
				        aria-label="Delete stone">
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
		</tr>
	);
}


export function StoneListClient({ initialData }: StoneListClientProps) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	const currentPage = parseInt(searchParams.get("page") || "1", 10);
	const currentSortBy = searchParams.get("sort_by") || "";
	const currentSortDir = searchParams.get("sort_dir") || "";
	const currentSearch = searchParams.get("q") || "";
	const isSoldTab = searchParams.get("show_sold") === "1";

	const [search, setSearch] = useState(currentSearch);
	const debouncedSearch = useDebounce(search, 300);

	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);
	const [isBulkDeleting, setIsBulkDeleting] = useState(false);
	const [showBulkDelete, setShowBulkDelete] = useState(false);
	const checkboxRef = useRef<HTMLInputElement>(null);

	const { data: stones, total, totalPages } = initialData;
	const showPagination = totalPages > 1;

	const allPageIds = useMemo(() => stones.map((s) => s.id), [stones]);
	const allOnPageSelected = allPageIds.length > 0 && allPageIds.every((id) => selectedIds.has(id));
	const someSelected = selectedIds.size > 0;


	useEffect(() => {
		setSelectedIds(new Set());
	}, [currentPage]);

	useEffect(() => {
		if (checkboxRef.current) {
			checkboxRef.current.indeterminate = someSelected && !allOnPageSelected;
		}
	}, [someSelected, allOnPageSelected]);


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

	const handleDeleteSingle = async () => {
		if (!deleteTarget) return;
		setIsDeleting(true);
		try {
			const response = await fetch(`/api/stones/${deleteTarget}`, { method: "DELETE" });
			if (!response.ok) throw new Error("Failed to delete stone");
			router.refresh();
		} catch {
			toast.error("Failed to delete stone. Please try again.");
		} finally {
			setIsDeleting(false);
			setDeleteTarget(null);
		}
	};

	const handleBulkDelete = async () => {
		setIsBulkDeleting(true);
		try {
			const response = await fetch("/api/stones/bulk-delete", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ ids: [...selectedIds] }),
			});
			if (!response.ok) throw new Error("Failed to delete stones");
			const result = await response.json();
			toast.success(`Deleted ${result.deleted} stone${result.deleted !== 1 ? "s" : ""}`);
			setSelectedIds(new Set());
			router.refresh();
		} catch {
			toast.error("Failed to delete stones. Please try again.");
		} finally {
			setIsBulkDeleting(false);
			setShowBulkDelete(false);
		}
	};

	const deletingStone = deleteTarget ? stones.find((s) => s.id === deleteTarget) : null;


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
					<PageHeader title="Stones"
					            subtitle={`${total} stone${total !== 1 ? "s" : ""}`}
					            actions={
						            <Link href="/stones/new">
							            <Button variant="primary" size="sm">
								            <svg className="h-3 w-3 mr-0.5"
								                 fill="none"
								                 viewBox="0 0 24 24"
								                 stroke="currentColor">
									            <path strokeLinecap="round"
									                  strokeLinejoin="round"
									                  strokeWidth={2}
									                  d="M12 4v16m8-8H4" />
								            </svg>
								            Add Stone
							            </Button>
						            </Link>
					            } />

					<div className="flex items-center gap-4 mb-4 text-[13px] border-b border-border-light">
						<Link href="/stones"
						      className={`pb-2.5 transition-colors border-b-2 -mb-px ${
							      !isSoldTab
								      ? "border-foreground text-foreground font-medium"
								      : "border-transparent text-text-gray hover:text-foreground"
						      }`}>
							All
						</Link>
						<Link href="/stones?show_sold=1"
						      className={`pb-2.5 transition-colors border-b-2 -mb-px ${
							      isSoldTab
								      ? "border-foreground text-foreground font-medium"
								      : "border-transparent text-text-gray hover:text-foreground"
						      }`}>
							Sold
						</Link>
					</div>

					<div className="flex items-center gap-3 mb-5">
						<div className="flex-1 max-w-sm">
							<SearchInput value={search}
							             onChange={(e) => setSearch(e.target.value)}
							             onClear={() => setSearch("")}
							             placeholder="Search by name, type, color, country..." />
						</div>
					</div>

					{stones.length === 0 ? (
						<div className="rounded-md border border-border py-16 px-8 text-center">
							<svg className="mx-auto h-12 w-12 text-text-gray"
							     fill="none"
							     viewBox="0 0 24 24"
							     stroke="currentColor">
								<path strokeLinecap="round"
								      strokeLinejoin="round"
								      strokeWidth={1.5}
								      d="M20.893 13.393l-1.135-1.135a2.252 2.252 0 01-.421-.585l-1.08-2.16a.414.414 0 00-.663-.107.827.827 0 01-.812.21l-1.273-.363a.89.89 0 00-.738 1.595l.587.39c.59.395.674 1.23.172 1.732l-.2.2c-.212.212-.33.498-.33.796v.41c0 .409-.11.809-.32 1.158l-1.315 2.191a2.11 2.11 0 01-1.81 1.025 1.055 1.055 0 01-1.055-1.055v-1.172c0-.92-.56-1.747-1.414-2.089l-.655-.261a2.25 2.25 0 01-1.383-2.46l.007-.042a2.25 2.25 0 01.29-.787l.09-.15a2.25 2.25 0 012.37-1.048l1.178.236a1.125 1.125 0 001.12-.57l.455-.91a2.25 2.25 0 012.013-1.244h.07a2.25 2.25 0 012.249 2.249v.137a2.25 2.25 0 01-.659 1.591l-.196.196a.375.375 0 00.169.628l.702.14c.256.051.509.115.757.191a.75.75 0 01-.322 1.466z" />
							</svg>
							<p className="mt-4 text-text-gray">
								{currentSearch
									? "No stones match your search criteria"
									: isSoldTab
										? "No sold stones yet."
										: "No stones yet. Add your first stone!"}
							</p>
							{!currentSearch && !isSoldTab && (
								<Link href="/stones/new"
								      className="mt-4 inline-block text-sm font-medium text-callout-accent hover:underline">
									Add Stone
								</Link>
							)}
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
											{renderSortableHeader("name", "Name")}
											{renderSortableHeader("color", "Color", "hidden sm:table-cell")}
											{renderSortableHeader("weight_carats", "Weight")}
											{renderSortableHeader("country", "Country", "hidden md:table-cell")}
											{renderSortableHeader("selling_price", "Selling", "text-right")}
											{renderSortableHeader("sold_price", "Sold Price", "text-right hidden lg:table-cell")}
											<th className="py-2 px-3 text-[11px] font-normal text-text-gray tracking-wide">Status</th>
											{renderSortableHeader("created_at", "Created", "hidden md:table-cell")}
											<th className="py-2 px-3 w-10"></th>
										</tr>
									</thead>
									<tbody key={`${currentPage}-${currentSortBy}-${currentSortDir}-${currentSearch}-${isSoldTab}-${total}`}>
										{stones.map((stone) => (
											<StoneRow key={stone.id}
											          stone={stone}
											          selectedIds={selectedIds}
											          someSelected={someSelected}
											          onSelect={handleSelectOne}
											          onDelete={setDeleteTarget} />
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
				        disabled={isBulkDeleting}
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

			<DeleteDialog isOpen={!!deleteTarget && !showBulkDelete}
			              onClose={() => setDeleteTarget(null)}
			              onConfirm={handleDeleteSingle}
			              title="Delete Stone"
			              message={`Are you sure you want to delete "${deletingStone?.name}"? This action cannot be undone.`}
			              isPending={isDeleting} />

			<DeleteDialog isOpen={showBulkDelete}
			              onClose={() => setShowBulkDelete(false)}
			              onConfirm={handleBulkDelete}
			              title="Delete Stones"
			              message={`Are you sure you want to delete ${selectedIds.size} stone${selectedIds.size !== 1 ? "s" : ""}? This action cannot be undone.`}
			              isPending={isBulkDeleting} />

		</div>
	);
}
