import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/supabase/admin";
import { StoneListClient } from "./StoneListClient";
import { fetchStones } from "./lib/queries";

export const metadata = {
	title: "Stones",
	description: "Manage stone inventory",
};

interface PageProps {
	searchParams: Promise<{
		page?: string;
		q?: string;
		min_price?: string;
		max_price?: string;
		show_sold?: string;
	}>;
}

export default async function StonesPage({ searchParams }: PageProps) {
	const adminUser = await getAdminUser();

	if (!adminUser) {
		redirect("/auth/sign-in");
	}

	const params = await searchParams;
	const page = Math.max(1, parseInt(params.page || "1", 10));
	const q = params.q || "";
	const minPrice = params.min_price || "";
	const maxPrice = params.max_price || "";
	const showSold = params.show_sold === "true";

	const initialData = await fetchStones({ page, q, minPrice, maxPrice, showSold, limit: 12 });

	return <StoneListClient initialData={initialData} />;
}
