import type {Metadata} from "next";
import {Lora} from "next/font/google";
import "./globals.css";
import {Header} from "./components/Header";
import {Footer} from "./components/Footer";

const lora = Lora({
	variable: "--font-lora",
	weight: ["400", "500", "600", "700"],
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "GemsLabé - Gemological Services & Consulting",
	description: "Professional gemological services by Olena Rybnikova, PhD in Mineralogy. GIA Applied Jewelry Professional offering gemstone consulting, examination, and advanced analysis using Raman spectroscopy, X-ray diffraction, and more.",
	keywords: ["gemology", "mineralogy", "gemstone consulting", "gemological examination", "Raman spectroscopy", "GIA certified", "beryllium minerals", "gemstone analysis"],
	authors: [{name: "Olena Rybnikova"}],
	openGraph: {
		title: "MSc Olena Rybnikova, PhD - Gemological Services",
		description: "Professional gemological consulting and examination services with advanced analysis methods",
		type: "website",
		locale: "en_US",
	},
};

export default function RootLayout({
                                     children,
                                   }: Readonly<{
	children: React.ReactNode;
}>) {
	const structuredData = {
		"@context": "https://schema.org",
		"@type": "ProfessionalService",
		"name": "Olena Rybnikova - Gemological Services",
		"description": "Professional gemological services including consulting, examination, and advanced analysis",
		"provider": {
			"@type": "Person",
			"name": "Olena Rybnikova",
			"jobTitle": "PhD in Mineralogy, Applied Jewelry Professional",
			"email": "olena.rybnikova@gmail.com",
			"telephone": "+421919206955",
			"sameAs": "https://www.instagram.com/olena_rybnikova",
		},
		"address": {
			"@type": "PostalAddress",
			"streetAddress": "Karpatske namestie 7770/10A",
			"addressLocality": "Bratislava",
			"postalCode": "831 06",
			"addressCountry": "SK",
		},
	};

	return (
		<html lang="en">
			<head>
				<script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify(structuredData)}} />
			</head>
			<body className={`${lora.variable} ${lora.className} antialiased`}>
				<Header />
				{children}
				<Footer />
			</body>
		</html>
	);
}
