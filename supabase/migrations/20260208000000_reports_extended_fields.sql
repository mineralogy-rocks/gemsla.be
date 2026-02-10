-- Add title and caption to report_images
ALTER TABLE public.report_images
	ADD COLUMN title TEXT,
	ADD COLUMN caption TEXT;

-- Add gemological fields to reports
ALTER TABLE public.reports
	ADD COLUMN shape_cutting_style TEXT,
	ADD COLUMN measurements TEXT,
	ADD COLUMN carat_weight NUMERIC,
	ADD COLUMN specific_gravity TEXT,
	ADD COLUMN refractive_index TEXT,
	ADD COLUMN double_refraction TEXT,
	ADD COLUMN polariscope TEXT,
	ADD COLUMN pleochroism TEXT,
	ADD COLUMN chelsea_color_filter TEXT,
	ADD COLUMN fluorescence_sw TEXT,
	ADD COLUMN fluorescence_lw TEXT,
	ADD COLUMN microscope TEXT,
	ADD COLUMN treatment TEXT,
	ADD COLUMN origin TEXT;

-- Add admin-only fields to reports
ALTER TABLE public.reports
	ADD COLUMN owner_telephone TEXT,
	ADD COLUMN currency TEXT,
	ADD COLUMN price NUMERIC;

-- Constraints
ALTER TABLE public.reports
	ADD CONSTRAINT valid_currency CHECK (currency IS NULL OR currency IN ('USD', 'EUR', 'UAH')),
	ADD CONSTRAINT valid_price CHECK (price IS NULL OR price >= 0),
	ADD CONSTRAINT valid_carat_weight CHECK (carat_weight IS NULL OR carat_weight >= 0);

-- RPC function to resolve email -> user ID
CREATE OR REPLACE FUNCTION public.get_user_id_by_email(lookup_email TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
	found_id UUID;
BEGIN
	SELECT id INTO found_id
	FROM auth.users
	WHERE email = lookup_email
	LIMIT 1;

	RETURN found_id;
END;
$$;
