"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/app/lib/animations";
import { PageHeader } from "@/app/components/PageHeader";
import { SearchInput } from "@/app/components/SearchInput";
import { Pagination } from "@/app/components/Pagination";
import { Button } from "@/app/components/Button";
import { DeleteDialog } from "@/app/components/DeleteDialog";
import type { PaginatedBlogPostsResponse, BlogTag, BlogPostListItem } from "@/app/api/blog/types";

interface BlogListClientProps {
	initialPosts: PaginatedBlogPostsResponse;
	tags: BlogTag[];
	initialPage: number;
	initialQuery: string;
	initialTag: string;
	isAdmin?: boolean;
}

function BlogPostRow({
	post,
	isAdmin,
	onDelete,
}: {
	post: BlogPostListItem;
	isAdmin?: boolean;
	onDelete?: (id: string) => void;
}) {
	const router = useRouter();
	const formattedDate = post.published_at
		? new Date(post.published_at).toLocaleDateString("en-US", {
			year: "numeric",
			month: "long",
			day: "numeric",
		})
		: null;

	return (
		<motion.article variants={staggerItem} className="group py-8 border-b border-border-light">
			{isAdmin && (
				<div className="flex justify-end mb-2">
					<span className={`text-xs px-2 py-0.5 rounded-full border ${
						post.is_published
							? "border-green-300 text-green-700 bg-green-50"
							: "border-border-light text-text-gray bg-background-creme"
					}`}>
						{post.is_published ? "Published" : "Draft"}
					</span>
				</div>
			)}

			<Link href={`/blog/${post.slug}`}>
				<h3 className="text-xl sm:text-2xl font-medium text-foreground group-hover:text-gold transition-colors duration-200 mb-3">
					{post.title}
				</h3>
			</Link>

			{post.excerpt && (
				<Link href={`/blog/${post.slug}`}>
					<p className="text-sm text-text-gray leading-relaxed mb-4">{post.excerpt}</p>
				</Link>
			)}

			<div className="flex items-center justify-between gap-4 flex-wrap mt-2">
				<div className="flex items-center gap-2 flex-wrap text-xs text-text-gray">
					{formattedDate && (
						<time className="uppercase tracking-wider">{formattedDate}</time>
					)}
					{(post.views > 0 || formattedDate) && <span>·</span>}
					<span>{post.views} {post.views === 1 ? "view" : "views"}</span>
					{post.tags.map((tag) => (
						<span key={tag.id} className="flex items-center gap-2">
							<span>·</span>{tag.name}
						</span>
					))}
				</div>
				{isAdmin && (
					<div className="flex items-center gap-2">
						<Button variant="outline"
							size="sm"
							onClick={() => router.push(`/blog/${post.slug}/edit`)}>
							Edit
						</Button>
						<Button variant="accent"
							size="sm"
							onClick={() => onDelete?.(post.id)}>
							Delete
						</Button>
					</div>
				)}
			</div>
		</motion.article>
	);
}

export function BlogListClient({
	initialPosts,
	tags,
	initialPage,
	initialQuery,
	initialTag,
	isAdmin,
}: BlogListClientProps) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [searchValue, setSearchValue] = useState(initialQuery);
	const [posts, setPosts] = useState(initialPosts.data);
	const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
	const [deleting, setDeleting] = useState(false);

	useEffect(() => {
		setPosts(initialPosts.data);
	}, [initialPosts.data]);

	const updateUrl = useCallback((params: Record<string, string>) => {
		const newParams = new URLSearchParams(searchParams.toString());
		Object.entries(params).forEach(([key, value]) => {
			if (value) {
				newParams.set(key, value);
			} else {
				newParams.delete(key);
			}
		});
		newParams.delete("page");
		router.push(`/blog?${newParams.toString()}`);
	}, [router, searchParams]);

	useEffect(() => {
		const timer = setTimeout(() => {
			if (searchValue !== initialQuery) {
				updateUrl({ q: searchValue });
			}
		}, 300);
		return () => clearTimeout(timer);
	}, [searchValue, initialQuery, updateUrl]);

	const handleTagClick = (tagSlug: string) => {
		const currentTag = searchParams.get("tag") || "";
		updateUrl({ tag: currentTag === tagSlug ? "" : tagSlug });
	};

	const handlePageChange = (page: number) => {
		const newParams = new URLSearchParams(searchParams.toString());
		if (page > 1) {
			newParams.set("page", page.toString());
		} else {
			newParams.delete("page");
		}
		router.push(`/blog?${newParams.toString()}`);
	};

	const handleDelete = async () => {
		if (!deleteTarget) return;
		setDeleting(true);
		try {
			const res = await fetch(`/api/blog/${deleteTarget}`, { method: "DELETE" });
			if (res.ok) {
				setPosts((prev) => prev.filter((p) => p.id !== deleteTarget));
			}
		} catch (error) {
			console.error("Failed to delete post:", error);
		} finally {
			setDeleting(false);
			setDeleteTarget(null);
		}
	};

	return (
		<div className="min-h-screen relative pt-16">
			<div className="fixed inset-0 z-0 opacity-10 pointer-events-none"
				style={{
					backgroundImage: 'url("/NNNoise Texture Generator.svg")',
					backgroundSize: "400px 400px",
					backgroundRepeat: "repeat",
				}} />

			<section className="relative py-12 px-4 sm:px-6 lg:px-8 z-10">
				<div className="max-w-4xl mx-auto">
					<PageHeader title="Blog"
						subtitle="Insights on gemology, jewelry, and precious stones"
						actions={isAdmin ? (
							<Button variant="primary"
								size="sm"
								onClick={() => router.push("/blog/new")}>
								+ New Post
							</Button>
						) : undefined} />

					<div className="mb-6 max-w-md mx-auto">
						<SearchInput value={searchValue}
							onChange={(e) => setSearchValue(e.target.value)}
							onClear={() => setSearchValue("")}
							placeholder="Search articles..." />
					</div>

					{tags.length > 0 && (
						<div className="flex flex-wrap gap-2 justify-center mb-8">
							{tags.map((tag) => (
								<button key={tag.id}
									type="button"
									onClick={() => handleTagClick(tag.slug)}
									className={`text-sm px-4 py-1.5 rounded-full border transition-colors duration-200 cursor-pointer ${
										initialTag === tag.slug
											? "bg-foreground text-background border-foreground"
											: "border-border text-text-gray hover:border-gold"
									}`}>
									{tag.name}
								</button>
							))}
						</div>
					)}

					{posts.length > 0 ? (
						<motion.div variants={staggerContainer}
							initial="hidden"
							animate="visible"
							className="border-t border-border-light">
							{posts.map((post) => (
								<BlogPostRow key={post.id}
									post={post}
									isAdmin={isAdmin}
									onDelete={setDeleteTarget} />
							))}
						</motion.div>
					) : (
						<div className="text-center py-16">
							<p className="text-text-gray">
								{initialQuery || initialTag
									? "No articles found matching your criteria."
									: "No articles published yet. Check back soon!"}
							</p>
						</div>
					)}

					{initialPosts.totalPages > 1 && (
						<Pagination currentPage={initialPage}
							totalPages={initialPosts.totalPages}
							onPageChange={handlePageChange}
							className="mt-8" />
					)}
				</div>
			</section>

			{isAdmin && (
				<DeleteDialog isOpen={!!deleteTarget}
					onClose={() => setDeleteTarget(null)}
					onConfirm={handleDelete}
					title="Delete Blog Post"
					message="This will permanently delete this blog post. This action cannot be undone."
					confirmText="Delete Post"
					isPending={deleting} />
			)}
		</div>
	);
}
