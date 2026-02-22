-- Migration: Create private blog-images bucket with RLS policies
-- Date: 2026-02-22
-- Rollback: DELETE FROM storage.buckets WHERE id = 'blog-images';

-- Ensure bucket exists and is private
INSERT INTO storage.buckets (id, name, public, allowed_mime_types, file_size_limit)
VALUES (
	'blog-images',
	'blog-images',
	FALSE,
	ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
	10485760
)
ON CONFLICT (id) DO UPDATE SET
	public = FALSE,
	allowed_mime_types = EXCLUDED.allowed_mime_types,
	file_size_limit = EXCLUDED.file_size_limit;

-- Drop existing policies to recreate them cleanly
DROP POLICY IF EXISTS "Anyone can read blog images" ON storage.objects;
DROP POLICY IF EXISTS "Public can read blog images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload blog images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update blog images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete blog images" ON storage.objects;

-- Public can SELECT (required for signed URL generation)
CREATE POLICY "Public can read blog images"
	ON storage.objects FOR SELECT
	USING (bucket_id = 'blog-images');

-- Admins can upload
CREATE POLICY "Admins can upload blog images"
	ON storage.objects FOR INSERT
	WITH CHECK (
		bucket_id = 'blog-images'
		AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
	);

-- Admins can update
CREATE POLICY "Admins can update blog images"
	ON storage.objects FOR UPDATE
	USING (
		bucket_id = 'blog-images'
		AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
	);

-- Admins can delete
CREATE POLICY "Admins can delete blog images"
	ON storage.objects FOR DELETE
	USING (
		bucket_id = 'blog-images'
		AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
	);
