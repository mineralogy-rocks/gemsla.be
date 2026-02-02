"use client";

import {motion} from "framer-motion";
import dynamic from "next/dynamic";
import Link from "next/link";
import {fadeInUp, staggerContainer, paragraphReveal} from "./lib/animations";
import {Button3D} from "./components/Button3D";
import {CalloutCard} from "./components/CalloutCard";

const DiamondWireframe = dynamic(() => import("./components/DiamondWireframe"), {
	ssr: false,
	loading: () => <div className="w-full h-32 sm:h-40 md:h-48" />
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
						<motion.div className="relative flex w-full items-center justify-center mb-10"
						            variants={fadeInUp}>
							<div className="">
								<DiamondWireframe/>
							</div>
							<p className="text-sm sm:text-base text-text-gray italic">
								/ˈdʒemzləˈbeɪ/
							</p>
							<div className="absolute -bottom-3 right-0 sm:-right-8 h-px w-48 sm:w-full after:content-[''] after:absolute after:-right-0.5 after:top-1/2 after:-translate-y-1/2 after:w-1.5 after:h-1.5 after:rounded-full after:bg-foreground after:invisible sm:after:visible"
							     style={{ background: 'linear-gradient(to right, transparent, var(--secondary))' }} />
						</motion.div>
						<div className="mb-6" />
						<motion.p className="text-xl sm:text-2xl md:text-3xl mb-5"
						          variants={fadeInUp}>
							Gemological Expertise and Consultancy
						</motion.p>
						<motion.p className="text-lg sm:text-2xl mb-10 text-text-gray"
						          variants={fadeInUp}>
							Olena Rybnikova<br/>
							PhD, GIA-certified
						</motion.p>
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
							Hi there and welcome to my Labé! I&apos;m Olena, a <strong>gemologist</strong> with a deep love for the science and beauty of gemstones. Based in Bratislava, Slovakia, I combine academic training in mineralogy with hands-on expertise to help you make confident decisions about precious stones. <Link href="/about"
							      className="text-foreground hover:text-callout-accent underline underline-offset-2 transition-colors">Learn more about me</Link>.
						</motion.p>

						<motion.p className="text-lg text-foreground leading-relaxed mb-10"
						          variants={paragraphReveal}
						          initial="hidden"
						          whileInView="visible"
						          viewport={{once: true, margin: "-50px"}}>
							I hold a <strong>PhD in Mineralogy</strong> and certifications from the <strong>Gemological Institute of America (GIA)</strong> in colored stones, diamond grading, and jewelry essentials. My research on beryl and chrysoberyl has been published in peer-reviewed journals&mdash;but my real passion is translating that science into practical guidance for collectors, jewelers, and anyone curious about gems.
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
									Need guidance on buying, selling, or understanding gemstones? I offer personalized advice on stone selection, quality assessment, and investment potential&mdash;whether you&apos;re a first-time buyer or a seasoned collector.
								</CalloutCard>

								<CalloutCard variant="service"
								             title="Examination">
									Get a clear picture of what you have. I provide detailed analysis of your gemstone&apos;s identity, quality, and any treatments&mdash;backed by a formal certificate you can use for insurance, resale, or peace of mind. See current <Link href="/pricing" className="text-foreground hover:text-callout-accent underline underline-offset-2 transition-colors">pricing and service tiers</Link>.
								</CalloutCard>
							</div>

							<motion.p className="text-lg text-foreground leading-relaxed mb-8"
							          variants={paragraphReveal}
							          initial="hidden"
							          whileInView="visible"
							          viewport={{once: true, margin: "-50px"}}>
								I use advanced analytical techniques to ensure accurate identification:
							</motion.p>

							<div className="mb-12">
								<CalloutCard variant="service"
								             title="Analytical Methods">
									My toolkit includes <strong>Raman Spectroscopy</strong> and X-ray Diffraction for structural analysis, NMR Spectroscopy for molecular insights, <strong>Fluorescence Spectroscopy</strong> for detecting treatments, Electrochemical Analysis for composition studies, and Optical Analysis for visual evaluation.
								</CalloutCard>
							</div>

							<motion.p className="text-lg text-foreground leading-relaxed mb-8"
							          variants={paragraphReveal}
							          initial="hidden"
							          whileInView="visible"
							          viewport={{once: true, margin: "-50px"}}>
								Beyond lab work, I write about gemology for academic journals and the International Gem Society.
							</motion.p>

							<CalloutCard variant="service"
							             title="Publications & Writing">
								<span className="font-medium">Selected publications:</span>
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
								Have a gemstone you&apos;d like examined, or questions about buying one? Let&apos;s talk.
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
		</div>
	);
}
