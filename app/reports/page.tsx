import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/supabase/admin";
import { ReportsListClient } from "./ReportsListClient";

export const metadata = {
	title: "Reports | GemsLaBe",
	description: "Manage gem lab reports",
};

export default async function ReportsPage() {
	const adminUser = await getAdminUser();

	if (!adminUser) {
		redirect("/auth/sign-in");
	}

	return <ReportsListClient />;
}
