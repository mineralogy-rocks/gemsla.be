"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "../components/Button";
import type { Report, PaginatedReportsResponse } from "../api/reports/types";

type FilterType = "all" | "public" | "private";

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

function ReportCard({ report }: { report: Report }) {
	const imageCount = report.report_images?.length || 0;

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
					<span className={`flex-shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
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
						{imageCount} {imageCount === 1 ? "image" : "images"}
					</span>
					<span>
						{new Date(report.created_at).toLocaleDateString()}
					</span>
				</div>
			</Link>
		</motion.div>
	);
}

export function ReportsListClient() {
	const [reports, setReports] = useState<Report[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [search, setSearch] = useState("");
	const [filter, setFilter] = useState<FilterType>("all");
	const [page, setPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [total, setTotal] = useState(0);

	const debouncedSearch = useDebounce(search, 300);

	const fetchReports = useCallback(async () => {
		setLoading(true);
		setError(null);

		try {
			const params = new URLSearchParams({
				page: page.toString(),
				limit: "12",
				filter,
			});
			if (debouncedSearch) {
				params.set("search", debouncedSearch);
			}

			const response = await fetch(`/api/reports?${params}`);
			const data: PaginatedReportsResponse = await response.json();

			if (!response.ok) {
				throw new Error((data as unknown as { error: string }).error || "Failed to fetch reports");
			}

			setReports(data.data);
			setTotalPages(data.totalPages);
			setTotal(data.total);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to fetch reports");
		} finally {
			setLoading(false);
		}
	}, [page, filter, debouncedSearch]);

	useEffect(() => {
		fetchReports();
	}, [fetchReports]);

	// Reset page when search or filter changes
	useEffect(() => {
		setPage(1);
	}, [debouncedSearch, filter]);

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
								        onClick={() => setFilter(f)}
								        className={`rounded-md px-4 py-2.5 text-sm font-medium capitalize transition-colors ${
									        filter === f
										        ? "bg-foreground text-background"
										        : "border border-border bg-background text-foreground hover:bg-border-light"
								        }`}>
									{f}
								</button>
							))}
						</div>
					</div>

					{/* Content */}
					{loading ? (
						<div className="flex items-center justify-center py-20">
							<svg className="h-8 w-8 animate-spin text-callout-accent"
							     fill="none"
							     viewBox="0 0 24 24">
								<circle className="opacity-25"
								        cx="12"
								        cy="12"
								        r="10"
								        stroke="currentColor"
								        strokeWidth="4" />
								<path className="opacity-75"
								      fill="currentColor"
								      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
							</svg>
						</div>
					) : error ? (
						<div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
							<p className="text-red-600">{error}</p>
							<button onClick={fetchReports}
							        className="mt-4 text-sm font-medium text-red-600 hover:underline">
								Try again
							</button>
						</div>
					) : reports.length === 0 ? (
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
								{debouncedSearch || filter !== "all"
									? "No reports match your search criteria"
									: "No reports yet. Create your first report!"}
							</p>
							{!(debouncedSearch || filter !== "all") && (
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
							            animate="show">
								{reports.map((report) => (
									<ReportCard key={report.id} report={report} />
								))}
							</motion.div>

							{/* Pagination */}
							{totalPages > 1 && (
								<div className="mt-8 flex items-center justify-center gap-2">
									<button onClick={() => setPage((p) => Math.max(1, p - 1))}
									        disabled={page === 1}
									        className="rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-border-light disabled:opacity-50 disabled:cursor-not-allowed">
										Previous
									</button>
									<span className="px-4 text-sm text-text-gray">
										Page {page} of {totalPages}
									</span>
									<button onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
									        disabled={page === totalPages}
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
