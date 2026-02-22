import { z } from "zod";

// Validation schemas
export const createReportSchema = z.object({
	title: z.string().min(1, "Title is required").max(255),
	stone: z.string().min(1, "Stone is required").max(200),
	description: z.string().optional().nullable(),
	note: z.string().optional().nullable(),
	first_name: z.string().max(100).optional().nullable(),
	last_name: z.string().max(100).optional().nullable(),
	owner_email: z.string().email("Invalid email format").optional().nullable(),
	public: z.boolean().default(false),
	images: z.array(z.object({
		image_url: z.string().min(1, "Image path is required"),
		display_order: z.number().int().min(0).default(0),
		title: z.string().optional().nullable(),
		caption: z.string().optional().nullable(),
		is_headline: z.boolean().optional().default(false),
	})).optional().default([]),
	// Gemological fields
	shape_cutting_style: z.string().optional().nullable(),
	measurements: z.string().optional().nullable(),
	carat_weight: z.number().min(0).optional().nullable(),
	specific_gravity: z.string().optional().nullable(),
	refractive_index: z.string().optional().nullable(),
	double_refraction: z.string().optional().nullable(),
	polariscope: z.string().optional().nullable(),
	pleochroism: z.string().optional().nullable(),
	chelsea_color_filter: z.string().optional().nullable(),
	fluorescence_sw: z.string().optional().nullable(),
	fluorescence_lw: z.string().optional().nullable(),
	microscope: z.string().optional().nullable(),
	treatment: z.string().optional().nullable(),
	origin: z.string().optional().nullable(),
	// Admin-only fields
	owner_telephone: z.string().optional().nullable(),
	currency: z.enum(["USD", "EUR", "UAH"]).optional().nullable(),
	price: z.number().min(0).optional().nullable(),
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
	title: string | null;
	caption: string | null;
	is_headline: boolean;
	created_at: string;
	signed_url?: string;
}

export interface Report {
	id: string;
	title: string;
	stone: string;
	description: string | null;
	note: string | null;
	owner_id: string | null;
	first_name: string | null;
	last_name: string | null;
	owner_email: string | null;
	public: boolean;
	created_at: string;
	updated_at: string;
	report_images?: ReportImage[];
	// Gemological fields
	shape_cutting_style: string | null;
	measurements: string | null;
	carat_weight: number | null;
	specific_gravity: string | null;
	refractive_index: string | null;
	double_refraction: string | null;
	polariscope: string | null;
	pleochroism: string | null;
	chelsea_color_filter: string | null;
	fluorescence_sw: string | null;
	fluorescence_lw: string | null;
	microscope: string | null;
	treatment: string | null;
	origin: string | null;
	// Admin-only fields
	owner_telephone: string | null;
	currency: string | null;
	price: number | null;
}

export interface PaginatedReportsResponse {
	data: Report[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
}

export interface ReportListItem {
	id: string;
	title: string;
	stone: string;
	first_name: string | null;
	last_name: string | null;
	public: boolean;
	description: string | null;
	created_at: string;
	imageCount: number; // Computed - avoids serializing full images array
}

export interface PaginatedReportListResponse {
	data: ReportListItem[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
}

export const ADMIN_ONLY_FIELDS = [
	"owner_telephone",
	"currency",
	"price",
	"note",
] as const;
