-- Migration: Create gem reports schema
-- Date: 2026-02-02
-- Purpose: Tables, RLS policies, and storage for gem report verification system
-- Rollback: See bottom of file

BEGIN;

	-- ============================================
	-- TABLES
	-- ============================================

	-- Reports table
	CREATE TABLE IF NOT EXISTS public.reports (
		id				UUID PRIMARY KEY DEFAULT gen_random_uuid(),
		title			TEXT NOT NULL CHECK (LENGTH(TRIM(title)) > 0),
		description		TEXT,
		note			TEXT,
		owner_id		UUID REFERENCES auth.users(id) ON DELETE SET NULL,
		first_name		TEXT NOT NULL CHECK (LENGTH(TRIM(first_name)) > 0),
		last_name		TEXT NOT NULL CHECK (LENGTH(TRIM(last_name)) > 0),
		owner_email		TEXT NOT NULL CHECK (owner_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
		public			BOOLEAN NOT NULL DEFAULT FALSE,
		created_at		TIMESTAMPTZ NOT NULL DEFAULT NOW(),
		updated_at		TIMESTAMPTZ NOT NULL DEFAULT NOW(),

		CONSTRAINT valid_dates CHECK (updated_at >= created_at)
	);

	-- Report images table
	CREATE TABLE IF NOT EXISTS public.report_images (
		id				UUID PRIMARY KEY DEFAULT gen_random_uuid(),
		report_id		UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
		image_url		TEXT NOT NULL CHECK (LENGTH(TRIM(image_url)) > 0),
		display_order	INTEGER NOT NULL DEFAULT 0,
		created_at		TIMESTAMPTZ NOT NULL DEFAULT NOW()
	);

	-- ============================================
	-- INDEXES
	-- ============================================

	-- Index for fetching public reports
	CREATE INDEX IF NOT EXISTS idx_reports_public ON public.reports(public) WHERE public = TRUE;

	-- Index for owner lookup
	CREATE INDEX IF NOT EXISTS idx_reports_owner_id ON public.reports(owner_id);

	-- Index for report images by report
	CREATE INDEX IF NOT EXISTS idx_report_images_report_id ON public.report_images(report_id);

	-- Index for image ordering
	CREATE INDEX IF NOT EXISTS idx_report_images_order ON public.report_images(report_id, display_order);

	-- Index for searching by name
	CREATE INDEX IF NOT EXISTS idx_reports_name_search ON public.reports(first_name, last_name);

	-- ============================================
	-- ROW LEVEL SECURITY
	-- ============================================

	-- Enable RLS on reports table
	ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

	-- Enable RLS on report_images table
	ALTER TABLE public.report_images ENABLE ROW LEVEL SECURITY;

	-- Helper function to check if user is admin
	CREATE OR REPLACE FUNCTION public.is_admin()
	RETURNS BOOLEAN AS $$
	BEGIN
		RETURN (
			SELECT COALESCE(
				(auth.jwt() -> 'user_metadata' ->> 'role') = 'admin',
				FALSE
			)
		);
	END;
	$$ LANGUAGE plpgsql SECURITY DEFINER;

	-- ============================================
	-- REPORTS TABLE POLICIES
	-- ============================================

	-- Admin can do everything on reports
	DROP POLICY IF EXISTS "Admin full access on reports" ON public.reports;
	CREATE POLICY "Admin full access on reports"
		ON public.reports
		FOR ALL
		TO authenticated
		USING (public.is_admin())
		WITH CHECK (public.is_admin());

	-- Public can view public reports
	DROP POLICY IF EXISTS "Public can view public reports" ON public.reports;
	CREATE POLICY "Public can view public reports"
		ON public.reports
		FOR SELECT
		TO anon, authenticated
		USING (public = TRUE);

	-- ============================================
	-- REPORT IMAGES TABLE POLICIES
	-- ============================================

	-- Admin can do everything on report_images
	DROP POLICY IF EXISTS "Admin full access on report_images" ON public.report_images;
	CREATE POLICY "Admin full access on report_images"
		ON public.report_images
		FOR ALL
		TO authenticated
		USING (public.is_admin())
		WITH CHECK (public.is_admin());

	-- Public can view images of public reports
	DROP POLICY IF EXISTS "Public can view images of public reports" ON public.report_images;
	CREATE POLICY "Public can view images of public reports"
		ON public.report_images
		FOR SELECT
		TO anon, authenticated
		USING (
			EXISTS (
				SELECT 1 FROM public.reports r
				WHERE r.id = report_id AND r.public = TRUE
			)
		);

	-- ============================================
	-- STORAGE BUCKET & POLICIES
	-- ============================================

	-- Create storage bucket for reports (if not exists)
	INSERT INTO storage.buckets (id, name, public)
	VALUES ('reports', 'reports', TRUE)
	ON CONFLICT (id) DO NOTHING;

	-- Admin can upload files to reports bucket
	DROP POLICY IF EXISTS "Admin can upload report files" ON storage.objects;
	CREATE POLICY "Admin can upload report files"
		ON storage.objects
		FOR INSERT
		TO authenticated
		WITH CHECK (
			bucket_id = 'reports' AND
			public.is_admin()
		);

	-- Admin can update files in reports bucket
	DROP POLICY IF EXISTS "Admin can update report files" ON storage.objects;
	CREATE POLICY "Admin can update report files"
		ON storage.objects
		FOR UPDATE
		TO authenticated
		USING (
			bucket_id = 'reports' AND
			public.is_admin()
		)
		WITH CHECK (
			bucket_id = 'reports' AND
			public.is_admin()
		);

	-- Admin can delete files from reports bucket
	DROP POLICY IF EXISTS "Admin can delete report files" ON storage.objects;
	CREATE POLICY "Admin can delete report files"
		ON storage.objects
		FOR DELETE
		TO authenticated
		USING (
			bucket_id = 'reports' AND
			public.is_admin()
		);

	-- Public can view files in reports bucket (since bucket is public)
	DROP POLICY IF EXISTS "Public can view report files" ON storage.objects;
	CREATE POLICY "Public can view report files"
		ON storage.objects
		FOR SELECT
		TO anon, authenticated
		USING (bucket_id = 'reports');

	-- ============================================
	-- TRIGGERS
	-- ============================================

	-- Function to update updated_at timestamp
	CREATE OR REPLACE FUNCTION public.update_updated_at_column()
	RETURNS TRIGGER AS $$
	BEGIN
		NEW.updated_at = NOW();
		RETURN NEW;
	END;
	$$ LANGUAGE plpgsql;

	-- Trigger for reports updated_at
	DROP TRIGGER IF EXISTS update_reports_updated_at ON public.reports;
	CREATE TRIGGER update_reports_updated_at
		BEFORE UPDATE ON public.reports
		FOR EACH ROW
		EXECUTE FUNCTION public.update_updated_at_column();

	-- ============================================
	-- GRANTS
	-- ============================================

	GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
	GRANT ALL ON TABLE public.reports TO authenticated, service_role;
	GRANT SELECT ON TABLE public.reports TO anon;
	GRANT ALL ON TABLE public.report_images TO authenticated, service_role;
	GRANT SELECT ON TABLE public.report_images TO anon;
	GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated, service_role;
	GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO authenticated, service_role;

COMMIT;

-- ============================================
-- ROLLBACK INSTRUCTIONS
-- ============================================
-- BEGIN;
--   DROP TRIGGER IF EXISTS update_reports_updated_at ON public.reports;
--   DROP FUNCTION IF EXISTS public.update_updated_at_column();
--   DROP FUNCTION IF EXISTS public.is_admin();
--   DROP POLICY IF EXISTS "Public can view report files" ON storage.objects;
--   DROP POLICY IF EXISTS "Admin can delete report files" ON storage.objects;
--   DROP POLICY IF EXISTS "Admin can update report files" ON storage.objects;
--   DROP POLICY IF EXISTS "Admin can upload report files" ON storage.objects;
--   DELETE FROM storage.buckets WHERE id = 'reports';
--   DROP POLICY IF EXISTS "Public can view images of public reports" ON public.report_images;
--   DROP POLICY IF EXISTS "Admin full access on report_images" ON public.report_images;
--   DROP POLICY IF EXISTS "Public can view public reports" ON public.reports;
--   DROP POLICY IF EXISTS "Admin full access on reports" ON public.reports;
--   DROP INDEX IF EXISTS idx_reports_name_search;
--   DROP INDEX IF EXISTS idx_report_images_order;
--   DROP INDEX IF EXISTS idx_report_images_report_id;
--   DROP INDEX IF EXISTS idx_reports_owner_id;
--   DROP INDEX IF EXISTS idx_reports_public;
--   DROP TABLE IF EXISTS public.report_images;
--   DROP TABLE IF EXISTS public.reports;
-- COMMIT;
