import { redirect, notFound } from "next/navigation";
import { getAdminUser } from "@/lib/supabase/admin";
import { StoneForm } from "../../admin/StoneForm";
import { fetchStoneById, fetchInvoices } from "../../lib/queries";

interface PageProps {
	params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
	const { id } = await params;
	const stone = await fetchStoneById(id);

	if (!stone) {
		return { title: "Stone Not Found" };
	}

	return {
		title: `Edit ${stone.name}`,
		description: `Edit stone: ${stone.name}`,
	};
}

export default async function EditStonePage({ params }: PageProps) {
	const adminUser = await getAdminUser();

	if (!adminUser) {
		redirect("/auth/sign-in");
	}

	const { id } = await params;
	const [stone, invoices] = await Promise.all([fetchStoneById(id), fetchInvoices()]);

	if (!stone) {
		notFound();
	}

	return <StoneForm mode="edit" initialData={stone} invoices={invoices} />;
}
