import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/supabase/admin";
import { createBlogPostSchema, type PaginatedBlogPostsResponse, type BlogTag } from "./types";

export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
		const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)));
		const search = searchParams.get("q") || "";
		const tagSlug = searchParams.get("tag") || "";

		const supabase = await createClient();
		const admin = await isAdmin();

		let query = supabase
			.from("blog_posts")
			.select("id, title, slug, excerpt, is_published, published_at, views, created_at, updated_at, blog_post_tags(blog_tags(*))", { count: "exact" });

		if (!admin) {
			query = query.eq("is_published", true).lte("published_at", new Date().toISOString());
		}

		if (search) {
			query = query.ilike("title", `%${search}%`);
		}

		if (tagSlug) {
			const { data: tag } = await supabase
				.from("blog_tags")
				.select("id")
				.eq("slug", tagSlug)
				.single();

			if (tag) {
				const { data: postIds } = await supabase
					.from("blog_post_tags")
					.select("post_id")
					.eq("tag_id", tag.id);

				if (postIds && postIds.length > 0) {
					query = query.in("id", postIds.map((pt) => pt.post_id));
				} else {
					return NextResponse.json({
						data: [],
						total: 0,
						page,
						limit,
						totalPages: 0,
					} satisfies PaginatedBlogPostsResponse);
				}
			}
		}

		const offset = (page - 1) * limit;
		const { data, count, error } = await query
			.order("published_at", { ascending: false, nullsFirst: false })
			.range(offset, offset + limit - 1);

		if (error) {
			console.error("Error fetching blog posts:", error);
			return NextResponse.json(
				{ error: "Failed to fetch blog posts" },
				{ status: 500 }
			);
		}

		const items = (data || []).map((post) => ({
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

		const response: PaginatedBlogPostsResponse = {
			data: items,
			total: count || 0,
			page,
			limit,
			totalPages: Math.ceil((count || 0) / limit),
		};

		return NextResponse.json(response);
	} catch (error) {
		console.error("Blog GET error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}

export async function POST(request: NextRequest) {
	try {
		const admin = await isAdmin();
		if (!admin) {
			return NextResponse.json(
				{ error: "Unauthorized" },
				{ status: 401 }
			);
		}

		const body = await request.json();
		const validation = createBlogPostSchema.safeParse(body);

		if (!validation.success) {
			return NextResponse.json(
				{ error: "Validation failed", details: validation.error.flatten() },
				{ status: 400 }
			);
		}

		const { tag_ids, ...postData } = validation.data;

		const supabase = await createClient();

		const { data: { user } } = await supabase.auth.getUser();

		const insertData: Record<string, unknown> = {
			...postData,
			author_id: user?.id || null,
		};

		if (postData.is_published) {
			insertData.published_at = new Date().toISOString();
		}

		const { data: post, error: postError } = await supabase
			.from("blog_posts")
			.insert(insertData)
			.select()
			.single();

		if (postError) {
			console.error("Error creating blog post:", postError);
			if (postError.code === "23505") {
				return NextResponse.json(
					{ error: "A post with this slug already exists" },
					{ status: 409 }
				);
			}
			return NextResponse.json(
				{ error: "Failed to create blog post" },
				{ status: 500 }
			);
		}

		if (tag_ids.length > 0) {
			const tagRecords = tag_ids.map((tag_id) => ({
				post_id: post.id,
				tag_id,
			}));

			const { error: tagsError } = await supabase
				.from("blog_post_tags")
				.insert(tagRecords);

			if (tagsError) {
				console.error("Error associating tags:", tagsError);
			}
		}

		const { data: completePost } = await supabase
			.from("blog_posts")
			.select("*, blog_post_tags(blog_tags(*))")
			.eq("id", post.id)
			.single();

		return NextResponse.json(completePost || post, { status: 201 });
	} catch (error) {
		console.error("Blog POST error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
