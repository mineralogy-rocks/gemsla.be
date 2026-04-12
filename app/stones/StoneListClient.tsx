"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

import { staggerContainer, staggerItem } from "@/app/lib/animations";
import { useDebounce } from "@/app/lib/hooks/useDebounce";
import { createQueryString } from "@/app/lib/queryString";
import { money, fmtDate } from "@/app/lib/format";
import { BackgroundTexture } from "@/app/components/BackgroundTexture";
import { Button } from "../components/Button";
import { Checkbox } from "../components/Checkbox";
import { PageHeader } from "../components/PageHeader";
import { Pagination } from "../components/Pagination";
import { SearchInput } from "../components/SearchInput";
import { Input } from "../components/Input";
import { DeleteDialog } from "../components/DeleteDialog";
import type { StoneListItem, PaginatedStonesResponse } from "../api/stones/types";

interface StoneListClientProps {
	initialData: PaginatedStonesResponse;
}

function StoneCard({ stone, onDelete }: { stone: StoneListItem; onDelete: (stone: StoneListItem) => void }) {
	return (
		<motion.div variants={staggerItem}
		            className="h-full">
			<Link href={`/stones/${stone.id}`}
			      prefetch={false}
			      className="glass-card group flex h-full flex-col p-5">
				<div className="flex items-start justify-between gap-3">
					<div className="min-w-0 flex-1">
						<h3 className="text-lg font-medium text-foreground transition-colors group-hover:text-foreground-muted">
							{stone.name}
						</h3>
						{stone.stone_type && (
							<p className="text-sm text-text-gray mt-0.5">{stone.stone_type}</p>
						)}
					</div>
					<span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
						stone.is_sold
							? "bg-gray-100 text-gray-800 border"
							: "bg-green-100 text-green-800 border"
					}`}>
						{stone.is_sold ? "Sold" : "Available"}
					</span>
				</div>

				<div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-text-gray">
					{stone.color && <span>{stone.color}</span>}
					{stone.weight_carats && <span>{stone.weight_carats} ct</span>}
					{stone.country && <span>{stone.country}</span>}
				</div>

				<div className="mt-auto flex items-center justify-between gap-4 pt-4 text-xs text-text-gray">
					<span className="text-base font-medium text-foreground">
						{money(stone.selling_price, "usd")}
					</span>
					<div className="flex shrink-0 items-center gap-4">
						<span>{fmtDate(stone.created_at)}</span>
						<button type="button"
						        onClick={(e) => {
							        e.preventDefault();
							        e.stopPropagation();
							        onDelete(stone);
						        }}
						        className="text-text-gray hover:text-red-600 transition-colors"
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
					</div>
				</div>
			</Link>
		</motion.div>
	);
}

export function StoneListClient({ initialData }: StoneListClientProps) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	const currentPage = parseInt(searchParams.get("page") || "1", 10);
	const currentSearch = searchParams.get("q") || "";
	const currentMinPrice = searchParams.get("min_price") || "";
	const currentMaxPrice = searchParams.get("max_price") || "";
	const currentShowSold = searchParams.get("show_sold") === "true";

	const [search, setSearch] = useState(currentSearch);
	const [minPrice, setMinPrice] = useState(currentMinPrice);
	const [maxPrice, setMaxPrice] = useState(currentMaxPrice);
	const debouncedSearch = useDebounce(search, 300);
	const debouncedMinPrice = useDebounce(minPrice, 500);
	const debouncedMaxPrice = useDebounce(maxPrice, 500);

	const [deleteTarget, setDeleteTarget] = useState<StoneListItem | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);
	const qs = useCallback((params: Record<string, string | number | boolean>) => createQueryString(params, searchParams), [searchParams]);

	useEffect(() => {
		if (debouncedSearch !== currentSearch) {
			const query = qs({ q: debouncedSearch, page: 1 });
			router.push(`${pathname}${query ? `?${query}` : ""}`);
		}
	}, [debouncedSearch, currentSearch, qs, pathname, router]);

	useEffect(() => {
		if (debouncedMinPrice !== currentMinPrice) {
			const query = qs({ min_price: debouncedMinPrice, page: 1 });
			router.push(`${pathname}${query ? `?${query}` : ""}`);
		}
	}, [debouncedMinPrice, currentMinPrice, qs, pathname, router]);

	useEffect(() => {
		if (debouncedMaxPrice !== currentMaxPrice) {
			const query = qs({ max_price: debouncedMaxPrice, page: 1 });
			router.push(`${pathname}${query ? `?${query}` : ""}`);
		}
	}, [debouncedMaxPrice, currentMaxPrice, qs, pathname, router]);

	const handleShowSoldChange = () => {
		const query = qs({ show_sold: !currentShowSold, page: 1 });
		router.push(`${pathname}${query ? `?${query}` : ""}`);
	};

	const handlePageChange = (newPage: number) => {
		const query = qs({ page: newPage });
		router.push(`${pathname}${query ? `?${query}` : ""}`);
	};

	const handleDelete = async () => {
		if (!deleteTarget) return;
		setIsDeleting(true);
		try {
			const response = await fetch(`/api/stones/${deleteTarget.id}`, { method: "DELETE" });
			if (!response.ok) throw new Error("Failed to delete stone");
			router.refresh();
		} catch {
			toast.error("Failed to delete stone. Please try again.");
		} finally {
			setIsDeleting(false);
			setDeleteTarget(null);
		}
	};

	const { data: stones, total, totalPages } = initialData;
	const showPagination = totalPages > 1;

	return (
		<div className="min-h-screen relative pt-16">
			<BackgroundTexture />

			<section className="relative py-12 px-4 sm:px-6 lg:px-8 z-10">
				<div className="max-w-6xl mx-auto">
					<PageHeader title="Stones"
					            subtitle={`Manage stone inventory (${total} total)`} />

					<div className="flex justify-end my-6">
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
					</div>

					<div className="flex flex-col gap-4 mb-6">
						<SearchInput value={search}
						             onChange={(e) => setSearch(e.target.value)}
						             onClear={() => setSearch("")}
						             placeholder="Search by name, type, color, country..." />

						<div className="flex flex-wrap items-end gap-4">
							<div className="w-32">
								<Input size="sm"
								       type="number"
								       min="0"
								       step="0.01"
								       placeholder="Min price"
								       value={minPrice}
								       onChange={(e) => setMinPrice(e.target.value)} />
							</div>
							<div className="w-32">
								<Input size="sm"
								       type="number"
								       min="0"
								       step="0.01"
								       placeholder="Max price"
								       value={maxPrice}
								       onChange={(e) => setMaxPrice(e.target.value)} />
							</div>
							<Checkbox label="Show sold"
							          checked={currentShowSold}
							          onChange={handleShowSoldChange} />
						</div>
					</div>

					{stones.length === 0 ? (
						<div className="rounded-lg border border-border bg-background-creme p-12 text-center">
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
								{currentSearch || currentMinPrice || currentMaxPrice
									? "No stones match your search criteria"
									: "No stones yet. Add your first stone!"}
							</p>
							{!(currentSearch || currentMinPrice || currentMaxPrice) && (
								<Link href="/stones/new"
								      className="mt-4 inline-block text-sm font-medium text-callout-accent hover:underline">
									Add Stone
								</Link>
							)}
						</div>
					) : (
						<>
							<motion.div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
							            variants={staggerContainer}
							            initial="hidden"
							            animate="visible"
							            key={`${currentPage}-${currentSearch}-${currentShowSold}`}>
								{stones.map((stone) => (
									<StoneCard key={stone.id}
									           stone={stone}
									           onDelete={setDeleteTarget} />
								))}
							</motion.div>

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

			<DeleteDialog isOpen={!!deleteTarget}
			              onClose={() => setDeleteTarget(null)}
			              onConfirm={handleDelete}
			              title="Delete Stone"
			              message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
			              isPending={isDeleting} />

		</div>
	);
}
