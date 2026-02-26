import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const staticPages: MetadataRoute.Sitemap = [
		{
			url: "https://gemsla.be",
			lastModified: new Date(),
			changeFrequency: "monthly",
			priority: 1,
		},
		{
			url: "https://gemsla.be/about",
			lastModified: new Date(),
			changeFrequency: "monthly",
			priority: 0.9,
		},
		{
			url: "https://gemsla.be/contact",
			lastModified: new Date(),
			changeFrequency: "monthly",
			priority: 0.8,
		},
		{
			url: "https://gemsla.be/pricing",
			lastModified: new Date(),
			changeFrequency: "monthly",
			priority: 0.8,
		},
		{
			url: "https://gemsla.be/blog",
			lastModified: new Date(),
			changeFrequency: "weekly",
			priority: 0.8,
		},
	];

	const supabase = await createClient();
	const { data: posts } = await supabase
		.from("blog_posts")
		.select("slug, updated_at, published_at")
		.eq("is_published", true)
		.lte("published_at", new Date().toISOString())
		.order("published_at", { ascending: false });

	const blogPages: MetadataRoute.Sitemap = (posts || []).map((post) => ({
		url: `https://gemsla.be/blog/${post.slug}`,
		lastModified: new Date(post.updated_at),
		changeFrequency: "monthly",
		priority: 0.7,
	}));

	return [...staticPages, ...blogPages];
}
