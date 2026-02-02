import { z } from "zod";

// Validation schemas
export const createReportSchema = z.object({
	title: z.string().min(1, "Title is required").max(255),
	description: z.string().optional().nullable(),
	note: z.string().optional().nullable(),
	first_name: z.string().min(1, "First name is required").max(100),
	last_name: z.string().min(1, "Last name is required").max(100),
	owner_email: z.string().email("Invalid email format"),
	public: z.boolean().default(false),
	images: z.array(z.object({
		image_url: z.string().url("Invalid image URL"),
		display_order: z.number().int().min(0).default(0),
	})).optional().default([]),
});

export const updateReportSchema = createReportSchema.partial();

export type CreateReportInput = z.infer<typeof createReportSchema>;
export type UpdateReportInput = z.infer<typeof updateReportSchema>;

// Response types
export interface ReportImage {
	id: string;
	report_id: string;
	image_url: string;
	display_order: number;
	created_at: string;
}

export interface Report {
	id: string;
	title: string;
	description: string | null;
	note: string | null;
	owner_id: string | null;
	first_name: string;
	last_name: string;
	owner_email: string;
	public: boolean;
	created_at: string;
	updated_at: string;
	report_images?: ReportImage[];
}

export interface PaginatedReportsResponse {
	data: Report[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
}
