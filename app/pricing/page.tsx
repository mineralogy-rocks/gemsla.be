import type {Metadata} from "next";
import {PricingPageClient} from "./PricingPageClient";

export const metadata: Metadata = {
	title: "Services & Pricing",
	description: "Transparent pricing for professional gemological services. From initial consultations (€90) to comprehensive analysis (€320) with Raman spectroscopy, X-ray diffraction, and detailed certificates.",
	openGraph: {
		title: "Services & Pricing | GemsLabé",
		description: "Transparent pricing for gemological services: consultations, examinations, and comprehensive analysis with scientific documentation.",
		url: 'https://gemsla.be/pricing',
	},
};

export default function PricingPage() {
	return <PricingPageClient />;
}
