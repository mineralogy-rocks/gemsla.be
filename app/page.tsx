"use client";

import {motion} from "framer-motion";
import {fadeInUp, staggerContainer, staggerItem, fadeInLeft} from "./lib/animations";

export default function Home() {
	return (
		<div className="min-h-screen relative">
			{/* Skip Link for Accessibility */}
			<a href="#main-content"
			   className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-foreground focus:text-background focus:rounded">
				Skip to main content
			</a>

			{/* Background Noise Texture */}
			<div className="fixed inset-0 z-0 opacity-10 pointer-events-none"
			     style={{
				     backgroundImage: 'url("/NNNoise Texture Generator.svg")',
				     backgroundSize: '400px 400px',
				     backgroundRepeat: 'repeat'
			     }} />

			<main id="main-content">
				{/* Hero Section */}
				<section className="relative min-h-screen flex items-center justify-center overflow-hidden z-10">
					<div className="absolute inset-0 opacity-15">
					</div>
					<motion.div className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto"
					            initial="hidden"
					            animate="visible"
					            variants={staggerContainer}>
						<motion.h1 className="mb-6"
						           variants={fadeInUp}>
							OLENA RYBNIKOVA
						</motion.h1>
						<motion.p className="text-xl sm:text-2xl md:text-3xl text-text-gray mb-4"
						          variants={fadeInUp}>
							PhD in Mineralogy
						</motion.p>
						<motion.p className="text-lg sm:text-xl text-text-gray"
						          variants={fadeInUp}>
							Applied Jewelry Professional (GIA)
						</motion.p>
						<motion.div className="text-center mt-10"
						            variants={fadeInUp}>
							<a href="/contact"
							   className="inline-block px-8 py-3 border-2 border-foreground text-foreground rounded-full hover:bg-accent hover:text-background transition-all duration-300">
								Contact Me
							</a>
						</motion.div>
					</motion.div>

				</section>

				{/* Services Section */}
				<motion.section id="services"
				                className="relative py-20 px-4 sm:px-6 lg:px-8 z-10"
				                initial="hidden"
				                whileInView="visible"
				                viewport={{once: true, margin: "-100px"}}
				                variants={fadeInUp}>
					<div className="max-w-5xl mx-auto">
						<h2 className="text-left mb-20">
							SERVICES
						</h2>
						<motion.div className="grid grid-cols-1 md:grid-cols-2 gap-16 mb-20"
						            variants={staggerContainer}
						            initial="hidden"
						            whileInView="visible"
						            viewport={{once: true, margin: "-100px"}}>
							{/* Gemological Consulting */}
							<motion.article className="border-l-2 border-foreground pl-8"
							                variants={fadeInLeft}>
								<h3 className="text-2xl sm:text-3xl font-semibold mb-4 text-foreground">
									Gemological Consulting
								</h3>
								<p className="text-text-gray leading-relaxed">
									Expert guidance through gemstone acquisition, quality assessment, and investment decisions. Professional consulting backed by scientific expertise for cut stones and rough material.
								</p>
							</motion.article>

							{/* Gemological Examination */}
							<motion.article className="border-l-2 border-foreground-muted pl-8"
							                variants={fadeInLeft}>
								<h3 className="text-2xl sm:text-3xl font-semibold mb-4 text-foreground">
									Gemological Examination
								</h3>
								<p className="text-text-gray leading-relaxed">
									Comprehensive stone analysis, quality evaluation, and precise identification. Every gemstone analyzed with meticulous attention to detail and scientific rigor.
								</p>
							</motion.article>
						</motion.div>

						{/* Analysis Methods */}
						<div className="mt-20 border-t border-border-light pt-16">
							<h3 className="text-xl sm:text-2xl font-light mb-12 text-foreground text-center">
								Advanced Analysis Methods
							</h3>
							<motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
							            variants={staggerContainer}
							            initial="hidden"
							            whileInView="visible"
							            viewport={{once: true, margin: "-100px"}}>
								{[
									"Raman Spectroscopy",
									"X-ray Diffraction",
									"NMR Spectroscopy",
									"Fluorescence Spectroscopy",
									"Electrochemical Analysis",
									"Optical Analysis",
								].map((method, index) => (
									<motion.div key={index}
									            className="text-center py-4 border-b border-border-light"
									            variants={staggerItem}>
										<p className="text-foreground">{method}</p>
									</motion.div>
								))}
							</motion.div>
						</div>
					</div>
				</motion.section>

				{/* Certifications Section */}
				<motion.section id="certifications"
				                className="relative py-20 px-4 sm:px-6 lg:px-8 z-10"
				                initial="hidden"
				                whileInView="visible"
				                viewport={{once: true, margin: "-100px"}}
				                variants={fadeInUp}>
					<div className="max-w-5xl mx-auto">
						<h2 className="text-left mb-20">
							CERTIFICATIONS
						</h2>
						<motion.div className="space-y-6"
						            variants={staggerContainer}
						            initial="hidden"
						            whileInView="visible"
						            viewport={{once: true, margin: "-100px"}}>
							{[
								{title: "GIA Colored Stones", date: "September 2022"},
								{title: "Diamonds & Diamond Grading", date: "August 2022"},
								{title: "Graduate Diamonds", date: "August 2022"},
								{title: "Applied Jewelry Professional Diploma", date: "March 2021"},
								{title: "Diamond Essentials Certificate", date: "March 2021"},
								{title: "Colored Stone Essentials Certificate", date: "February 2021"},
								{title: "Jewelry Essentials Certificate", date: "February 2021"},
							].map((cert, index) => (
								<motion.article key={index}
								                className="flex justify-between items-center flex-wrap gap-4 py-4 border-b border-border-light"
								                variants={staggerItem}>
									<h4 className="text-lg sm:text-xl font-light text-foreground">
										{cert.title}
									</h4>
									<span className="text-text-gray text-sm">{cert.date}</span>
								</motion.article>
							))}
						</motion.div>
					</div>
				</motion.section>

				{/* Education Section */}
				<motion.section id="education"
				                className="relative py-20 px-4 sm:px-6 lg:px-8 z-10"
				                initial="hidden"
				                whileInView="visible"
				                viewport={{once: true, margin: "-100px"}}
				                variants={fadeInUp}>
					<div className="max-w-5xl mx-auto">
						<h2 className="text-right mb-20">
							EDUCATION
						</h2>
						<motion.div className="space-y-16"
						            variants={staggerContainer}
						            initial="hidden"
						            whileInView="visible"
						            viewport={{once: true, margin: "-100px"}}>
							{/* PhD */}
							<motion.article className="border-l-2 border-foreground pl-8"
							                variants={fadeInLeft}>
								<h3 className="text-2xl sm:text-3xl font-light mb-3 text-foreground">
									PhD in Mineralogy
								</h3>
								<p className="text-text-gray mb-4 text-sm">
									September 2019 - August 2023
								</p>
								<p className="text-foreground mb-4">
									Comenius University in Bratislava, Slovakia
								</p>
								<p className="text-text-gray leading-relaxed italic">
									&quot;Beryllium minerals in granitic pegmatites: indicators
									of metamorphic and hydrothermal overprint&quot;
								</p>
							</motion.article>

							{/* MSc */}
							<motion.article className="border-l-2 border-foreground-muted pl-8"
							                variants={fadeInLeft}>
								<h3 className="text-2xl sm:text-3xl font-light mb-3 text-foreground">
									MSc in Geochemistry & Mineralogy
								</h3>
								<p className="text-text-gray mb-4 text-sm">
									September 2016 - August 2019
								</p>
								<p className="text-foreground">
									Taras Shevchenko National University, Kyiv, Ukraine
								</p>
							</motion.article>
						</motion.div>
					</div>
				</motion.section>

				{/* Publications Section */}
				<motion.section id="publications"
				                className="relative py-20 px-4 sm:px-6 lg:px-8 z-10"
				                initial="hidden"
				                whileInView="visible"
				                viewport={{once: true, margin: "-100px"}}
				                variants={fadeInUp}>
					<div className="max-w-5xl mx-auto">
						<h2 className="text-right mb-20">
							PUBLICATIONS
						</h2>
						<motion.div className="space-y-12"
						            variants={staggerContainer}
						            initial="hidden"
						            whileInView="visible"
						            viewport={{once: true, margin: "-100px"}}>
							{/* Publication 1 */}
							<motion.article className="pb-8 border-b border-border-light"
							                variants={staggerItem}>
								<h4 className="text-lg font-light text-foreground mb-3">
									Raman spectroscopy study of synthetic beryl crystals
								</h4>
								<p className="text-text-gray text-sm mb-4">
									Journal of Raman Spectroscopy
								</p>
								<a href="https://analyticalsciencejournals.onlinelibrary.wiley.com/doi/full/10.1002/jrs.6566"
								   target="_blank"
								   rel="noopener noreferrer"
								   className="text-foreground hover:text-accent-hover transition-colors duration-300 text-sm">
									Read Publication
								</a>
							</motion.article>

							{/* Publication 2 */}
							<motion.article className="pb-8 border-b border-border-light"
							                variants={staggerItem}>
								<h4 className="text-lg font-light text-foreground mb-3">
									Chrysoberyl and associated beryllium minerals resulting from
									metamorphic overprint of the Marsikov-Schinderhubel III
									pegmatite, Czech Republic
								</h4>
								<p className="text-text-gray text-sm mb-4">
									Mineralogical Magazine
								</p>
								<a href="https://www.cambridge.org/core/journals/mineralogical-magazine/article/abs/chrysoberyl-and-associated-beryllium-minerals-resulting-from-metamorphic-overprint-of-the-marsikov-schinderhubel-iii-pegmatite-czech-republic/BAB26257DC4AD16E79B43D6A54D68516"
								   target="_blank"
								   rel="noopener noreferrer"
								   className="text-foreground hover:text-accent-hover transition-colors duration-300 text-sm">
									Read Publication
								</a>
							</motion.article>
						</motion.div>
					</div>
				</motion.section>

				{/* Experience Section */}
				<motion.section id="experience"
				                className="relative py-20 px-4 sm:px-6 lg:px-8 z-10"
				                initial="hidden"
				                whileInView="visible"
				                viewport={{once: true, margin: "-100px"}}
				                variants={fadeInUp}>
					<div className="max-w-5xl mx-auto">
						<h2 className="text-right mb-20">
							EXPERIENCE
						</h2>
						<motion.article className="border-l-2 border-foreground pl-8"
						                variants={fadeInLeft}>
							<h3 className="text-2xl sm:text-3xl font-light mb-4 text-foreground">
								Contributing Author
							</h3>
							<p className="text-foreground mb-6">
								International Gem Society
							</p>
							<p className="text-text-gray leading-relaxed mb-6">
								Gemologist and mineralogist specializing in beryllium minerals, actively promoting knowledge and appreciation of nature, geology, and gemstones. Author of 15+ comprehensive articles covering mineralogy, gemstone identification, crystal systems, and advanced analytical techniques.
							</p>
							<a href="https://www.gemsociety.org/author/olenarybnikova/"
							   target="_blank"
							   rel="noopener noreferrer"
							   className="text-foreground hover:text-accent-hover transition-colors duration-300 text-sm">
								View Articles
							</a>
						</motion.article>
					</div>
				</motion.section>

				{/* Legal Section */}
				<motion.section id="legal"
				                className="relative py-20 px-4 sm:px-6 lg:px-8 z-10"
				                initial="hidden"
				                whileInView="visible"
				                viewport={{once: true, margin: "-100px"}}
				                variants={fadeInUp}>
					<div className="max-w-5xl mx-auto">
						<h2 className="text-center mb-20">
							LEGAL
						</h2>
						<div className="border-t border-border-light pt-12">
							<h3 className="text-2xl sm:text-3xl font-light mb-8 text-center text-foreground">
								Rutheniai s.r.o.
							</h3>
							<motion.div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-3xl mx-auto"
							            variants={staggerContainer}
							            initial="hidden"
							            whileInView="visible"
							            viewport={{once: true, margin: "-100px"}}>
								<motion.address className="space-y-6 not-italic"
								                variants={staggerItem}>
									<div>
										<p className="text-text-gray text-sm mb-2">Registration Number</p>
										<p className="text-foreground">57 211 604</p>
									</div>

									<div>
										<p className="text-text-gray text-sm mb-2">Legal Form</p>
										<p className="text-foreground">Limited Liability Company</p>
									</div>

									<div>
										<p className="text-text-gray text-sm mb-2">Registration Date</p>
										<p className="text-foreground">September 19, 2025</p>
									</div>
								</motion.address>
								<motion.address className="space-y-6 not-italic"
								                variants={staggerItem}>
									<div>
										<p className="text-text-gray text-sm mb-2">Headquarters</p>
										<p className="text-foreground">
											Karpatske namestie 7770/10A<br />
											Bratislava - Raca, 831 06<br />
											Slovakia
										</p>
									</div>

									<div>
										<p className="text-text-gray text-sm mb-2">Business Activities</p>
										<p className="text-foreground">
											Research and development in natural, technical, social, and humanitarian sciences
										</p>
									</div>
								</motion.address>
							</motion.div>
						</div>
					</div>
				</motion.section>

				<motion.section id="contact"
				                className="relative py-20 px-4 sm:px-6 lg:px-8 z-10"
				                initial="hidden"
				                whileInView="visible"
				                viewport={{once: true, margin: "-100px"}}
				                variants={fadeInUp}>
					<div className="max-w-4xl mx-auto">
						<h2 className="text-center mb-12">
							CONTACT
						</h2>
						<motion.div className="text-center mb-16"
						            variants={fadeInUp}>
							<a href="/contact"
							   className="inline-block px-8 py-3 border-2 border-foreground text-foreground rounded-full hover:bg-accent hover:text-background transition-all duration-300">
								Send a Message
							</a>
						</motion.div>
						<motion.div className="space-y-12 max-w-2xl mx-auto"
						            variants={staggerContainer}
						            initial="hidden"
						            whileInView="visible"
						            viewport={{once: true, margin: "-100px"}}>
							<motion.address className="text-center pb-8 border-b border-border-light not-italic"
							                variants={staggerItem}>
								<p className="text-text-gray text-sm mb-3">Email</p>
								<a href="mailto:olena.rybnikova@gmail.com"
								   className="text-lg sm:text-xl text-foreground hover:text-accent-hover transition-colors duration-300">
									olena.rybnikova@gmail.com
								</a>
							</motion.address>

							<motion.address className="text-center pb-8 border-b border-border-light not-italic"
							                variants={staggerItem}>
								<p className="text-text-gray text-sm mb-3">Phone</p>
								<a href="tel:+421919206955"
								   className="text-lg sm:text-xl text-foreground hover:text-accent-hover transition-colors duration-300">
									+421 919 206 955
								</a>
							</motion.address>

							<motion.address className="text-center pb-8 border-b border-border-light not-italic"
							                variants={staggerItem}>
								<p className="text-text-gray text-sm mb-3">Instagram</p>
								<a href="https://www.instagram.com/olena_rybnikova"
								   target="_blank"
								   rel="noopener noreferrer"
								   className="text-lg sm:text-xl text-foreground hover:text-accent-hover transition-colors duration-300">
									@olena_rybnikova
								</a>
							</motion.address>
						</motion.div>
					</div>
				</motion.section>
			</main>

			<footer className="relative py-12 px-4 sm:px-6 lg:px-8 border-t border-border-light z-10">
				<div className="max-w-6xl mx-auto text-center text-text-gray text-sm">
					<p>&copy; 2025 Rutheniai s.r.o. All rights reserved.</p>
				</div>
			</footer>
		</div>
	);
}
