import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/supabase/admin";
import { updateBlogPostSchema } from "../types";
import { stripContentImageUrls } from "@/app/blog/lib/content-images";

interface RouteParams {
	params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
	try {
		const { id } = await params;

		const supabase = await createClient();
		const admin = await isAdmin();

		const { data: post, error } = await supabase
			.from("blog_posts")
			.select("*, blog_post_tags(blog_tags(*))")
			.eq("id", id)
			.single();

		if (error || !post) {
			return NextResponse.json(
				{ error: "Post not found" },
				{ status: 404 }
			);
		}

		if (!post.is_published && !admin) {
			return NextResponse.json(
				{ error: "Post not found" },
				{ status: 404 }
			);
		}

		return NextResponse.json(post);
	} catch (error) {
		console.error("Blog post GET error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
	try {
		const admin = await isAdmin();
		if (!admin) {
			return NextResponse.json(
				{ error: "Unauthorized" },
				{ status: 401 }
			);
		}

		const { id } = await params;
		const body = await request.json();
		const validation = updateBlogPostSchema.safeParse(body);

		if (!validation.success) {
			return NextResponse.json(
				{ error: "Validation failed", details: validation.error.flatten() },
				{ status: 400 }
			);
		}

		const { tag_ids, ...postData } = validation.data;

		if (postData.content) {
			postData.content = stripContentImageUrls(postData.content as Record<string, unknown>);
		}

		const supabase = await createClient();

		const { data: existing, error: findError } = await supabase
			.from("blog_posts")
			.select("id")
			.eq("id", id)
			.single();

		if (findError || !existing) {
			return NextResponse.json(
				{ error: "Post not found" },
				{ status: 404 }
			);
		}

		if (Object.keys(postData).length > 0) {
			const { error: updateError } = await supabase
				.from("blog_posts")
				.update(postData)
				.eq("id", id);

			if (updateError) {
				console.error("Error updating blog post:", updateError);
				if (updateError.code === "23505") {
					return NextResponse.json(
						{ error: "A post with this slug already exists" },
						{ status: 409 }
					);
				}
				return NextResponse.json(
					{ error: "Failed to update blog post" },
					{ status: 500 }
				);
			}
		}

		if (tag_ids !== undefined) {
			await supabase
				.from("blog_post_tags")
				.delete()
				.eq("post_id", id);

			if (tag_ids.length > 0) {
				const tagRecords = tag_ids.map((tag_id) => ({
					post_id: id,
					tag_id,
				}));

				const { error: tagsError } = await supabase
					.from("blog_post_tags")
					.insert(tagRecords);

				if (tagsError) {
					console.error("Error updating tags:", tagsError);
				}
			}
		}

		const { data: updatedPost, error: fetchError } = await supabase
			.from("blog_posts")
			.select("*, blog_post_tags(blog_tags(*))")
			.eq("id", id)
			.single();

		if (fetchError) {
			return NextResponse.json(
				{ error: "Failed to fetch updated post" },
				{ status: 500 }
			);
		}

		return NextResponse.json(updatedPost);
	} catch (error) {
		console.error("Blog post PUT error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
	try {
		const admin = await isAdmin();
		if (!admin) {
			return NextResponse.json(
				{ error: "Unauthorized" },
				{ status: 401 }
			);
		}

		const { id } = await params;
		const supabase = await createClient();

		const { error: deleteError } = await supabase
			.from("blog_posts")
			.delete()
			.eq("id", id);

		if (deleteError) {
			console.error("Error deleting blog post:", deleteError);
			return NextResponse.json(
				{ error: "Failed to delete blog post" },
				{ status: 500 }
			);
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Blog post DELETE error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
