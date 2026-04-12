-- Migration: Auto-link credit notes trigger
-- Date: 2026-04-12
-- Purpose: Add partial composite index and BEFORE UPDATE trigger that automatically
--          links credit notes to their parent invoices when parse_status becomes 'completed'.
-- Rollback: See bottom of file

BEGIN;

	-- Partial composite index for matching invoices by invoice_number + order_number
	-- among non-archived rows (used by both trigger cases)
	CREATE INDEX IF NOT EXISTS idx_invoices_number_order
		ON public.invoices(invoice_number, order_number)
		WHERE is_archived = FALSE;

	-- Trigger function: fired BEFORE UPDATE OF parse_status
	-- Case 1: credit note parsed  → find parent invoice and set refund_of
	-- Case 2: regular invoice parsed → back-fill unlinked credit notes that reference it
	-- Errors are caught and emitted as WARNINGs so the parse update is never blocked.
	CREATE OR REPLACE FUNCTION public.auto_link_credit_note()
	RETURNS TRIGGER
	LANGUAGE plpgsql
	AS $$
	DECLARE
		match_id UUID;
	BEGIN
		-- Guard: only act on the completed transition
		IF NEW.parse_status IS DISTINCT FROM 'completed'
			OR OLD.parse_status IS NOT DISTINCT FROM 'completed'
		THEN
			RETURN NEW;
		END IF;

		BEGIN
			-- Case 1: A credit note was just parsed — find and link its parent invoice
			IF NEW.type = 'credit_note'
				AND NEW.original_invoice_number IS NOT NULL
				AND NEW.refund_of IS NULL
			THEN
				SELECT id INTO match_id
				FROM public.invoices
				WHERE invoice_number = NEW.original_invoice_number
					AND (
						(order_number IS NULL AND NEW.order_number IS NULL)
						OR order_number = NEW.order_number
					)
					AND type != 'credit_note'
					AND is_archived = FALSE
				LIMIT 1;

				IF match_id IS NOT NULL THEN
					NEW.refund_of := match_id;
				END IF;

			-- Case 2: A regular invoice was just parsed — back-fill unlinked credit notes
			ELSIF NEW.type != 'credit_note'
				AND NEW.invoice_number IS NOT NULL
			THEN
				UPDATE public.invoices
				SET refund_of = NEW.id
				WHERE original_invoice_number = NEW.invoice_number
					AND (
						(order_number IS NULL AND NEW.order_number IS NULL)
						OR order_number = NEW.order_number
					)
					AND type = 'credit_note'
					AND refund_of IS NULL
					AND is_archived = FALSE;
			END IF;

		EXCEPTION WHEN OTHERS THEN
			RAISE WARNING 'auto_link_credit_note: failed for invoice id=% — %', NEW.id, SQLERRM;
		END;

		RETURN NEW;
	END;
	$$;

	DROP TRIGGER IF EXISTS trg_auto_link_credit_note ON public.invoices;

	CREATE TRIGGER trg_auto_link_credit_note
	BEFORE UPDATE OF parse_status ON public.invoices
	FOR EACH ROW
	WHEN (NEW.parse_status = 'completed')
	EXECUTE FUNCTION public.auto_link_credit_note();

COMMIT;

-- ============================================
-- ROLLBACK INSTRUCTIONS
-- ============================================
-- BEGIN;
--   DROP TRIGGER IF EXISTS trg_auto_link_credit_note ON public.invoices;
--   DROP FUNCTION IF EXISTS public.auto_link_credit_note();
--   DROP INDEX IF EXISTS idx_invoices_number_order;
-- COMMIT;
