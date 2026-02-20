import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { PaginatedBlogPostsResponse, BlogPostListItem, BlogPost, BlogTag } from "@/app/api/blog/types";

interface FetchPostsParams {
	page?: number;
	limit?: number;
	q?: string;
	tag?: string;
	includeUnpublished?: boolean;
}

export const fetchPosts = cache(async ({
	page = 1,
	limit = 10,
	q = "",
	tag = "",
	includeUnpublished = false,
}: FetchPostsParams): Promise<PaginatedBlogPostsResponse> => {
	const supabase = await createClient();

	let query = supabase
		.from("blog_posts")
		.select("id, title, slug, excerpt, is_published, published_at, views, created_at, updated_at, blog_post_tags(blog_tags(*))", { count: "exact" });

	if (!includeUnpublished) {
		query = query.eq("is_published", true).lte("published_at", new Date().toISOString());
	}

	if (q) {
		query = query.ilike("title", `%${q}%`);
	}

	if (tag) {
		const { data: tagData } = await supabase
			.from("blog_tags")
			.select("id")
			.eq("slug", tag)
			.single();

		if (tagData) {
			const { data: postIds } = await supabase
				.from("blog_post_tags")
				.select("post_id")
				.eq("tag_id", tagData.id);

			if (postIds && postIds.length > 0) {
				query = query.in("id", postIds.map((pt) => pt.post_id));
			} else {
				return { data: [], total: 0, page, limit, totalPages: 0 };
			}
		}
	}

	const offset = (page - 1) * limit;
	const { data, count, error } = await query
		.order(includeUnpublished ? "updated_at" : "published_at", { ascending: false, nullsFirst: false })
		.range(offset, offset + limit - 1);

	if (error) {
		console.error("Error fetching posts:", error);
		return { data: [], total: 0, page, limit, totalPages: 0 };
	}

	const items: BlogPostListItem[] = (data || []).map((post) => ({
		id: post.id,
		title: post.title,
		slug: post.slug,
		excerpt: post.excerpt,
		is_published: post.is_published,
		published_at: post.published_at,
		views: post.views,
		created_at: post.created_at,
		updated_at: post.updated_at,
		tags: ((post as Record<string, unknown>).blog_post_tags as Array<Record<string, unknown>> || []).map(
			(pt) => pt.blog_tags as BlogTag
		).filter(Boolean),
	}));

	return {
		data: items,
		total: count || 0,
		page,
		limit,
		totalPages: Math.ceil((count || 0) / limit),
	};
});

export const fetchPostBySlug = cache(async (slug: string): Promise<BlogPost | null> => {
	const supabase = await createClient();

	const { data, error } = await supabase
		.from("blog_posts")
		.select("*, blog_post_tags(blog_tags(*))")
		.eq("slug", slug)
		.single();

	if (error || !data) {
		return null;
	}

	return data as BlogPost;
});

export const fetchAllTags = cache(async (): Promise<BlogTag[]> => {
	const supabase = await createClient();

	const { data, error } = await supabase
		.from("blog_tags")
		.select("*")
		.order("name", { ascending: true });

	if (error) {
		console.error("Error fetching tags:", error);
		return [];
	}

	return data || [];
});
