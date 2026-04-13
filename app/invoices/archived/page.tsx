import { redirect } from "next/navigation";

import { getAdminUser } from "@/lib/supabase/admin";
import { InvoiceListClient } from "../InvoiceListClient";
import { fetchInvoices, fetchInvoiceStats } from "../lib/queries";

export const metadata = {
	title: "Archived Invoices",
	description: "View archived invoices",
};

interface PageProps {
	searchParams: Promise<{
		page?: string;
		sort_by?: string;
		sort_dir?: string;
		q?: string;
	}>;
}

export default async function ArchivedInvoicesPage({ searchParams }: PageProps) {
	const adminUser = await getAdminUser();

	if (!adminUser) {
		redirect("/auth/sign-in");
	}

	const params = await searchParams;
	const page = Math.max(1, parseInt(params.page || "1", 10));
	const sortBy = params.sort_by || "created_at";
	const sortDir = params.sort_dir || "desc";
	const q = params.q || "";

	const [initialData, stats] = await Promise.all([
		fetchInvoices({ page, limit: 20, sortBy, sortDir, q, isArchived: true }),
		fetchInvoiceStats(),
	]);

	return <InvoiceListClient initialData={initialData}
	                          stats={stats}
	                          isArchived={true} />;
}