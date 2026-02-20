import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/supabase/admin";
import { fetchAllTags } from "@/app/blog/lib/queries";
import { BlogPostForm } from "../admin/BlogPostForm";

export const metadata = {
	title: "New Post",
};

export default async function NewBlogPostPage() {
	const adminUser = await getAdminUser();

	if (!adminUser) {
		redirect("/auth/sign-in");
	}

	const tags = await fetchAllTags();

	return <BlogPostForm mode="create" availableTags={tags} />;
}
