import { z } from "zod";

export const createBlogPostSchema = z.object({
	title: z.string().min(1, "Title is required").max(255),
	slug: z.string().min(1, "Slug is required").max(255),
	content: z.any().default({}),
	excerpt: z.string().optional().nullable(),
	is_published: z.boolean().default(false),
	published_at: z.string().datetime({ offset: true }).optional().nullable(),
	tag_ids: z.array(z.string().uuid()).optional().default([]),
});

export const updateBlogPostSchema = z.object({
	title: z.string().min(1).max(255).optional(),
	slug: z.string().min(1).max(255).optional(),
	content: z.any().optional(),
	excerpt: z.string().optional().nullable(),
	is_published: z.boolean().optional(),
	published_at: z.string().datetime({ offset: true }).optional().nullable(),
	tag_ids: z.array(z.string().uuid()).optional(),
});

export const createBlogTagSchema = z.object({
	name: z.string().min(1, "Name is required").max(100),
	slug: z.string().min(1, "Slug is required").max(100),
});

export type CreateBlogPostInput = z.infer<typeof createBlogPostSchema>;
export type UpdateBlogPostInput = z.infer<typeof updateBlogPostSchema>;
export type CreateBlogTagInput = z.infer<typeof createBlogTagSchema>;

export interface BlogTag {
	id: string;
	name: string;
	slug: string;
	created_at: string;
}

export interface BlogPost {
	id: string;
	title: string;
	slug: string;
	content: Record<string, unknown>;
	excerpt: string | null;
	author_id: string | null;
	published_at: string | null;
	is_published: boolean;
	views: number;
	likes: number;
	created_at: string;
	updated_at: string;
	blog_post_tags?: { blog_tags: BlogTag }[];
}

export interface BlogPostListItem {
	id: string;
	title: string;
	slug: string;
	excerpt: string | null;
	is_published: boolean;
	published_at: string | null;
	views: number;
	created_at: string;
	updated_at: string;
	tags: BlogTag[];
}

export interface PaginatedBlogPostsResponse {
	data: BlogPostListItem[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
}
