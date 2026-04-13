-- Migration: Auto-link issued invoice stones trigger
-- Date: 2026-04-13
-- Purpose: AFTER UPDATE trigger that automatically creates stone_invoices junction
--          records when an issued invoice's parse_status becomes 'completed'.
--          For each item whose item_number is a valid UUID matching an existing stone,
--          a junction record is created. Does NOT mark stones as sold.
-- Rollback: See bottom of file

BEGIN;

	CREATE OR REPLACE FUNCTION public.auto_link_issued_stones()
	RETURNS TRIGGER
	LANGUAGE plpgsql
	AS $$
	DECLARE
		item JSONB;
		item_uuid UUID;
		stone_exists BOOLEAN;
	BEGIN
		IF NEW.type != 'issued' THEN
			RETURN NEW;
		END IF;

		IF NEW.items IS NULL OR jsonb_array_length(NEW.items) = 0 THEN
			RETURN NEW;
		END IF;

		BEGIN
			FOR item IN SELECT jsonb_array_elements(NEW.items)
			LOOP
				IF item->>'item_number' IS NULL OR TRIM(item->>'item_number') = '' THEN
					CONTINUE;
				END IF;

				BEGIN
					item_uuid := (item->>'item_number')::UUID;
				EXCEPTION WHEN invalid_text_representation THEN
					CONTINUE;
				END;

				SELECT EXISTS(
					SELECT 1 FROM public.stones WHERE id = item_uuid
				) INTO stone_exists;

				IF stone_exists THEN
					INSERT INTO public.stone_invoices (stone_id, invoice_id)
					VALUES (item_uuid, NEW.id)
					ON CONFLICT DO NOTHING;
				END IF;
			END LOOP;
		EXCEPTION WHEN OTHERS THEN
			RAISE WARNING 'auto_link_issued_stones: failed for invoice id=% — %', NEW.id, SQLERRM;
		END;

		RETURN NEW;
	END;
	$$;

	DROP TRIGGER IF EXISTS trg_auto_link_issued_stones ON public.invoices;

	CREATE TRIGGER trg_auto_link_issued_stones
	AFTER UPDATE OF parse_status ON public.invoices
	FOR EACH ROW
	WHEN (NEW.parse_status = 'completed')
	EXECUTE FUNCTION public.auto_link_issued_stones();

COMMIT;

-- ============================================
-- ROLLBACK INSTRUCTIONS
-- ============================================
-- BEGIN;
--   DROP TRIGGER IF EXISTS trg_auto_link_issued_stones ON public.invoices;
--   DROP FUNCTION IF EXISTS public.auto_link_issued_stones();
-- COMMIT;
