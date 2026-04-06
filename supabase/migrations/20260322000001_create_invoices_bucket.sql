-- Migration: Create private invoices storage bucket with RLS policies
-- Date: 2026-03-22
-- Rollback: DELETE FROM storage.buckets WHERE id = 'invoices';

-- Ensure bucket exists and is private (PDF only, 20MB limit)
INSERT INTO storage.buckets (id, name, public, allowed_mime_types, file_size_limit)
VALUES (
	'invoices',
	'invoices',
	FALSE,
	ARRAY['application/pdf'],
	20971520
)
ON CONFLICT (id) DO UPDATE SET
	public = FALSE,
	allowed_mime_types = EXCLUDED.allowed_mime_types,
	file_size_limit = EXCLUDED.file_size_limit;

-- Drop existing policies to recreate them cleanly
DROP POLICY IF EXISTS "Admins can read invoices" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload invoices" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update invoices" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete invoices" ON storage.objects;

-- Admin-only SELECT (invoices are private, unlike reports)
CREATE POLICY "Admins can read invoices"
	ON storage.objects FOR SELECT
	USING (
		bucket_id = 'invoices'
		AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
	);

-- Admins can upload
CREATE POLICY "Admins can upload invoices"
	ON storage.objects FOR INSERT
	WITH CHECK (
		bucket_id = 'invoices'
		AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
	);

-- Admins can update
CREATE POLICY "Admins can update invoices"
	ON storage.objects FOR UPDATE
	USING (
		bucket_id = 'invoices'
		AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
	);

-- Admins can delete
CREATE POLICY "Admins can delete invoices"
	ON storage.objects FOR DELETE
	USING (
		bucket_id = 'invoices'
		AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
	);
