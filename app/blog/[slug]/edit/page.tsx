import { redirect, notFound } from "next/navigation";
import { getAdminUser } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { fetchAllTags } from "@/app/blog/lib/queries";
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

	const tags = await fetchAllTags();

	return (
		<BlogPostForm mode="edit"
									initialData={post as BlogPost}
									availableTags={tags} />
	);
}
