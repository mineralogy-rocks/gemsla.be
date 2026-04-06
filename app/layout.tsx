import type {Metadata} from "next";
import {Lora} from "next/font/google";
import "./globals.css";
import {Header} from "./components/Header";
import {Footer} from "./components/Footer";
import {ToastProvider} from "./components/ToastProvider/ToastProvider";
import {createClient} from "@/lib/supabase/server";

const lora = Lora({
	variable: "--font-lora",
	weight: ["400", "500", "600", "700"],
	subsets: ["latin"],
});

export const metadata: Metadata = {
	metadataBase: new URL('https://gemsla.be'),
	title: {
		default: "GemsLabé - Gemological Services & Consulting",
		template: "%s | GemsLabé",
	},
	description: "Professional gemological services by Olena Rybnikova, PhD in Mineralogy. GIA Applied Jewelry Professional offering gemstone consulting, examination, and advanced analysis using Raman spectroscopy, X-ray diffraction, and more.",
	keywords: ["gemology", "mineralogy", "gemstone consulting", "gemological examination", "Raman spectroscopy", "GIA certified", "beryllium minerals", "gemstone analysis"],
	authors: [{name: "Olena Rybnikova"}],
	openGraph: {
		title: "GemsLabé - Gemological Services & Consulting",
		description: "Professional gemological consulting and examination services with advanced analysis methods",
		url: 'https://gemsla.be',
		siteName: 'GemsLabé',
		images: [
			{
				url: '/og-image.png',
				width: 1200,
				height: 630,
				alt: 'GemsLabé - Professional Gemological Services',
			},
		],
		type: "website",
		locale: "en_US",
	},
	twitter: {
		card: 'summary_large_image',
		title: 'GemsLabé - Gemological Services & Consulting',
		description: 'Professional gemological consulting and examination services with advanced analysis methods',
		images: ['/og-image.png'],
	},
	icons: {
		icon: [
			{ url: '/favicon.ico', sizes: 'any' },
			{ url: '/favicon.svg', type: 'image/svg+xml' },
			{ url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
		],
		apple: '/apple-touch-icon.png',
	},
	robots: {
		index: true,
		follow: true,
		googleBot: {
			index: true,
			follow: true,
			'max-video-preview': -1,
			'max-image-preview': 'large',
			'max-snippet': -1,
		},
	},
};

export default async function RootLayout({
                                     children,
                                   }: Readonly<{
	children: React.ReactNode;
}>) {
	const supabase = await createClient();
	const { data: { user } } = await supabase.auth.getUser();
	const isAdmin = user?.app_metadata?.role === "admin";

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
				<Header user={user} isAdmin={isAdmin} />
				{children}
				<Footer />
				<ToastProvider />
			</body>
		</html>
	);
}
