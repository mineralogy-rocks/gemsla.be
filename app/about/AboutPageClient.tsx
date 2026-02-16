"use client";

import Image from "next/image";
import Link from "next/link";
import {Button3D} from "../components/Button3D";

const education = [
	{
		institution: "Comenius University in Bratislava",
		degree: "Doctor of Philosophy (PhD)",
		field: "Mineralogy and Gemmology",
		period: "Sep 2019 – Aug 2023",
	},
	{
		institution: "Taras Shevchenko National University of Kyiv",
		degree: "Master's Degree",
		field: "Gemology, Mineralogy, Geochemistry, Petrology",
		period: "2013 – 2019",
	},
];

const certifications = [
	{name: "Gem Identification", issued: "Aug 2025 - ongoing"},
	{name: "Gem Identification Lab", issued: "Nov 2023"},
	{name: "Colored Stones", issued: "Sep 2022"},
	{name: "Diamonds & Diamond Grading", issued: "Aug 2022"},
	{name: "Graduate Diamonds", issued: "Aug 2022"},
	{name: "Applied Jewelry Professional", issued: "2021"},
	{name: "Diamond Essentials Certificate", issued: "Mar 2021"},
	{name: "Colored Stone Essentials Certificate", issued: "Feb 2021"},
	{name: "Jewelry Essentials Certificate", issued: "Feb 2021"},
];

const publications = [
	{
		title: "Forensic gemmological investigation based on optical and crystal-chemical changes in topaz from Ouro Preto and Caraí, Brazil, induced by heat treatment",
		journal: "Scientific Reports",
		date: "Dec 2025",
		url: "https://www.nature.com/articles/s41598-025-33599-y",
	},
	{
		title: "Characterization of chrysoberyl and its gemmological varieties by Raman spectroscopy",
		journal: "Journal of Raman Spectroscopy",
		date: "Jun 2023",
		url: "https://analyticalsciencejournals.onlinelibrary.wiley.com/doi/full/10.1002/jrs.6566",
	},
	{
		title: "Chrysoberyl and associated beryllium minerals resulting from metamorphic overprint of the Maršíkov-Schinderhübel-III pegmatite, Czech Republic",
		journal: "Mineralogical Magazine",
		date: "Mar 2023",
		url: "https://www.cambridge.org/core/journals/mineralogical-magazine/article/abs/chrysoberyl-and-associated-beryllium-minerals-resulting-from-metamorphic-overprint-of-the-marsikov-schinderhubel-iii-pegmatite-czech-republic/BAB26257DC4AD16E79B43D6A54D68516",
	},
	{
		title: "Crystal-Chemical and Spectroscopic Study of Gem Sphalerite from Banská Štiavnica, Slovakia",
		journal: "Minerals",
		date: "Jan 2023",
		url: "https://www.mdpi.com/2075-163x/13/1/109",
	},
	{
		title: "Complex study of chrysoberyl from the Maršíkov pegmatite, Czech Republic",
		journal: "IMA 2022, Lyon, France (Poster)",
		date: "2022",
		url: "https://www.researchgate.net/publication/369814709_Complex_study_of_chrysoberyl_from_the_Marsikov_pegmatite_Czech_Republic",
	},
	{
		title: "Apatite from Slovakia",
		journal: "The Journal of Gemmology",
		date: "Jun 2022",
		url: "https://www.researchgate.net/publication/361593998_Apatite_from_Slovakia",
	},
];

export function AboutPageClient() {
	return (
		<div className="min-h-screen relative">
			<div className="fixed inset-0 z-0 opacity-10 pointer-events-none"
			     style={{
				     backgroundImage: 'url("/NNNoise Texture Generator.svg")',
				     backgroundSize: "400px 400px",
				     backgroundRepeat: "repeat",
			     }} />

			<main>
				{/* Hero Section */}
				<section className="relative min-h-[70vh] flex items-center justify-end overflow-hidden z-10 pt-16">
					<div className="relative z-10 text-right px-4 sm:px-6 lg:px-8 max-w-4xl lg:mr-44">
						<div className="mb-8 flex justify-end">
							<div className="relative w-48 h-48 sm:w-64 sm:h-64 rounded-full overflow-hidden border-4 border-border-light">
								<Image src="/images/olena-portrait.jpg"
								       alt="Olena Rybnikova - Gemologist and Researcher"
								       fill
								       className="object-cover"
								       style={{ objectPosition: 'center 45%' }}
								       priority
								       sizes="(max-width: 640px) 192px, 256px" />
							</div>
						</div>
						<h1 className="mb-2">
							Olena Rybnikova
						</h1>
						<p className="text-lg sm:text-xl text-text-gray mb-6">
							PhD in Mineralogy
						</p>
						<p className="text-xl sm:text-2xl text-text-gray">
							Gemologist & Researcher
						</p>
					</div>
				</section>

				{/* Biography Section */}
				<section className="relative py-16 px-4 sm:px-6 lg:px-8 z-10">
					<article className="max-w-2xl mx-auto">
						<p className="text-lg text-foreground leading-relaxed mb-8">
							I&apos;m a gemologist with a deep love for the science and beauty of gemstones. Based in Bratislava, Slovakia, I combine academic training in mineralogy with hands-on expertise to help clients make confident decisions about precious stones.
						</p>

						<p className="text-lg text-foreground leading-relaxed mb-8">
							My journey into gemology began at Taras Shevchenko National University of Kyiv, where I earned my Master&apos;s degree in Gemology, Mineralogy, Geochemistry, and Petrology. I continued my academic path at Comenius University in Bratislava, where I completed my PhD in Mineralogy and Petrology, researching beryl and chrysoberyl specimens.
						</p>

						<p className="text-lg text-foreground leading-relaxed">
							To complement my academic background, I obtained certifications from the Gemological Institute of America (GIA), including credentials in colored stones, diamond grading, and jewelry essentials. This combination of scientific rigor and practical gemological training allows me to provide thorough, accurate assessments for collectors, jewelers, and anyone curious about gems.
						</p>
					</article>
				</section>

				{/* Education Section */}
				<section className="relative py-16 px-4 sm:px-6 lg:px-8 z-10 bg-background-creme">
					<div className="max-w-2xl mx-auto">
						<h2 className="text-2xl sm:text-3xl mb-12 text-right">
							Education
						</h2>

						<div className="space-y-8">
							{education.map((edu, index) => (
								<div key={index}
								     className="border-b border-border-light pb-6 last:border-b-0">
									<h3 className="text-lg font-semibold mb-1">{edu.institution}</h3>
									<p className="text-foreground mb-1">{edu.degree}</p>
									<p className="text-text-gray text-sm mb-1">{edu.field}</p>
									<p className="text-text-gray text-sm">{edu.period}</p>
								</div>
							))}
						</div>
					</div>
				</section>

				{/* Certifications Section */}
				<section className="relative py-16 px-4 sm:px-6 lg:px-8 z-10">
					<div className="max-w-2xl mx-auto">
						<h2 className="text-2xl sm:text-3xl mb-2 text-right">
							GIA Certifications
						</h2>
						<p className="text-right text-text-gray mb-12">
							Gemological Institute of America
						</p>

						<ul className="space-y-4">
							{certifications.map((cert, index) => (
								<li key={index}
								    className="flex justify-between items-baseline border-b border-border-light pb-3">
									<span className="font-medium text-foreground">{cert.name}</span>
									<span className="text-sm text-text-gray ml-4">{cert.issued}</span>
								</li>
							))}
						</ul>
					</div>
				</section>

				{/* Publications Section */}
				<section className="relative py-16 px-4 sm:px-6 lg:px-8 z-10 bg-background-creme">
					<div className="max-w-2xl mx-auto">
						<h2 className="text-2xl sm:text-3xl mb-12 text-right">
							Academic Publications
						</h2>

						<ul className="space-y-6">
							{publications.map((pub, index) => (
								<li key={index}
								    className="border-b border-border pb-6 last:border-b-0">
									{pub.url ? (
										<a href={pub.url}
										   target="_blank"
										   rel="noopener noreferrer"
										   className="text-foreground hover:text-callout-accent transition-colors duration-300 underline underline-offset-2">
											{pub.title}
										</a>
									) : (
										<span className="text-foreground">{pub.title}</span>
									)}
									<p className="text-text-gray text-sm mt-2">
										{pub.journal} &middot; {pub.date}
									</p>
								</li>
							))}
						</ul>
					</div>
				</section>

				{/* Gallery & CTA Section */}
				<section className="relative py-16 px-4 sm:px-6 lg:px-8 z-10">
					<div className="max-w-4xl mx-auto">
						{/* Asymmetric Gallery */}
						<div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-12 md:h-[500px]">
							{/* Primary image - 3/5 width on desktop */}
							<div className="md:col-span-3 relative aspect-[4/3] md:aspect-auto rounded-lg overflow-hidden">
								<Image src="/images/gallery-colorwheel.jpg"
								       alt="Analyzing a green gemstone against a professional color wheel"
								       fill
								       className="object-cover"
								       sizes="(max-width: 768px) 100vw, 60vw" />
							</div>

							{/* Supporting images stack - 2/5 width */}
							<div className="md:col-span-2 flex flex-col gap-4">
								<div className="relative aspect-[3/2] md:aspect-auto md:flex-1 rounded-lg overflow-hidden">
									<Image src="/images/gallery-tools.jpg"
									       alt="Gemological tools including loupe and tweezers"
									       fill
									       className="object-cover"
									       sizes="(max-width: 768px) 100vw, 40vw" />
								</div>
								<div className="relative aspect-[3/2] md:aspect-auto md:flex-1 rounded-lg overflow-hidden">
									<Image src="/images/gallery-examining.jpg"
									       alt="Examining a gemstone through a loupe"
									       fill
									       className="object-cover"
									       style={{ objectPosition: 'center 25%' }}
									       sizes="(max-width: 768px) 100vw, 40vw" />
								</div>
							</div>
						</div>

						<div className="text-center">
							<p className="text-lg text-foreground leading-relaxed mb-8">
								Have a gemstone you&apos;d like examined, or questions about buying one? I&apos;d love to help.
							</p>
							<Link href="/contact" passHref legacyBehavior>
								<Button3D as="a"
								          href="/contact"
								          variant="secondary"
								          size="md">
									<span className="font-medium">Get in Touch</span>
								</Button3D>
							</Link>
						</div>
					</div>
				</section>
			</main>
		</div>
	);
}
