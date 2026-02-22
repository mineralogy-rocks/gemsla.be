import { SupabaseClient } from "@supabase/supabase-js";

const SIGNED_URL_EXPIRY = 3600;

function toBrowserUrl(url: string): string {
	return url.replace("host.docker.internal", "localhost");
}

function isStoragePath(src: string): boolean {
	return !!src && !src.startsWith("http://") && !src.startsWith("https://") && !src.startsWith("data:");
}

interface TiptapNode {
	type?: string;
	attrs?: Record<string, unknown>;
	content?: TiptapNode[];
}

function collectImagePaths(node: TiptapNode): string[] {
	const paths: string[] = [];
	if (node.type === "image" && node.attrs?.src && isStoragePath(node.attrs.src as string)) {
		paths.push(node.attrs.src as string);
	}
	if (node.content) {
		for (const child of node.content) {
			paths.push(...collectImagePaths(child));
		}
	}
	return paths;
}

function transformImageNodes(
	node: TiptapNode,
	urlMap: Map<string, string>,
): TiptapNode {
	if (node.type === "image" && node.attrs?.src && isStoragePath(node.attrs.src as string)) {
		const storagePath = node.attrs.src as string;
		const signedUrl = urlMap.get(storagePath);
		if (signedUrl) {
			return {
				...node,
				attrs: {
					...node.attrs,
					src: signedUrl,
					"data-storage-path": storagePath,
				},
			};
		}
	}
	if (node.content) {
		return {
			...node,
			content: node.content.map((child) => transformImageNodes(child, urlMap)),
		};
	}
	return node;
}

export async function resolveContentImageUrls(
	supabase: SupabaseClient,
	content: TiptapNode,
): Promise<TiptapNode> {
	const paths = collectImagePaths(content);
	if (paths.length === 0) return content;

	const uniquePaths = [...new Set(paths)];
	const { data, error } = await supabase.storage
		.from("blog-images")
		.createSignedUrls(uniquePaths, SIGNED_URL_EXPIRY);

	if (error || !data) {
		console.error("Failed to generate signed URLs for blog images:", error);
		return content;
	}

	const urlMap = new Map<string, string>();
	for (const item of data) {
		if (item.signedUrl && item.path) {
			urlMap.set(item.path, toBrowserUrl(item.signedUrl));
		}
	}

	return transformImageNodes(content, urlMap);
}

function stripImageUrls(node: TiptapNode): TiptapNode {
	if (node.type === "image" && node.attrs?.["data-storage-path"]) {
		const { "data-storage-path": storagePath, ...restAttrs } = node.attrs;
		return {
			...node,
			attrs: {
				...restAttrs,
				src: storagePath,
			},
		};
	}
	if (node.content) {
		return {
			...node,
			content: node.content.map(stripImageUrls),
		};
	}
	return node;
}

export function stripContentImageUrls(content: TiptapNode): TiptapNode {
	return stripImageUrls(content);
}
