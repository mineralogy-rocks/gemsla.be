-- Make first_name optional
ALTER TABLE public.reports ALTER COLUMN first_name DROP NOT NULL;
ALTER TABLE public.reports DROP CONSTRAINT IF EXISTS reports_first_name_check;

-- Make last_name optional
ALTER TABLE public.reports ALTER COLUMN last_name DROP NOT NULL;
ALTER TABLE public.reports DROP CONSTRAINT IF EXISTS reports_last_name_check;

-- Make owner_email optional
ALTER TABLE public.reports ALTER COLUMN owner_email DROP NOT NULL;
ALTER TABLE public.reports DROP CONSTRAINT IF EXISTS reports_owner_email_check;
