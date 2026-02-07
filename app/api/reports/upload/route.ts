import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/supabase/admin";

/**
 * POST /api/reports/upload
 * Upload an image to Supabase Storage (admin only)
 */
export async function POST(request: NextRequest) {
	try {
		const admin = await isAdmin();
		if (!admin) {
			return NextResponse.json(
				{ error: "Unauthorized" },
				{ status: 401 }
			);
		}

		const formData = await request.formData();
		const file = formData.get("file") as File | null;
		const reportId = formData.get("reportId") as string | null;

		if (!file) {
			return NextResponse.json(
				{ error: "No file provided" },
				{ status: 400 }
			);
		}

		// Validate file type
		const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
		if (!validTypes.includes(file.type)) {
			return NextResponse.json(
				{ error: "Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed." },
				{ status: 400 }
			);
		}

		// Validate file size (10MB max)
		if (file.size > 10 * 1024 * 1024) {
			return NextResponse.json(
				{ error: "File too large. Maximum size is 10MB." },
				{ status: 400 }
			);
		}

		const supabase = await createClient();

		// Generate unique path
		const timestamp = Date.now();
		const randomString = Math.random().toString(36).slice(2, 9);
		const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
		const folderPath = reportId || "temp";
		const filePath = `${folderPath}/${timestamp}-${randomString}.${extension}`;

		// Convert File to ArrayBuffer
		const arrayBuffer = await file.arrayBuffer();
		const buffer = new Uint8Array(arrayBuffer);

		const { data, error: uploadError } = await supabase.storage
			.from("reports")
			.upload(filePath, buffer, {
				contentType: file.type,
				cacheControl: "3600",
				upsert: false,
			});

		if (uploadError) {
			console.error("Upload error:", uploadError);
			return NextResponse.json(
				{ error: uploadError.message },
				{ status: 500 }
			);
		}

		// Generate signed URL for preview
		const { data: signedUrlData, error: signError } = await supabase.storage
			.from("reports")
			.createSignedUrl(data.path, 3600);

		if (signError || !signedUrlData?.signedUrl) {
			console.error("Signed URL error:", signError);
			return NextResponse.json(
				{ error: "Failed to generate signed URL" },
				{ status: 500 }
			);
		}

		const browserUrl = signedUrlData.signedUrl.replace(
			"host.docker.internal",
			"localhost"
		);

		return NextResponse.json({
			url: browserUrl,
			path: data.path,
		});
	} catch (error) {
		console.error("Upload error:", error);
		return NextResponse.json(
			{ error: "Failed to upload file" },
			{ status: 500 }
		);
	}
}

/**
 * DELETE /api/reports/upload
 * Delete a temp image from storage (admin only)
 */
export async function DELETE(request: NextRequest) {
	try {
		const admin = await isAdmin();
		if (!admin) {
			return NextResponse.json(
				{ error: "Unauthorized" },
				{ status: 401 }
			);
		}

		const { path } = await request.json();

		if (!path || !path.startsWith("temp/")) {
			return NextResponse.json(
				{ error: "Only temp files can be deleted via this endpoint" },
				{ status: 400 }
			);
		}

		const supabase = await createClient();

		const { error } = await supabase.storage
			.from("reports")
			.remove([path]);

		if (error) {
			console.error("Delete error:", error);
			return NextResponse.json(
				{ error: error.message },
				{ status: 500 }
			);
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Delete error:", error);
		return NextResponse.json(
			{ error: "Failed to delete file" },
			{ status: 500 }
		);
	}
}
