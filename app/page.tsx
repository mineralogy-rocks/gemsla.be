"use client";

import {motion} from "framer-motion";
import dynamic from "next/dynamic";
import Link from "next/link";
import {fadeInUp, staggerContainer, paragraphReveal} from "./lib/animations";
import {Button3D} from "./components/Button3D";
import {CalloutCard} from "./components/CalloutCard";

const DiamondWireframe = dynamic(() => import("./components/DiamondWireframe"), {
	ssr: false,
	loading: () => <div className="w-full h-48 sm:h-64 md:h-80" />
});

export default function Home() {
	return (
		<div className="min-h-screen relative">
			<a href="#main-content"
			   className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-foreground focus:text-background focus:rounded">
				Skip to main content
			</a>

			<div className="fixed inset-0 z-0 opacity-10 pointer-events-none"
			     style={{
				     backgroundImage: 'url("/NNNoise Texture Generator.svg")',
				     backgroundSize: '400px 400px',
				     backgroundRepeat: 'repeat'
			     }} />

			<main id="main-content">
				<section className="relative min-h-screen flex items-center justify-end overflow-hidden z-10">
					<div className="absolute top-1/5 bottom-40 invisible sm:visible sm:right-6 lg:right-44 w-px"
					     style={{ background: 'linear-gradient(to bottom, transparent, var(--secondary) 20%, var(--secondary) 80%, transparent)' }} />

					<motion.div className="relative z-10 text-right px-4 sm:px-6 lg:px-8 max-w-4xl lg:mr-44"
					            initial="hidden"
					            animate="visible"
					            variants={staggerContainer}>
						<motion.h1 className="mb-2"
						           variants={fadeInUp}
						           style={{ textTransform: 'none' }}>
							GemsLab<i>é</i>
						</motion.h1>
						<motion.div className="relative inline-block w-full"
						            variants={fadeInUp}>
							<p className="text-sm sm:text-base text-text-gray italic">
								/ˈdʒemzləˈbeɪ/
							</p>
							<div className="absolute -bottom-3 right-0 sm:-right-8 h-px w-48 sm:w-full"
							     style={{ background: 'linear-gradient(to right, transparent, var(--secondary))' }} />
						</motion.div>
						<div className="mb-6" />
						<motion.p className="text-xl sm:text-2xl md:text-3xl mb-2"
						          variants={fadeInUp}>
							Gemological Expertise and Consultancy
						</motion.p>
						<motion.p className="text-lg sm:text-2xl mb-8"
						          variants={fadeInUp}>
							provided by Olena Rybnikova
						</motion.p>
						<motion.div className="space-y-1 mb-10 text-text-gray"
						            variants={fadeInUp}>
							<p className="text-base sm:text-lg">
								PhD in Mineralogy
							</p>
							<p className="text-base sm:text-lg">
								Applied Jewelry Professional (GIA)
							</p>
						</motion.div>
						<motion.div variants={fadeInUp}>
							<Button3D as="a"
							          href="/contact"
							          variant="secondary"
							          size="md">
								<span className="font-medium">Let&apos;s Talk Gems!</span>
							</Button3D>
						</motion.div>
					</motion.div>

				</section>

				<section className="relative py-20 px-4 sm:px-6 lg:px-8 z-10">
					<article className="max-w-2xl mx-auto">
						<motion.p className="text-lg text-foreground leading-relaxed mb-10"
						          variants={paragraphReveal}
						          initial="hidden"
						          whileInView="visible"
						          viewport={{once: true, margin: "-50px"}}>
							Hi there and welcome to my Labé! I&apos;m Olena, a <strong>gemologist</strong> with a deep love for the science and beauty of gemstones. Based in <strong>Bratislava, Slovakia</strong>, I combine my academic background in <strong>mineralogy</strong> with hands-on expertise to help you navigate the fascinating world of precious stones.
						</motion.p>

						<motion.p className="text-lg text-foreground leading-relaxed mb-10"
						          variants={paragraphReveal}
						          initial="hidden"
						          whileInView="visible"
						          viewport={{once: true, margin: "-50px"}}>
							My journey with gemstones began at <strong>Taras Shevchenko National University</strong> in Kyiv, where I completed my <strong>Master&apos;s in Geochemistry and Mineralogy</strong>. I then pursued my <strong>PhD at Comenius University</strong> in Bratislava, focusing on beryllium minerals in granitic pegmatites. Along the way, I earned certifications from the <strong>Gemological Institute of America (GIA)</strong> in colored stones, diamond grading, and jewelry essentials.
						</motion.p>

						<div className="my-16 sm:my-24">
							<DiamondWireframe />
						</div>

						<motion.p className="text-lg text-foreground leading-relaxed mb-8"
						          variants={paragraphReveal}
						          initial="hidden"
						          whileInView="visible"
						          viewport={{once: true, margin: "-50px"}}>
							Whether you&apos;re a collector searching for the perfect piece, a jeweler wanting to verify authenticity, or simply curious about a family heirloom, I&apos;m here to help with:
						</motion.p>

						<div className="relative">
							<div className="hidden md:block absolute w-px z-0"
							     style={{
								     right: 'calc(100% + 6.25rem)',
								     top: '0',
								     bottom: '0',
								     background: 'linear-gradient(to bottom, var(--secondary) 0%, var(--secondary) 70%, transparent 100%)'
							     }} />

							<div className="space-y-6 mb-12">
								<CalloutCard variant="service"
								             title="Consulting">
									Looking to dive into the world of gemstones? Whether you&apos;re after tips on finding the perfect stone, figuring out quality, or making smart investment choices, I&apos;m here to help. Let&apos;s make your gemstone journey exciting and enjoyable!
								</CalloutCard>

								<CalloutCard variant="service"
								             title="Examination">
									Comprehensive stone analysis, quality evaluation, and precise identification. Every gemstone analyzed with meticulous attention to detail and scientific rigor. I issue a certificate of analysis detailing the gemstone&apos;s properties, quality, and authenticity. See current <Link href="/pricing" className="text-foreground hover:text-callout-accent underline underline-offset-2 transition-colors">pricing and service tiers</Link>.
								</CalloutCard>
							</div>

							<motion.p className="text-lg text-foreground leading-relaxed mb-8"
							          variants={paragraphReveal}
							          initial="hidden"
							          whileInView="visible"
							          viewport={{once: true, margin: "-50px"}}>
								I bring scientific precision to every analysis, using state-of-the-art analytical techniques:
							</motion.p>

							<div className="mb-12">
								<CalloutCard variant="service"
								             title="Analytical Methods">
									My toolkit includes <strong>Raman Spectroscopy</strong> and <strong>X-ray Diffraction</strong> for structural analysis, <strong>NMR Spectroscopy</strong> for molecular insights, <strong>Fluorescence Spectroscopy</strong> for detecting treatments, <strong>Electrochemical Analysis</strong> for composition studies, and <strong>Optical Analysis</strong> for visual evaluation.
								</CalloutCard>
							</div>

							<motion.p className="text-lg text-foreground leading-relaxed mb-8"
							          variants={paragraphReveal}
							          initial="hidden"
							          whileInView="visible"
							          viewport={{once: true, margin: "-50px"}}>
								When I&apos;m not in the lab, you&apos;ll find me sharing my passion for mineralogy through writing. As a contributing author for the International Gem Society, I&apos;ve authored 15+ comprehensive articles covering everything from crystal systems to advanced analytical techniques. My research on beryl crystals and chrysoberyl has been published in the Journal of Raman Spectroscopy and Mineralogical Magazine.
							</motion.p>

							<CalloutCard variant="service"
							             title="Publications & Writing">
								<span className="font-medium">Here are some of my publications related to Gemology:</span>
								<ul className="space-y-3 mt-3">
									<li>
										<a href="https://analyticalsciencejournals.onlinelibrary.wiley.com/doi/full/10.1002/jrs.6566"
										   target="_blank"
										   rel="noopener noreferrer"
										   className="text-foreground hover:text-callout-accent transition-colors duration-300 underline underline-offset-2">
											Raman spectroscopy study of synthetic beryl crystals
										</a>
										<span className="text-text-gray"> - Journal of Raman Spectroscopy</span>
									</li>
									<li>
										<a href="https://www.cambridge.org/core/journals/mineralogical-magazine/article/abs/chrysoberyl-and-associated-beryllium-minerals-resulting-from-metamorphic-overprint-of-the-marsikov-schinderhubel-iii-pegmatite-czech-republic/BAB26257DC4AD16E79B43D6A54D68516"
										   target="_blank"
										   rel="noopener noreferrer"
										   className="text-foreground hover:text-callout-accent transition-colors duration-300 underline underline-offset-2">
											Chrysoberyl and associated beryllium minerals
										</a>
										<span className="text-text-gray"> - Mineralogical Magazine</span>
									</li>
									<li>
										<a href="https://www.gemsociety.org/author/olenarybnikova/"
										   target="_blank"
										   rel="noopener noreferrer"
										   className="text-foreground hover:text-callout-accent transition-colors duration-300 underline underline-offset-2">
											15+ Articles on Gemology & Mineralogy
										</a>
										<span className="text-text-gray"> - International Gem Society</span>
									</li>
								</ul>
							</CalloutCard>
						</div>

						<motion.div className="mt-12 text-center"
						            variants={paragraphReveal}
						            initial="hidden"
						            whileInView="visible"
						            viewport={{once: true, margin: "-50px"}}>
							<p className="text-lg text-foreground leading-relaxed mb-8">
								Ready to explore the world of gemstones together? I&apos;d love to hear from you.
							</p>
							<Button3D as="a"
							          href="/contact"
							          variant="secondary"
							          size="md">
								<span className="font-medium">Get in Touch</span>
							</Button3D>
						</motion.div>
					</article>
				</section>

			</main>

			<footer className="relative py-10 px-4 sm:px-6 lg:px-8 border-t border-border-light z-10">
				<div className="max-w-5xl mx-auto">
					<div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
						<div>
							<h4 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wide">Contact</h4>
							<address className="not-italic space-y-2 text-sm">
								<p>
									<a href="mailto:olena.rybnikova@gmail.com"
									   className="text-text-gray hover:text-foreground transition-colors">
										olena.rybnikova@gmail.com
									</a>
								</p>
								<p>
									<a href="tel:+421919206955"
									   className="text-text-gray hover:text-foreground transition-colors">
										+421 919 206 955
									</a>
								</p>
								<p>
									<a href="https://www.instagram.com/olena_rybnikova"
									   target="_blank"
									   rel="noopener noreferrer"
									   className="text-text-gray hover:text-foreground transition-colors">
										@olena_rybnikova
									</a>
								</p>
							</address>
						</div>

						<div>
							<h4 className="text-sm font-semibold text-foreground mb-4 tracking-wide">Rutheniai s.r.o.</h4>
							<address className="not-italic space-y-1 text-sm text-text-gray">
								<p>Karpatske namestie 7770/10A</p>
								<p>Bratislava - Raca, 831 06</p>
								<p>Slovakia</p>
							</address>
						</div>

						<div>
							<h4 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wide">Legal</h4>
							<div className="space-y-1 text-sm text-text-gray">
								<p>IČO: 57 211 604</p>
								<p>Limited Liability Company</p>
								<p>Est. September 2025</p>
							</div>
						</div>
					</div>

					<div className="pt-6 border-t border-border-light text-center text-text-gray text-xs">
						<p>&copy; 2025 Rutheniai s.r.o. All rights reserved.</p>
					</div>
				</div>
			</footer>
		</div>
	);
}
