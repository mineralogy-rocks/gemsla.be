-- Migration: Fix admin check to use app_metadata
-- Date: 2026-02-02
-- Purpose: Update is_admin() function and policies to use app_metadata instead of user_metadata
-- Rollback: See bottom of file

BEGIN;

	-- ============================================
	-- UPDATE is_admin() FUNCTION
	-- ============================================

	-- Use app_metadata which cannot be modified by users (more secure than user_metadata)
	CREATE OR REPLACE FUNCTION public.is_admin()
	RETURNS BOOLEAN AS $$
	BEGIN
		RETURN (
			SELECT COALESCE(
				(auth.jwt() -> 'app_metadata' ->> 'role') = 'admin',
				FALSE
			)
		);
	END;
	$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

	-- ============================================
	-- UPDATE STORAGE POLICIES
	-- ============================================

	-- Drop existing storage policies
	DROP POLICY IF EXISTS "Admin can upload report files" ON storage.objects;
	DROP POLICY IF EXISTS "Authenticated can upload report files" ON storage.objects;
	DROP POLICY IF EXISTS "Authenticated upload" ON storage.objects;
	DROP POLICY IF EXISTS "Admin can update report files" ON storage.objects;
	DROP POLICY IF EXISTS "Admin can delete report files" ON storage.objects;
	DROP POLICY IF EXISTS "Authenticated delete" ON storage.objects;
	DROP POLICY IF EXISTS "Public can view report files" ON storage.objects;
	DROP POLICY IF EXISTS "Public read" ON storage.objects;

	-- Admin can upload files to reports bucket
	CREATE POLICY "Admin can upload report files"
	ON storage.objects FOR INSERT TO authenticated
	WITH CHECK (
		bucket_id = 'reports' AND
		(auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
	);

	-- Admin can update files in reports bucket
	CREATE POLICY "Admin can update report files"
	ON storage.objects FOR UPDATE TO authenticated
	USING (
		bucket_id = 'reports' AND
		(auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
	)
	WITH CHECK (
		bucket_id = 'reports' AND
		(auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
	);

	-- Admin can delete files from reports bucket
	CREATE POLICY "Admin can delete report files"
	ON storage.objects FOR DELETE TO authenticated
	USING (
		bucket_id = 'reports' AND
		(auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
	);

	-- Public can view files in reports bucket (bucket is public)
	CREATE POLICY "Public can view report files"
	ON storage.objects FOR SELECT TO anon, authenticated
	USING (bucket_id = 'reports');

COMMIT;

-- ============================================
-- ROLLBACK INSTRUCTIONS
-- ============================================
-- To rollback, restore the original is_admin() function:
-- CREATE OR REPLACE FUNCTION public.is_admin()
-- RETURNS BOOLEAN AS $$
-- BEGIN
--     RETURN (
--         SELECT COALESCE(
--             (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin',
--             FALSE
--         )
--     );
-- END;
-- $$ LANGUAGE plpgsql SECURITY DEFINER;
