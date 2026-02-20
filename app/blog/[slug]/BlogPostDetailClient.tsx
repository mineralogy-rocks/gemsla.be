"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/app/components/Button";
import { motion } from "framer-motion";
import { fadeInUp, staggerContainer, staggerItem } from "@/app/lib/animations";
import { PageHeader } from "@/app/components/PageHeader";
import { TiptapContent } from "@/app/components/TiptapContent";
import type { BlogPost, BlogTag } from "@/app/api/blog/types";

interface BlogPostDetailClientProps {
	post: BlogPost;
	isAdmin?: boolean;
}

export function BlogPostDetailClient({ post, isAdmin }: BlogPostDetailClientProps) {
	const router = useRouter();
	const formattedDate = post.published_at
		? new Date(post.published_at).toLocaleDateString("en-US", {
			year: "numeric",
			month: "long",
			day: "numeric",
		})
		: null;

	const tags = (post.blog_post_tags || [])
		.map((pt) => pt.blog_tags)
		.filter(Boolean) as BlogTag[];

	useEffect(() => {
		const storageKey = `blog_viewed_${post.id}`;
		if (localStorage.getItem(storageKey)) return;

		localStorage.setItem(storageKey, "1");
		fetch(`/api/blog/${post.id}/views`, { method: "POST" }).catch(() => {});
	}, [post.id]);

	return (
		<div className="min-h-screen relative pt-16">
			<div className="fixed inset-0 z-0 opacity-10 pointer-events-none"
				style={{
					backgroundImage: 'url("/NNNoise Texture Generator.svg")',
					backgroundSize: "400px 400px",
					backgroundRepeat: "repeat",
				}} />

			<article className="relative py-12 px-4 sm:px-6 lg:px-8 z-10">
				<div className="max-w-3xl mx-auto">
					<motion.div variants={fadeInUp}
						initial="hidden"
						animate="visible"
						className="mb-6 flex items-center justify-between">
						<Link href="/blog"
							className="text-sm text-text-gray hover:text-callout-accent transition-colors duration-200">
							&larr; Back to Blog
						</Link>
						{isAdmin && (
							<Button variant="outline"
								size="sm"
								onClick={() => router.push(`/blog/${post.slug}/edit`)}>
								Edit Post
							</Button>
						)}
					</motion.div>

					<PageHeader title={post.title} layout="default" />

					<motion.div variants={staggerContainer}
						initial="hidden"
						animate="visible"
						className="mb-8">
						<motion.div variants={staggerItem}
							className="flex items-center gap-4 text-sm text-text-gray flex-wrap">
							{formattedDate && <span>{formattedDate}</span>}
							{!post.is_published && (
								<span className="text-xs px-2 py-0.5 rounded-full border border-border-light text-text-gray bg-background-creme">
									Draft
								</span>
							)}
							<span>{post.views} {post.views === 1 ? "view" : "views"}</span>
						</motion.div>

						{tags.length > 0 && (
							<motion.div variants={staggerItem}
								className="flex flex-wrap gap-2 mt-3">
								{tags.map((tag) => (
									<Link key={tag.id}
										href={`/blog?tag=${tag.slug}`}
										className="text-xs px-2.5 py-0.5 rounded-full border border-border-light text-text-gray hover:border-gold transition-colors duration-200">
										{tag.name}
									</Link>
								))}
							</motion.div>
						)}
					</motion.div>

					<motion.div variants={fadeInUp}
						initial="hidden"
						animate="visible">
						<TiptapContent content={post.content} />
					</motion.div>
				</div>
			</article>
		</div>
	);
}
