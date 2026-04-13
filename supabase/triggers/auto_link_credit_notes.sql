-- Trigger: auto_link_credit_note
-- Purpose: Auto-link credit notes to their parent invoices when parse_status transitions to 'completed'.
--          Also back-fills existing unlinked credit notes when a parent invoice is parsed.
-- Migration: 20260412000000_auto_link_credit_notes_trigger.sql
-- Date: 2026-04-12

CREATE INDEX IF NOT EXISTS idx_invoices_number_order
	ON public.invoices(invoice_number, order_number)
	WHERE is_archived = FALSE;

CREATE OR REPLACE FUNCTION public.auto_link_credit_note()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
	match_id UUID;
BEGIN
	-- Only act when parse_status transitions to 'completed'
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

		-- Case 2: A regular invoice was just parsed — back-fill unlinked credit notes that reference it
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
