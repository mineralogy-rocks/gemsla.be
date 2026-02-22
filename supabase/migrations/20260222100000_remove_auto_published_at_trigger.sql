BEGIN;
	DROP TRIGGER IF EXISTS set_blog_posts_published_at ON public.blog_posts;
	DROP FUNCTION IF EXISTS public.set_blog_published_at();
COMMIT;
