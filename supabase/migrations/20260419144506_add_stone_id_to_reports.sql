-- Migration: Add stone_id 1:1 link from reports to stones
-- Date: 2026-04-19
-- Purpose: Add an optional, unique FK from reports.stone_id -> stones.id so a
--          gemological report can be formally linked to an inventory stone.
--          The legacy reports.stone TEXT column is retained as free-text.
-- Rollback: See bottom of file

BEGIN;

	-- ============================================
	-- SCHEMA CHANGES
	-- ============================================

	ALTER TABLE public.reports
		ADD COLUMN IF NOT EXISTS stone_id UUID
			REFERENCES public.stones(id)
			ON DELETE SET NULL;

	-- Enforce 1:1 (at most one report per stone). NULLs are allowed and
	-- are not considered equal, so many reports may remain unlinked.
	ALTER TABLE public.reports
		DROP CONSTRAINT IF EXISTS reports_stone_id_unique;

	ALTER TABLE public.reports
		ADD CONSTRAINT reports_stone_id_unique UNIQUE (stone_id);

	COMMENT ON COLUMN public.reports.stone_id IS
		'Optional 1:1 link to a stone in public.stones. UNIQUE + FK ON DELETE SET NULL. The legacy reports.stone column is free-text and unrelated.';

COMMIT;

-- ============================================
-- ROLLBACK INSTRUCTIONS
-- ============================================
-- BEGIN;
--   ALTER TABLE public.reports DROP CONSTRAINT IF EXISTS reports_stone_id_unique;
--   ALTER TABLE public.reports DROP COLUMN IF EXISTS stone_id;
-- COMMIT;
