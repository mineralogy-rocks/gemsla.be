import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { PaginatedReportListResponse, ReportListItem } from "@/app/api/reports/types";

export type FilterType = "all" | "public" | "private";

interface FetchReportsListParams {
	page?: number;
	limit?: number;
	search?: string;
	filter?: FilterType;
}


export const fetchReportsList = cache(async ({
	page = 1,
	limit = 12,
	search = "",
	filter = "all",
}: FetchReportsListParams): Promise<PaginatedReportListResponse> => {
	const supabase = await createClient();

	let query = supabase
		.from("reports")
		.select("id, title, first_name, last_name, public, description, created_at, report_images(id)", { count: "exact" });

	if (search) {
		query = query.or(
			`title.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%,owner_email.ilike.%${search}%`
		);
	}

	if (filter === "public") {
		query = query.eq("public", true);
	} else if (filter === "private") {
		query = query.eq("public", false);
	}

	const offset = (page - 1) * limit;
	const { data, count, error } = await query
		.order("created_at", { ascending: false })
		.range(offset, offset + limit - 1);

	if (error) {
		console.error("Error fetching reports:", error);
		return {
			data: [],
			total: 0,
			page,
			limit,
			totalPages: 0,
		};
	}

	const reportListItems: ReportListItem[] = (data || []).map((report) => ({
		id: report.id,
		title: report.title,
		first_name: report.first_name,
		last_name: report.last_name,
		public: report.public,
		description: report.description,
		created_at: report.created_at,
		imageCount: Array.isArray(report.report_images) ? report.report_images.length : 0,
	}));

	return {
		data: reportListItems,
		total: count || 0,
		page,
		limit,
		totalPages: Math.ceil((count || 0) / limit),
	};
});
