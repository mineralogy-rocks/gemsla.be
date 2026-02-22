import { redirect, notFound } from "next/navigation";
import { getAdminUser } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { fetchAllTags } from "@/app/blog/lib/queries";
import { resolveContentImageUrls } from "@/app/blog/lib/content-images";
import { BlogPostForm } from "../../admin/BlogPostForm";
import type { BlogPost } from "@/app/api/blog/types";

interface EditBlogPostPageProps {
	params: Promise<{ slug: string }>;
}

export const metadata = {
	title: "Edit Post",
};

export default async function EditBlogPostPage({ params }: EditBlogPostPageProps) {
	const adminUser = await getAdminUser();

	if (!adminUser) {
		redirect("/auth/sign-in");
	}

	const { slug } = await params;
	const supabase = await createClient();

	const { data: post, error } = await supabase
		.from("blog_posts")
		.select("*, blog_post_tags(blog_tags(*))")
		.eq("slug", slug)
		.single();

	if (error || !post) {
		notFound();
	}

	let resolvedPost = post;
	if (post.content) {
		const content = await resolveContentImageUrls(supabase, post.content as Record<string, unknown>);
		resolvedPost = { ...post, content } as typeof post;
	}

	const tags = await fetchAllTags();

	return (
		<BlogPostForm mode="edit"
									initialData={resolvedPost as BlogPost}
									availableTags={tags} />
	);
}
