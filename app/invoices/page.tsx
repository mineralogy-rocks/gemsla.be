import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/supabase/admin";
import { InvoiceListClient } from "./InvoiceListClient";
import { fetchInvoices, fetchInvoiceStats } from "./lib/queries";

export const metadata = {
	title: "Invoices",
	description: "Manage invoices and PDF documents",
};

interface PageProps {
	searchParams: Promise<{
		page?: string;
		sort_by?: string;
		sort_dir?: string;
		q?: string;
		is_processed?: string;
		is_paid?: string;
		show_refunds?: string;
	}>;
}

export default async function InvoicesPage({ searchParams }: PageProps) {
	const adminUser = await getAdminUser();

	if (!adminUser) {
		redirect("/auth/sign-in");
	}

	const params = await searchParams;
	const page = Math.max(1, parseInt(params.page || "1", 10));
	const sortBy = params.sort_by || "created_at";
	const sortDir = params.sort_dir || "desc";
	const q = params.q || "";
	const isProcessed = params.is_processed === "1";
	const isPaid = params.is_paid === "1";
	const showRefunds = params.show_refunds === "1";

	const [initialData, stats] = await Promise.all([
		fetchInvoices({ page, limit: 20, sortBy, sortDir, q, isProcessed, isPaid, showRefunds }),
		fetchInvoiceStats(),
	]);

	return <InvoiceListClient initialData={initialData}
	                          stats={stats} />;
}
