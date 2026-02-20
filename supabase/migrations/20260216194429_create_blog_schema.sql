-- Migration: Create blog schema
-- Date: 2026-02-16
-- Purpose: Tables, RLS policies, functions, and triggers for blog system
-- Rollback: See bottom of file

BEGIN;

	-- ============================================
	-- TABLES
	-- ============================================

	CREATE TABLE IF NOT EXISTS public.blog_posts (
		id				UUID PRIMARY KEY DEFAULT gen_random_uuid(),
		title			TEXT NOT NULL CHECK (LENGTH(TRIM(title)) > 0),
		slug			TEXT NOT NULL UNIQUE CHECK (LENGTH(TRIM(slug)) > 0),
		content			JSONB NOT NULL DEFAULT '{}'::JSONB,
		excerpt			TEXT,
		author_id		UUID REFERENCES auth.users(id) ON DELETE SET NULL,
		published_at	TIMESTAMPTZ,
		is_published	BOOLEAN NOT NULL DEFAULT FALSE,
		views			INTEGER NOT NULL DEFAULT 0,
		likes			INTEGER NOT NULL DEFAULT 0,
		created_at		TIMESTAMPTZ NOT NULL DEFAULT NOW(),
		updated_at		TIMESTAMPTZ NOT NULL DEFAULT NOW(),

		CONSTRAINT valid_blog_dates CHECK (updated_at >= created_at)
	);

	CREATE TABLE IF NOT EXISTS public.blog_tags (
		id				UUID PRIMARY KEY DEFAULT gen_random_uuid(),
		name			TEXT NOT NULL UNIQUE CHECK (LENGTH(TRIM(name)) > 0),
		slug			TEXT NOT NULL UNIQUE CHECK (LENGTH(TRIM(slug)) > 0),
		created_at		TIMESTAMPTZ NOT NULL DEFAULT NOW()
	);

	CREATE TABLE IF NOT EXISTS public.blog_post_tags (
		post_id			UUID NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
		tag_id			UUID NOT NULL REFERENCES public.blog_tags(id) ON DELETE CASCADE,
		PRIMARY KEY (post_id, tag_id)
	);

	-- ============================================
	-- INDEXES
	-- ============================================

	CREATE INDEX IF NOT EXISTS idx_blog_posts_published
		ON public.blog_posts(published_at DESC)
		WHERE is_published = TRUE;

	CREATE INDEX IF NOT EXISTS idx_blog_posts_slug
		ON public.blog_posts(slug);

	CREATE INDEX IF NOT EXISTS idx_blog_posts_author_id
		ON public.blog_posts(author_id);

	CREATE INDEX IF NOT EXISTS idx_blog_post_tags_post_id
		ON public.blog_post_tags(post_id);

	CREATE INDEX IF NOT EXISTS idx_blog_post_tags_tag_id
		ON public.blog_post_tags(tag_id);

	CREATE INDEX IF NOT EXISTS idx_blog_tags_slug
		ON public.blog_tags(slug);

	-- ============================================
	-- ROW LEVEL SECURITY
	-- ============================================

	ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
	ALTER TABLE public.blog_tags ENABLE ROW LEVEL SECURITY;
	ALTER TABLE public.blog_post_tags ENABLE ROW LEVEL SECURITY;

	-- ============================================
	-- BLOG POSTS POLICIES
	-- ============================================

	DROP POLICY IF EXISTS "Admin full access on blog_posts" ON public.blog_posts;
	CREATE POLICY "Admin full access on blog_posts"
		ON public.blog_posts
		FOR ALL
		TO authenticated
		USING (public.is_admin())
		WITH CHECK (public.is_admin());

	DROP POLICY IF EXISTS "Public can view published blog posts" ON public.blog_posts;
	CREATE POLICY "Public can view published blog posts"
		ON public.blog_posts
		FOR SELECT
		TO anon, authenticated
		USING (is_published = TRUE AND published_at <= NOW());

	-- ============================================
	-- BLOG TAGS POLICIES
	-- ============================================

	DROP POLICY IF EXISTS "Admin full access on blog_tags" ON public.blog_tags;
	CREATE POLICY "Admin full access on blog_tags"
		ON public.blog_tags
		FOR ALL
		TO authenticated
		USING (public.is_admin())
		WITH CHECK (public.is_admin());

	DROP POLICY IF EXISTS "Public can view blog tags" ON public.blog_tags;
	CREATE POLICY "Public can view blog tags"
		ON public.blog_tags
		FOR SELECT
		TO anon, authenticated
		USING (TRUE);

	-- ============================================
	-- BLOG POST TAGS POLICIES
	-- ============================================

	DROP POLICY IF EXISTS "Admin full access on blog_post_tags" ON public.blog_post_tags;
	CREATE POLICY "Admin full access on blog_post_tags"
		ON public.blog_post_tags
		FOR ALL
		TO authenticated
		USING (public.is_admin())
		WITH CHECK (public.is_admin());

	DROP POLICY IF EXISTS "Public can view published blog post tags" ON public.blog_post_tags;
	CREATE POLICY "Public can view published blog post tags"
		ON public.blog_post_tags
		FOR SELECT
		TO anon, authenticated
		USING (
			EXISTS (
				SELECT 1 FROM public.blog_posts bp
				WHERE bp.id = post_id
				AND bp.is_published = TRUE
				AND bp.published_at <= NOW()
			)
		);

	-- ============================================
	-- FUNCTIONS
	-- ============================================

	CREATE OR REPLACE FUNCTION public.increment_blog_post_views(post_id UUID)
	RETURNS VOID AS $$
	BEGIN
		UPDATE public.blog_posts
		SET views = views + 1
		WHERE id = post_id
		AND is_published = TRUE;
	END;
	$$ LANGUAGE plpgsql SECURITY DEFINER
	SET search_path = public;

	CREATE OR REPLACE FUNCTION public.set_blog_published_at()
	RETURNS TRIGGER AS $$
	BEGIN
		IF NEW.is_published = TRUE AND OLD.is_published = FALSE AND NEW.published_at IS NULL THEN
			NEW.published_at = NOW();
		END IF;
		RETURN NEW;
	END;
	$$ LANGUAGE plpgsql
	SET search_path = public;

	-- ============================================
	-- TRIGGERS
	-- ============================================

	DROP TRIGGER IF EXISTS update_blog_posts_updated_at ON public.blog_posts;
	CREATE TRIGGER update_blog_posts_updated_at
		BEFORE UPDATE ON public.blog_posts
		FOR EACH ROW
		EXECUTE FUNCTION public.update_updated_at_column();

	DROP TRIGGER IF EXISTS set_blog_posts_published_at ON public.blog_posts;
	CREATE TRIGGER set_blog_posts_published_at
		BEFORE UPDATE ON public.blog_posts
		FOR EACH ROW
		EXECUTE FUNCTION public.set_blog_published_at();

	-- ============================================
	-- GRANTS
	-- ============================================

	GRANT ALL ON TABLE public.blog_posts TO authenticated, service_role;
	GRANT SELECT ON TABLE public.blog_posts TO anon;
	GRANT ALL ON TABLE public.blog_tags TO authenticated, service_role;
	GRANT SELECT ON TABLE public.blog_tags TO anon;
	GRANT ALL ON TABLE public.blog_post_tags TO authenticated, service_role;
	GRANT SELECT ON TABLE public.blog_post_tags TO anon;
	GRANT EXECUTE ON FUNCTION public.increment_blog_post_views(UUID) TO anon, authenticated, service_role;
	GRANT EXECUTE ON FUNCTION public.set_blog_published_at() TO authenticated, service_role;

	-- ============================================
	-- SEED DATA
	-- ============================================

	INSERT INTO public.blog_tags (name, slug) VALUES
		('Gemology', 'gemology'),
		('Jewelry', 'jewelry')
	ON CONFLICT (name) DO NOTHING;

COMMIT;

-- ============================================
-- ROLLBACK INSTRUCTIONS
-- ============================================
-- BEGIN;
--   DROP TRIGGER IF EXISTS set_blog_posts_published_at ON public.blog_posts;
--   DROP TRIGGER IF EXISTS update_blog_posts_updated_at ON public.blog_posts;
--   DROP FUNCTION IF EXISTS public.set_blog_published_at();
--   DROP FUNCTION IF EXISTS public.increment_blog_post_views(UUID);
--   DROP POLICY IF EXISTS "Public can view published blog post tags" ON public.blog_post_tags;
--   DROP POLICY IF EXISTS "Admin full access on blog_post_tags" ON public.blog_post_tags;
--   DROP POLICY IF EXISTS "Public can view blog tags" ON public.blog_tags;
--   DROP POLICY IF EXISTS "Admin full access on blog_tags" ON public.blog_tags;
--   DROP POLICY IF EXISTS "Public can view published blog posts" ON public.blog_posts;
--   DROP POLICY IF EXISTS "Admin full access on blog_posts" ON public.blog_posts;
--   DROP INDEX IF EXISTS idx_blog_tags_slug;
--   DROP INDEX IF EXISTS idx_blog_post_tags_tag_id;
--   DROP INDEX IF EXISTS idx_blog_post_tags_post_id;
--   DROP INDEX IF EXISTS idx_blog_posts_author_id;
--   DROP INDEX IF EXISTS idx_blog_posts_slug;
--   DROP INDEX IF EXISTS idx_blog_posts_published;
--   DROP TABLE IF EXISTS public.blog_post_tags;
--   DROP TABLE IF EXISTS public.blog_tags;
--   DROP TABLE IF EXISTS public.blog_posts;
-- COMMIT;
