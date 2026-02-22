import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/supabase/admin";

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

		if (!file) {
			return NextResponse.json(
				{ error: "No file provided" },
				{ status: 400 }
			);
		}

		const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
		if (!validTypes.includes(file.type)) {
			return NextResponse.json(
				{ error: "Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed." },
				{ status: 400 }
			);
		}

		if (file.size > 10 * 1024 * 1024) {
			return NextResponse.json(
				{ error: "File too large. Maximum size is 10MB." },
				{ status: 400 }
			);
		}

		const supabase = await createClient();

		const timestamp = Date.now();
		const randomString = Math.random().toString(36).slice(2, 9);
		const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
		const filePath = `${timestamp}-${randomString}.${extension}`;

		const arrayBuffer = await file.arrayBuffer();
		const buffer = new Uint8Array(arrayBuffer);

		const { data, error: uploadError } = await supabase.storage
			.from("blog-images")
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

		const { data: signedUrlData, error: signedUrlError } = await supabase.storage
			.from("blog-images")
			.createSignedUrl(data.path, 3600);

		if (signedUrlError || !signedUrlData?.signedUrl) {
			console.error("Signed URL error:", signedUrlError);
			return NextResponse.json(
				{ error: "Failed to generate signed URL" },
				{ status: 500 }
			);
		}

		const signedUrl = signedUrlData.signedUrl.replace(
			"host.docker.internal",
			"localhost"
		);

		return NextResponse.json({ signedUrl, path: data.path });
	} catch (error) {
		console.error("Upload error:", error);
		return NextResponse.json(
			{ error: "Failed to upload file" },
			{ status: 500 }
		);
	}
}
