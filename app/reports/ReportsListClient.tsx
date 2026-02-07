"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "../components/Button";
import { Checkbox } from "../components/Checkbox";
import { PageHeader } from "../components/PageHeader";
import { Pagination } from "../components/Pagination";
import { SearchInput } from "../components/SearchInput";
import type { ReportListItem, PaginatedReportListResponse } from "../api/reports/types";

type FilterType = "all" | "public" | "private";

interface ReportsListClientProps {
	initialData: PaginatedReportListResponse;
}

const staggerContainer = {
	hidden: { opacity: 0 },
	show: {
		opacity: 1,
		transition: {
			staggerChildren: 0.05,
		},
	},
};

const staggerItem = {
	hidden: { opacity: 0, y: 10 },
	show: { opacity: 1, y: 0 },
};

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

function ReportCard({ report }: { report: ReportListItem }) {
	return (
		<motion.div variants={staggerItem}
		            className="h-full">
			<Link href={`/reports/${report.id}`}
			      className="group flex h-full flex-col rounded-lg border border-border bg-background p-5 transition-all duration-250 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-gold hover:shadow-[0_4px_16px_rgba(196,167,125,0.15),0_1px_4px_rgba(0,0,0,0.05)]">
				<div className="flex items-start justify-between gap-3">
					<h3 className="min-w-0 flex-1 text-lg font-medium text-foreground transition-colors group-hover:text-foreground-muted">
						{report.title}
					</h3>
					<span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
						report.public
							? "border border-gold/60 bg-gold/10 text-foreground-muted"
							: "border border-border bg-background-creme text-text-gray"
					}`}>
						{report.public ? "Public" : "Private"}
					</span>
				</div>

				{report.description && (
					<p className="mt-3 line-clamp-2 text-sm text-text-gray">
						{report.description}
					</p>
				)}

				<div className="mt-auto flex items-center justify-between gap-4 pt-4 text-xs text-text-gray">
					<span className="truncate">
						{report.first_name} {report.last_name}
					</span>
					<div className="flex shrink-0 items-center gap-4">
						<span className="flex items-center gap-1">
							<svg className="h-4 w-4"
							     fill="none"
							     viewBox="0 0 24 24"
							     stroke="currentColor">
								<path strokeLinecap="round"
								      strokeLinejoin="round"
								      strokeWidth={1.5}
								      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
							</svg>
							{report.imageCount} {report.imageCount === 1 ? "image" : "images"}
						</span>
						<span>
							{new Date(report.created_at).toLocaleDateString()}
						</span>
					</div>
				</div>
			</Link>
		</motion.div>
	);
}

export function ReportsListClient({ initialData }: ReportsListClientProps) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	const currentFilter = (searchParams.get("filter") as FilterType) || "all";
	const currentPage = parseInt(searchParams.get("page") || "1", 10);
	const currentSearch = searchParams.get("q") || "";

	const [search, setSearch] = useState(currentSearch);
	const debouncedSearch = useDebounce(search, 300);

	const createQueryString = useCallback((params: Record<string, string | number>) => {
		const urlParams = new URLSearchParams(searchParams.toString());
		Object.entries(params).forEach(([key, value]) => {
			if (value === "all" || value === "" || value === 1) {
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

	const handleFilterChange = (newFilter: FilterType) => {
		setSearch("");
		const query = createQueryString({ filter: newFilter, search: "", page: 1 });
		router.push(`${pathname}${query ? `?${query}` : ""}`);
	};

	const handlePageChange = (newPage: number) => {
		const query = createQueryString({ page: newPage });
		router.push(`${pathname}${query ? `?${query}` : ""}`);
	};

	const { data: reports, total, totalPages } = initialData;
	const showPagination = totalPages > 1;

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
					{/* Header */}
					<PageHeader title="Reports"
					            subtitle={`Manage gem lab reports (${total} total)`} />

					<div className="flex flex-wrap gap-2 justify-end my-6">
						<Link href="/reports/add">
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
								New Report
							</Button>
						</Link>
					</div>

					{/* Search and Filter */}
					<div className="flex flex-col gap-4 mb-6">
						<SearchInput value={search}
						             onChange={(e) => setSearch(e.target.value)}
						             onClear={() => setSearch("")}
						             placeholder="Search by title, name, or email..." />

						<div className="flex gap-4">
							<Checkbox label="All"
							          checked={currentFilter === "all"}
							          onChange={() => handleFilterChange("all")} />
							<Checkbox label="Public"
							          checked={currentFilter === "public"}
							          onChange={() => handleFilterChange("public")} />
							<Checkbox label="Private"
							          checked={currentFilter === "private"}
							          onChange={() => handleFilterChange("private")} />
						</div>
					</div>

					{/* Content */}
					{reports.length === 0 ? (
						<div className="rounded-lg border border-border bg-background-creme p-12 text-center">
							<svg className="mx-auto h-12 w-12 text-text-gray"
							     fill="none"
							     viewBox="0 0 24 24"
							     stroke="currentColor">
								<path strokeLinecap="round"
								      strokeLinejoin="round"
								      strokeWidth={1.5}
								      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
							</svg>
							<p className="mt-4 text-text-gray">
								{currentSearch || currentFilter !== "all"
									? "No reports match your search criteria"
									: "No reports yet. Create your first report!"}
							</p>
							{!(currentSearch || currentFilter !== "all") && (
								<Link href="/reports/add"
								      className="mt-4 inline-block text-sm font-medium text-callout-accent hover:underline">
									Create Report
								</Link>
							)}
						</div>
					) : (
						<>
							<motion.div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
							            variants={staggerContainer}
							            initial="hidden"
							            animate="show"
							            key={`${currentPage}-${currentFilter}-${currentSearch}`}>
								{reports.map((report) => (
									<ReportCard key={report.id} report={report} />
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
		</div>
	);
}
