import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/supabase/admin";
import { StoneForm } from "../admin/StoneForm";
import { fetchInvoices } from "../lib/queries";

export const metadata = {
	title: "Add Stone",
	description: "Add a new stone to inventory",
};

export default async function NewStonePage() {
	const adminUser = await getAdminUser();

	if (!adminUser) {
		redirect("/auth/sign-in");
	}

	const invoices = await fetchInvoices();

	return <StoneForm mode="create" invoices={invoices} />;
}
