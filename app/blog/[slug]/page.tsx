import { notFound } from "next/navigation";
import { isAdmin } from "@/lib/supabase/admin";
import { fetchPostBySlug } from "../lib/queries";
import { BlogPostDetailClient } from "./BlogPostDetailClient";

interface BlogPostPageProps {
	params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: BlogPostPageProps) {
	const { slug } = await params;
	const post = await fetchPostBySlug(slug);

	if (!post) {
		return { title: "Post Not Found | GemsLabé" };
	}

	return {
		title: `${post.title} | GemsLabé Blog`,
		description: post.excerpt || `Read "${post.title}" on the GemsLabé blog.`,
	};
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
	const { slug } = await params;
	const post = await fetchPostBySlug(slug);

	if (!post) {
		notFound();
	}

	const admin = await isAdmin();

	if (!post.is_published && !admin) {
		notFound();
	}

	return <BlogPostDetailClient post={post} isAdmin={admin} />;
}
