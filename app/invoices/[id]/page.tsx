import { notFound, redirect } from "next/navigation";
import { getAdminUser } from "@/lib/supabase/admin";
import { fetchInvoiceById } from "../lib/queries";
import { InvoiceDetailClient } from "./InvoiceDetailClient";

interface PageProps {
	params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
	const { id } = await params;
	const invoice = await fetchInvoiceById(id);

	if (!invoice) {
		return { title: "Invoice Not Found" };
	}

	return {
		title: invoice.invoice_number || "Invoice",
		description: `Invoice details: ${invoice.invoice_number || invoice.id}`,
	};
}

export default async function InvoiceDetailPage({ params }: PageProps) {
	const adminUser = await getAdminUser();

	if (!adminUser) {
		redirect("/auth/sign-in");
	}

	const { id } = await params;
	const invoice = await fetchInvoiceById(id);

	if (!invoice) {
		notFound();
	}

	return <InvoiceDetailClient invoice={invoice} />;
}
