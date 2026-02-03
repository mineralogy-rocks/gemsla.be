"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "../components/Button";
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
		<motion.div variants={staggerItem}>
			<Link href={`/reports/${report.id}`}
			      className="group block h-full rounded-lg border border-border bg-background p-5 transition-all hover:border-callout-accent hover:shadow-md">
				<div className="flex items-start justify-between gap-3">
					<div className="min-w-0 flex-1">
						<h3 className="truncate text-lg font-medium text-foreground group-hover:text-callout-accent-hover transition-colors">
							{report.title}
						</h3>
						<p className="mt-1 text-sm text-text-gray">
							{report.first_name} {report.last_name}
						</p>
					</div>
					<span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
						report.public
							? "bg-green-100 text-green-800"
							: "bg-gray-100 text-gray-800"
					}`}>
						{report.public ? "Public" : "Private"}
					</span>
				</div>

				{report.description && (
					<p className="mt-3 line-clamp-2 text-sm text-text-gray">
						{report.description}
					</p>
				)}

				<div className="mt-4 flex items-center gap-4 text-xs text-text-gray">
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
			</Link>
		</motion.div>
	);
}

export function ReportsListClient({ initialData }: ReportsListClientProps) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	// Read current state from URL
	const currentFilter = (searchParams.get("filter") as FilterType) || "all";
	const currentPage = parseInt(searchParams.get("page") || "1", 10);
	const currentSearch = searchParams.get("search") || "";

	// Local search state for controlled input (synced to URL via debounce)
	const [search, setSearch] = useState(currentSearch);
	const debouncedSearch = useDebounce(search, 300);

	// Build query string helper
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

	// Sync debounced search to URL
	useEffect(() => {
		if (debouncedSearch !== currentSearch) {
			const query = createQueryString({ search: debouncedSearch, page: 1 });
			router.push(`${pathname}${query ? `?${query}` : ""}`);
		}
	}, [debouncedSearch, currentSearch, createQueryString, pathname, router]);

	// Handle filter change
	const handleFilterChange = (newFilter: FilterType) => {
		setSearch("");
		const query = createQueryString({ filter: newFilter, search: "", page: 1 });
		router.push(`${pathname}${query ? `?${query}` : ""}`);
	};

	// Handle pagination
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
					<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
						<div>
							<h1 className="mb-2">Reports</h1>
							<p className="text-text-gray">
								Manage gem lab reports ({total} total)
							</p>
						</div>
						<Link href="/reports/add">
							<Button variant="primary" size="sm">
								<svg className="h-5 w-5 mr-1"
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
					<div className="flex flex-col sm:flex-row gap-4 mb-6">
						{/* Search */}
						<div className="relative flex-1">
							<svg className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-text-gray"
							     fill="none"
							     viewBox="0 0 24 24"
							     stroke="currentColor">
								<path strokeLinecap="round"
								      strokeLinejoin="round"
								      strokeWidth={1.5}
								      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
							</svg>
							<input type="text"
							       value={search}
							       onChange={(e) => setSearch(e.target.value)}
							       placeholder="Search by title, name, or email..."
							       className="w-full rounded-md border border-border bg-background py-2.5 pl-10 pr-4 text-foreground placeholder:text-text-gray focus:border-callout-accent focus:outline-none focus:ring-2 focus:ring-callout-accent" />
						</div>

						{/* Filter */}
						<div className="flex gap-2">
							{(["all", "public", "private"] as FilterType[]).map((f) => (
								<button key={f}
								        onClick={() => handleFilterChange(f)}
								        className={`rounded-md px-4 py-2.5 text-sm font-medium capitalize transition-colors ${
									        currentFilter === f
										        ? "bg-foreground text-background"
										        : "border border-border bg-background text-foreground hover:bg-border-light"
								        }`}>
									{f}
								</button>
							))}
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

							{/* Pagination */}
							{showPagination && (
								<div className="mt-8 flex items-center justify-center gap-2">
									<button onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
									        disabled={currentPage === 1}
									        className="rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-border-light disabled:opacity-50 disabled:cursor-not-allowed">
										Previous
									</button>
									<span className="px-4 text-sm text-text-gray">
										Page {currentPage} of {totalPages}
									</span>
									<button onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
									        disabled={currentPage === totalPages}
									        className="rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-border-light disabled:opacity-50 disabled:cursor-not-allowed">
										Next
									</button>
								</div>
							)}
						</>
					)}
				</div>
			</section>
		</div>
	);
}