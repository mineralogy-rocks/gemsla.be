import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/supabase/admin";
import { ReportsListClient } from "./ReportsListClient";
import { fetchReportsList, type FilterType } from "./lib/queries";

export const metadata = {
	title: "Reports",
	description: "Manage gemological certificates",
};

interface PageProps {
	searchParams: Promise<{
		page?: string;
		filter?: string;
		search?: string;
	}>;
}

export default async function ReportsPage({ searchParams }: PageProps) {
	const adminUser = await getAdminUser();

	if (!adminUser) {
		redirect("/auth/sign-in");
	}

	const params = await searchParams;
	const page = Math.max(1, parseInt(params.page || "1", 10));
	const filter = (["all", "public", "private"].includes(params.filter || "")
		? params.filter
		: "all") as FilterType;
	const search = params.search || "";

	const initialData = await fetchReportsList({ page, filter, search, limit: 12 });

	return <ReportsListClient initialData={initialData} />;
}