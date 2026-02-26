import { ImageResponse } from "next/og";
import { createClient } from "@supabase/supabase-js";
import type { BlogPost } from "@/app/api/blog/types";

export const runtime = "edge";

const size = { width: 1200, height: 630 };

function fallbackImage() {
	return new ImageResponse(
		(
			<div
				style={{
					width: "100%",
					height: "100%",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					backgroundColor: "#f5f0e8",
					fontSize: 56,
					fontWeight: 700,
					color: "#000",
				}}
			>
				GemsLabé Blog
			</div>
		),
		{ ...size },
	);
}

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url);
		const slug = searchParams.get("slug");

		if (!slug) {
			return fallbackImage();
		}

		const supabase = createClient(
			process.env.NEXT_PUBLIC_SUPABASE_URL!,
			process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
		);

		const { data: post, error } = await supabase
			.from("blog_posts")
			.select("title, excerpt, blog_post_tags(blog_tags(name))")
			.eq("slug", slug)
			.eq("is_published", true)
			.single();

		if (error || !post) {
			return fallbackImage();
		}

		const tags = (
			(post as BlogPost).blog_post_tags
				?.map((pt) => pt.blog_tags?.name)
				.filter(Boolean) || []
		).slice(0, 4);

		return new ImageResponse(
			(
				<div
					style={{
						width: "100%",
						height: "100%",
						display: "flex",
						flexDirection: "column",
						justifyContent: "space-between",
						backgroundColor: "#f5f0e8",
						padding: "60px",
					}}
				>
					<div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
						<div
							style={{
								fontSize: 60,
								fontWeight: 700,
								color: "#000",
								lineHeight: 1.2,
								maxWidth: "1000px",
								overflow: "hidden",
								textOverflow: "ellipsis",
							}}
						>
							{post.title}
						</div>
						{post.excerpt && (
							<div
								style={{
									fontSize: 28,
									color: "#5c5c5c",
									lineHeight: 1.5,
									maxWidth: "900px",
									overflow: "hidden",
									textOverflow: "ellipsis",
								}}
							>
								{post.excerpt.length > 160
									? post.excerpt.slice(0, 160) + "..."
									: post.excerpt}
							</div>
						)}
						{tags.length > 0 && (
							<div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
								{tags.map((tag) => (
									<div
										key={tag}
										style={{
											fontSize: 20,
											color: "#5c5c5c",
											backgroundColor: "#e6e0d6",
											padding: "6px 16px",
											borderRadius: "20px",
										}}
									>
										#{tag}
									</div>
								))}
							</div>
						)}
					</div>
					<div
						style={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "flex-end",
						}}
					>
						<div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
							<div
								style={{
									fontSize: 32,
									fontWeight: 600,
									color: "#c4a77d",
								}}
							>
								GemsLabé
							</div>
							<div style={{ fontSize: 18, color: "#5c5c5c" }}>gemsla.be</div>
						</div>
						<div
							style={{
								width: "60px",
								height: "4px",
								backgroundColor: "#c4a77d",
								borderRadius: "2px",
							}}
						/>
					</div>
				</div>
			),
			{ ...size },
		);
	} catch {
		return fallbackImage();
	}
}
