"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { JSONContent } from "@tiptap/react";
import { motion } from "framer-motion";
import { fadeInUp } from "@/app/lib/animations";
import { Input } from "@/app/components/Input";
import { TextArea } from "@/app/components/TextArea";
import { Button } from "@/app/components/Button";
import { Checkbox } from "@/app/components/Checkbox";
import { TiptapEditor } from "@/app/components/TiptapEditor";
import type { BlogPost, BlogTag } from "@/app/api/blog/types";

interface BlogPostFormProps {
	mode: "create" | "edit";
	initialData?: BlogPost;
	availableTags: BlogTag[];
}

function slugify(text: string): string {
	return text
		.toLowerCase()
		.replace(/[^\w\s-]/g, "")
		.replace(/[\s_]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.substring(0, 200);
}

export function BlogPostForm({ mode, initialData, availableTags }: BlogPostFormProps) {
	const router = useRouter();
	const [title, setTitle] = useState(initialData?.title || "");
	const [slug, setSlug] = useState(initialData?.slug || "");
	const [excerpt, setExcerpt] = useState(initialData?.excerpt || "");
	const [content, setContent] = useState<JSONContent>(
		(initialData?.content as JSONContent) || {}
	);
	const [isPublished, setIsPublished] = useState(initialData?.is_published || false);
	const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
		initialData?.blog_post_tags?.map((pt) => pt.blog_tags.id) || []
	);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");
	const [slugManuallyEdited, setSlugManuallyEdited] = useState(mode === "edit");

	const handleTitleChange = (value: string) => {
		setTitle(value);
		if (!slugManuallyEdited) {
			setSlug(slugify(value));
		}
	};

	const handleSlugChange = (value: string) => {
		setSlugManuallyEdited(true);
		setSlug(value);
	};

	const toggleTag = (tagId: string) => {
		setSelectedTagIds((prev) =>
			prev.includes(tagId)
				? prev.filter((id) => id !== tagId)
				: [...prev, tagId]
		);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!title.trim() || !slug.trim()) {
			setError("Title and slug are required.");
			return;
		}

		setSaving(true);
		setError("");

		const body = {
			title: title.trim(),
			slug: slug.trim(),
			content,
			excerpt: excerpt.trim() || null,
			is_published: isPublished,
			tag_ids: selectedTagIds,
		};

		try {
			const url = mode === "create"
				? "/api/blog"
				: `/api/blog/${initialData!.id}`;
			const method = mode === "create" ? "POST" : "PUT";

			const res = await fetch(url, {
				method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(body),
			});

			if (!res.ok) {
				const data = await res.json();
				setError(data.error || "Failed to save post.");
				setSaving(false);
				return;
			}

			router.push("/blog");
			router.refresh();
		} catch {
			setError("An unexpected error occurred.");
			setSaving(false);
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
				<div className="max-w-3xl mx-auto">
					<motion.form onSubmit={handleSubmit}
						variants={fadeInUp}
						initial="hidden"
						animate="visible"
						className="space-y-6">
						<div className="flex items-center justify-between mb-6">
							<h1 className="text-2xl font-medium">
								{mode === "create" ? "New Post" : "Edit Post"}
							</h1>
							<Button variant="outline"
								size="sm"
								type="button"
								onClick={() => router.push("/blog")}>
								Cancel
							</Button>
						</div>

						{error && (
							<div className="p-3 rounded-md bg-red-50 border border-red-200 text-sm text-red-700">
								{error}
							</div>
						)}

						<Input label="Title"
							value={title}
							onChange={(e) => handleTitleChange(e.target.value)}
							placeholder="Post title" />

						<Input label="Slug"
							value={slug}
							onChange={(e) => handleSlugChange(e.target.value)}
							placeholder="post-slug" />

						<TextArea label="Excerpt"
							value={excerpt}
							onChange={(e) => setExcerpt(e.target.value)}
							placeholder="Brief summary of the post"
							rows={2} />

						<div className="flex flex-col gap-1.5">
							<label className="text-sm font-medium text-foreground">
								Content
							</label>
							<TiptapEditor content={content}
														onChange={setContent}
														placeholder="Write your post content here..." />
						</div>

						{availableTags.length > 0 && (
							<div className="flex flex-col gap-2">
								<label className="text-sm font-medium text-foreground">
									Tags
								</label>
								<div className="flex flex-wrap gap-3">
									{availableTags.map((tag) => (
										<Checkbox key={tag.id}
											label={tag.name}
											checked={selectedTagIds.includes(tag.id)}
											onChange={() => toggleTag(tag.id)} />
									))}
								</div>
							</div>
						)}

						<Checkbox label="Publish this post"
							checked={isPublished}
							onChange={() => setIsPublished(!isPublished)} />

						<div className="flex justify-end pt-4 border-t border-border">
							<Button variant="primary"
								type="submit"
								loading={saving}>
								{mode === "create" ? "Create Post" : "Save Changes"}
							</Button>
						</div>
					</motion.form>
				</div>
			</section>
		</div>
	);
}
