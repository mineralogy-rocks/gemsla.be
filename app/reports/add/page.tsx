import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/supabase/admin";
import { ReportFormClient } from "./ReportFormClient";

export const metadata = {
	title: "New Report",
	description: "Create a new gem lab report",
};

export default async function AddReportPage() {
	const adminUser = await getAdminUser();

	if (!adminUser) {
		redirect("/auth/sign-in");
	}

	return <ReportFormClient mode="create" />;
}
