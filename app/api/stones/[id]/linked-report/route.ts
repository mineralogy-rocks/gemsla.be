/**
 * SINGLE-WRITER INVARIANT: reports.stone_id is owned by exactly two routes:
 *   - PATCH /api/reports/[uuid]           (report-side link)
 *   - PUT   /api/stones/[id]/linked-report (this file; stone-side link)
 * Both write to the same column (reports.stone_id). No other route or trigger
 * mutates it. Keep both handlers aligned on schema, 23505 handling, and admin
 * gating.
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { getAdminUser } from "@/lib/supabase/admin";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const linkedReportSchema = z.object({
	report_id: z.string().uuid().nullable(),
}).strict();

interface PgErrorLike {
	code?: string;
	message?: string;
	constraint?: string;
}

interface RouteParams {
	params: Promise<{ id: string }>;
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
	try {
		const admin = await getAdminUser();
		if (!admin) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { id: stoneId } = await params;
		if (!stoneId || !UUID_RE.test(stoneId)) {
			return NextResponse.json({ error: "Invalid stone id" }, { status: 400 });
		}

		let body: unknown;
		try {
			body = await request.json();
		} catch {
			return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
		}

		const validation = linkedReportSchema.safeParse(body);
		if (!validation.success) {
			return NextResponse.json(
				{ error: "Invalid report_id", details: validation.error.flatten() },
				{ status: 400 }
			);
		}

		const { report_id } = validation.data;
		const supabase = await createClient();

		const { data: stone, error: stoneError } = await supabase
			.from("stones")
			.select("id")
			.eq("id", stoneId)
			.maybeSingle();
		if (stoneError) {
			console.error("Linked-report: stone lookup error", stoneError);
			return NextResponse.json({ error: "Internal server error" }, { status: 500 });
		}
		if (!stone) {
			return NextResponse.json({ error: "Not found" }, { status: 404 });
		}

		if (report_id === null) {
			const { data, error } = await supabase
				.from("reports")
				.update({ stone_id: null })
				.eq("stone_id", stoneId)
				.select("id");

			if (error) {
				console.error("Linked-report: unlink error", error);
				return NextResponse.json({ error: "Failed to unlink" }, { status: 500 });
			}

			return NextResponse.json({ ok: true, changed: (data || []).length });
		}

		const { data: report, error: reportError } = await supabase
			.from("reports")
			.select("id")
			.eq("id", report_id)
			.maybeSingle();
		if (reportError) {
			console.error("Linked-report: report lookup error", reportError);
			return NextResponse.json({ error: "Internal server error" }, { status: 500 });
		}
		if (!report) {
			return NextResponse.json({ error: "Not found" }, { status: 404 });
		}

		const { data: updated, error: updateError } = await supabase
			.from("reports")
			.update({ stone_id: stoneId })
			.eq("id", report_id)
			.select("id, title, stone_id")
			.maybeSingle();

		if (updateError) {
			const pg = updateError as PgErrorLike;
			if (
				pg.code === "23505" &&
				(pg.constraint === "reports_stone_id_unique" ||
					(pg.message && pg.message.includes("reports_stone_id_unique")))
			) {
				const { data: conflict } = await supabase
					.from("reports")
					.select("id, title")
					.eq("stone_id", stoneId)
					.neq("id", report_id)
					.maybeSingle();

				return NextResponse.json(
					{
						error: "STONE_ALREADY_LINKED",
						linked_report_id: conflict?.id ?? null,
						linked_report_title: conflict?.title ?? null,
					},
					{ status: 409 }
				);
			}

			if (pg.code === "23503") {
				return NextResponse.json({ error: "Not found" }, { status: 404 });
			}

			console.error("Linked-report: update error", updateError);
			return NextResponse.json({ error: "Failed to update link" }, { status: 500 });
		}

		return NextResponse.json({ ok: true, report: updated });
	} catch (error) {
		console.error("Linked-report PUT error", error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}
