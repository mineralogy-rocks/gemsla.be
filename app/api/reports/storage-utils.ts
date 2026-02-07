import { SupabaseClient } from "@supabase/supabase-js";

const SIGNED_URL_EXPIRY = 3600; // 1 hour

function toBrowserUrl(url: string): string {
	return url.replace("host.docker.internal", "localhost");
}

export async function generateSignedImageUrls(
	supabase: SupabaseClient,
	paths: string[]
): Promise<Map<string, string>> {
	const urlMap = new Map<string, string>();
	if (paths.length === 0) return urlMap;

	const { data, error } = await supabase.storage
		.from("reports")
		.createSignedUrls(paths, SIGNED_URL_EXPIRY);

	if (error) {
		console.error("Failed to generate signed URLs:", error);
		return urlMap;
	}

	for (const item of data) {
		if (item.signedUrl && item.path) {
			urlMap.set(item.path, toBrowserUrl(item.signedUrl));
		}
	}

	return urlMap;
}

export async function moveImagesToReportFolder(
	supabase: SupabaseClient,
	reportId: string,
	paths: string[]
): Promise<Map<string, string>> {
	const pathMap = new Map<string, string>();

	for (const path of paths) {
		if (!path.startsWith("temp/")) continue;

		const filename = path.replace("temp/", "");
		const newPath = `${reportId}/${filename}`;

		const { error } = await supabase.storage
			.from("reports")
			.move(path, newPath);

		if (error) {
			console.error(`Failed to move ${path} → ${newPath}:`, error);
			continue;
		}

		pathMap.set(path, newPath);
	}

	return pathMap;
}
