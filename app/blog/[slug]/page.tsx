import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/supabase/admin";
import { fetchPostBySlug } from "../lib/queries";
import { resolveContentImageUrls } from "../lib/content-images";
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

	const tags =
		post.blog_post_tags
			?.map((pt) => pt.blog_tags?.name)
			.filter(Boolean) || [];
	const description =
		post.excerpt || `Read "${post.title}" on the GemsLabé blog.`;
	const url = `https://gemsla.be/blog/${slug}`;

	return {
		title: `${post.title} | GemsLabé Blog`,
		description,
		keywords: tags,
		alternates: {
			canonical: url,
		},
		openGraph: {
			type: "article" as const,
			title: post.title,
			description,
			url,
			siteName: "GemsLabé",
			publishedTime: post.published_at ?? undefined,
			modifiedTime: post.updated_at,
			tags,
			locale: "en_US",
			images: [
				{
					url: `https://gemsla.be/api/og?slug=${slug}`,
					width: 1200,
					height: 630,
					alt: post.title,
				},
			],
		},
		twitter: {
			card: "summary_large_image" as const,
			title: post.title,
			description,
			images: [`https://gemsla.be/api/og?slug=${slug}`],
		},
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

	let resolvedPost = post;
	if (post.content) {
		const supabase = await createClient();
		const content = await resolveContentImageUrls(supabase, post.content as Record<string, unknown>);
		resolvedPost = { ...post, content } as typeof post;
	}

	const tags =
		post.blog_post_tags
			?.map((pt) => pt.blog_tags?.name)
			.filter(Boolean) || [];

	const jsonLd = {
		"@context": "https://schema.org",
		"@type": "BlogPosting",
		headline: post.title,
		description: post.excerpt || undefined,
		keywords: tags.join(", "),
		url: `https://gemsla.be/blog/${slug}`,
		datePublished: post.published_at || undefined,
		dateModified: post.updated_at,
		author: {
			"@type": "Person",
			name: "Olena Rybnikova",
		},
		publisher: {
			"@type": "Organization",
			name: "GemsLabé",
			url: "https://gemsla.be",
		},
	};

	return (
		<>
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
			/>
			<BlogPostDetailClient post={resolvedPost} isAdmin={admin} />
		</>
	);
}
