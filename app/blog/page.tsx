import { isAdmin } from "@/lib/supabase/admin";
import { fetchPosts, fetchAllTags } from "./lib/queries";
import { BlogListClient } from "./BlogListClient";

interface BlogPageProps {
	searchParams: Promise<{ page?: string; q?: string; tag?: string }>;
}

export const metadata = {
	title: "Blog",
	description: "Explore our latest articles on gemology, jewelry, and precious stones.",
};

export default async function BlogPage({ searchParams }: BlogPageProps) {
	const params = await searchParams;
	const page = parseInt(params.page || "1", 10);
	const q = params.q || "";
	const tag = params.tag || "";

	const admin = await isAdmin();

	const [postsResponse, tags] = await Promise.all([
		fetchPosts({ page, q, tag, includeUnpublished: admin }),
		fetchAllTags(),
	]);

	return (
		<BlogListClient initialPosts={postsResponse}
										tags={tags}
										initialPage={page}
										initialQuery={q}
										initialTag={tag}
										isAdmin={admin} />
	);
}
