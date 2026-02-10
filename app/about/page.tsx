import type {Metadata} from "next";
import {AboutPageClient} from "./AboutPageClient";

export const metadata: Metadata = {
	title: "About Olena",
	description: "Meet Olena Rybnikova - PhD in Mineralogy, GIA-certified gemologist with expertise in gemstone analysis, Raman spectroscopy, and gemological consulting.",
	openGraph: {
		title: "About Olena | GemsLabé",
		description: "PhD in Mineralogy, GIA-certified gemologist with expertise in gemstone analysis, Raman spectroscopy, and gemological consulting.",
		url: 'https://gemsla.be/about',
	},
};

export default function AboutPage() {
	return <AboutPageClient />;
}
