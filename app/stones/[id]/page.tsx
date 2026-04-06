import { notFound, redirect } from "next/navigation";
import { getAdminUser } from "@/lib/supabase/admin";
import { fetchStoneById } from "../lib/queries";
import { StoneDetailClient } from "./StoneDetailClient";

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
		title: stone.name,
		description: `Stone details: ${stone.name}`,
	};
}

export default async function StoneDetailPage({ params }: PageProps) {
	const adminUser = await getAdminUser();

	if (!adminUser) {
		redirect("/auth/sign-in");
	}

	const { id } = await params;
	const stone = await fetchStoneById(id);

	if (!stone) {
		notFound();
	}

	return <StoneDetailClient stone={stone} />;
}
