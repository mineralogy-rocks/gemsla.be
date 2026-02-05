import { SupabaseClient } from "@supabase/supabase-js";

export async function moveImagesToReportFolder(
	supabase: SupabaseClient,
	reportId: string,
	imageUrls: string[]
): Promise<Map<string, string>> {
	const urlMap = new Map<string, string>();

	for (const imageUrl of imageUrls) {
		const pathMatch = imageUrl.match(
			/\/storage\/v1\/object\/public\/reports\/(.+)/
		);
		if (!pathMatch) continue;

		const storagePath = pathMatch[1];
		if (!storagePath.startsWith("temp/")) continue;

		const filename = storagePath.replace("temp/", "");
		const newPath = `${reportId}/${filename}`;

		const { error } = await supabase.storage
			.from("reports")
			.move(storagePath, newPath);

		if (error) {
			console.error(`Failed to move ${storagePath} → ${newPath}:`, error);
			continue;
		}

		const newUrl = imageUrl.replace(
			`/temp/${filename}`,
			`/${reportId}/${filename}`
		);
		urlMap.set(imageUrl, newUrl);
	}

	return urlMap;
}
