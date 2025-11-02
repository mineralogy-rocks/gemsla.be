export default function Home() {
	return (
		<div className="min-h-screen relative">
			{/* Background Noise Texture */}
			<div
				className="fixed inset-0 z-0 opacity-10 pointer-events-none"
				style={{
					backgroundImage: 'url("/NNNoise Texture Generator.svg")',
					backgroundSize: '400px 400px',
					backgroundRepeat: 'repeat'
				}}
			/>

			{/* Hero Section */}
			<section className="relative min-h-screen flex items-center justify-center overflow-hidden z-10">
				<div className="absolute inset-0 opacity-15">
				</div>
				<div className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
					<h1 className="monoton-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl mb-6">
						OLENA RYBNIKOVA
					</h1>
					<p className="text-xl sm:text-2xl md:text-3xl text-text-gray mb-4">
						PhD in Mineralogy
					</p>
					<p className="text-lg sm:text-xl text-text-gray">
						Applied Jewelry Professional (GIA)
					</p>
					<div className="mt-12">
						<a href="#services" className="inline-block px-8 py-3 border-2 border-heading-pink text-heading-pink rounded-full hover:bg-heading-pink hover:text-white transition-all duration-300">
							Explore Services
						</a>
					</div>
				</div>
			</section>

			{/* Services Section */}
			<section id="services" className="relative py-20 px-4 sm:px-6 lg:px-8 z-10">
				<div className="max-w-5xl mx-auto">
					<h2 className="monoton-heading text-3xl sm:text-4xl md:text-5xl text-left mb-20">
						SERVICES
					</h2>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-16 mb-20">
						{/* Gemological Consulting */}
						<div className="border-l-2 border-heading-pink pl-8">
							<h3 className="text-2xl sm:text-3xl font-semibold mb-4 text-foreground">
								Gemological Consulting
							</h3>
							<p className="text-text-gray leading-relaxed">
								Expert guidance through gemstone acquisition, quality assessment, and investment decisions. Professional consulting backed by scientific expertise for cut stones and rough material.
							</p>
						</div>

						{/* Gemological Examination */}
						<div className="border-l-2 border-accent-rose pl-8">
							<h3 className="text-2xl sm:text-3xl font-semibold mb-4 text-foreground">
								Gemological Examination
							</h3>
							<p className="text-text-gray leading-relaxed">
								Comprehensive stone analysis, quality evaluation, and precise identification. Every gemstone analyzed with meticulous attention to detail and scientific rigor.
							</p>
						</div>
					</div>

					{/* Analysis Methods */}
					<div className="mt-20 border-t border-border-light pt-16">
						<h3 className="text-xl sm:text-2xl font-light mb-12 text-foreground text-center">
							Advanced Analysis Methods
						</h3>
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
							{[
								"Raman Spectroscopy",
								"X-ray Diffraction",
								"NMR Spectroscopy",
								"Fluorescence Spectroscopy",
								"Electrochemical Analysis",
								"Optical Analysis",
							].map((method, index) => (
								<div key={index} className="text-center py-4 border-b border-border-light">
									<p className="text-foreground">{method}</p>
								</div>
							))}
						</div>
					</div>
				</div>
			</section>

			{/* Certifications Section */}
			<section id="certifications" className="relative py-20 px-4 sm:px-6 lg:px-8 z-10">
				<div className="max-w-5xl mx-auto">
					<h2 className="monoton-heading text-3xl sm:text-4xl md:text-5xl text-left mb-20">
						CERTIFICATIONS
					</h2>
					<div className="space-y-6">
						{[
							{ title: "GIA Colored Stones", date: "September 2022" },
							{ title: "Diamonds & Diamond Grading", date: "August 2022" },
							{ title: "Graduate Diamonds", date: "August 2022" },
							{ title: "Applied Jewelry Professional Diploma", date: "March 2021" },
							{ title: "Diamond Essentials Certificate", date: "March 2021" },
							{ title: "Colored Stone Essentials Certificate", date: "February 2021" },
							{ title: "Jewelry Essentials Certificate", date: "February 2021" },
						].map((cert, index) => (
							<div
								key={index}
								className="flex justify-between items-center flex-wrap gap-4 py-4 border-b border-border-light"
							>
								<h4 className="text-lg sm:text-xl font-light text-foreground">
									{cert.title}
								</h4>
								<span className="text-text-gray text-sm">{cert.date}</span>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* Education Section */}
			<section id="education" className="relative py-20 px-4 sm:px-6 lg:px-8 z-10">
				<div className="max-w-5xl mx-auto">
					<h2 className="monoton-heading text-3xl sm:text-4xl md:text-5xl text-right mb-20">
						EDUCATION
					</h2>
					<div className="space-y-16">
						{/* PhD */}
						<div className="border-l-2 border-heading-pink pl-8">
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
								"Beryllium minerals in granitic pegmatites: indicators
								of metamorphic and hydrothermal overprint"
							</p>
						</div>

						{/* MSc */}
						<div className="border-l-2 border-accent-rose pl-8">
							<h3 className="text-2xl sm:text-3xl font-light mb-3 text-foreground">
								MSc in Geochemistry & Mineralogy
							</h3>
							<p className="text-text-gray mb-4 text-sm">
								September 2016 - August 2019
							</p>
							<p className="text-foreground">
								Taras Shevchenko National University, Kyiv, Ukraine
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* Publications Section */}
			<section id="publications" className="relative py-20 px-4 sm:px-6 lg:px-8 z-10">
				<div className="max-w-5xl mx-auto">
					<h2 className="monoton-heading text-3xl sm:text-4xl md:text-5xl text-right mb-20">
						PUBLICATIONS
					</h2>
					<div className="space-y-12">
						{/* Publication 1 */}
						<div className="pb-8 border-b border-border-light">
							<h4 className="text-lg font-light text-foreground mb-3">
								Raman spectroscopy study of synthetic beryl crystals
							</h4>
							<p className="text-text-gray text-sm mb-4">
								Journal of Raman Spectroscopy
							</p>
							<a
								href="https://analyticalsciencejournals.onlinelibrary.wiley.com/doi/full/10.1002/jrs.6566"
								target="_blank"
								rel="noopener noreferrer"
								className="text-heading-pink hover:text-accent-rose transition-colors duration-300 text-sm"
							>
								Read Publication →
							</a>
						</div>

						{/* Publication 2 */}
						<div className="pb-8 border-b border-border-light">
							<h4 className="text-lg font-light text-foreground mb-3">
								Chrysoberyl and associated beryllium minerals resulting from
								metamorphic overprint of the Maršíkov-Schinderhübel III
								pegmatite, Czech Republic
							</h4>
							<p className="text-text-gray text-sm mb-4">
								Mineralogical Magazine
							</p>
							<a
								href="https://www.cambridge.org/core/journals/mineralogical-magazine/article/abs/chrysoberyl-and-associated-beryllium-minerals-resulting-from-metamorphic-overprint-of-the-marsikov-schinderhubel-iii-pegmatite-czech-republic/BAB26257DC4AD16E79B43D6A54D68516"
								target="_blank"
								rel="noopener noreferrer"
								className="text-heading-pink hover:text-accent-rose transition-colors duration-300 text-sm"
							>
								Read Publication →
							</a>
						</div>
					</div>
				</div>
			</section>

			{/* Experience Section */}
			<section id="experience" className="relative py-20 px-4 sm:px-6 lg:px-8 z-10">
				<div className="max-w-5xl mx-auto">
					<h2 className="monoton-heading text-3xl sm:text-4xl md:text-5xl text-right mb-20">
						EXPERIENCE
					</h2>
					<div className="border-l-2 border-heading-pink pl-8">
						<h3 className="text-2xl sm:text-3xl font-light mb-4 text-foreground">
							Contributing Author
						</h3>
						<p className="text-foreground mb-6">
							International Gem Society
						</p>
						<p className="text-text-gray leading-relaxed mb-6">
							Gemologist and mineralogist specializing in beryllium minerals, actively promoting knowledge and appreciation of nature, geology, and gemstones. Author of 15+ comprehensive articles covering mineralogy, gemstone identification, crystal systems, and advanced analytical techniques.
						</p>
						<a
							href="https://www.gemsociety.org/author/olenarybnikova/"
							target="_blank"
							rel="noopener noreferrer"
							className="text-heading-pink hover:text-accent-rose transition-colors duration-300 text-sm"
						>
							View Articles →
						</a>
					</div>
				</div>
			</section>

			{/* Legal Section */}
			<section id="legal" className="relative py-20 px-4 sm:px-6 lg:px-8 z-10">
				<div className="max-w-5xl mx-auto">
					<h2 className="monoton-heading text-3xl sm:text-4xl md:text-5xl text-center mb-20">
						LEGAL
					</h2>
					<div className="border-t border-border-light pt-12">
						<h3 className="text-2xl sm:text-3xl font-light mb-8 text-center text-foreground">
							Rutheniai s.r.o.
						</h3>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-3xl mx-auto">
							<div className="space-y-6">
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
							</div>
							<div className="space-y-6">
								<div>
									<p className="text-text-gray text-sm mb-2">Headquarters</p>
									<p className="text-foreground">
										Karpatské námestie 7770/10A<br />
										Bratislava - Raša, 831 06<br />
										Slovakia
									</p>
								</div>

								<div>
									<p className="text-text-gray text-sm mb-2">Business Activities</p>
									<p className="text-foreground">
										Research and development in natural, technical, social, and humanitarian sciences
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Contact Section */}
			<section id="contact" className="relative py-20 px-4 sm:px-6 lg:px-8 z-10">
				<div className="max-w-4xl mx-auto">
					<h2 className="monoton-heading text-3xl sm:text-4xl md:text-5xl text-center mb-20">
						CONTACT
					</h2>
					<div className="space-y-12 max-w-2xl mx-auto">
						{/* Email */}
						<div className="text-center pb-8 border-b border-border-light">
							<p className="text-text-gray text-sm mb-3">Email</p>
							<a
								href="mailto:olena.rybnikova@gmail.com"
								className="text-lg sm:text-xl text-heading-pink hover:text-accent-rose transition-colors duration-300"
							>
								olena.rybnikova@gmail.com
							</a>
						</div>

						{/* Phone */}
						<div className="text-center pb-8 border-b border-border-light">
							<p className="text-text-gray text-sm mb-3">Phone</p>
							<a
								href="tel:+421919206955"
								className="text-lg sm:text-xl text-heading-pink hover:text-accent-rose transition-colors duration-300"
							>
								+421 919 206 955
							</a>
						</div>

						{/* Instagram */}
						<div className="text-center pb-8 border-b border-border-light">
							<p className="text-text-gray text-sm mb-3">Instagram</p>
							<a
								href="https://www.instagram.com/olena_rybnikova"
								target="_blank"
								rel="noopener noreferrer"
								className="text-lg sm:text-xl text-heading-pink hover:text-accent-rose transition-colors duration-300"
							>
								@olena_rybnikova
							</a>
						</div>
					</div>
				</div>
			</section>

			{/* Footer */}
			<footer className="relative py-12 px-4 sm:px-6 lg:px-8 border-t border-border-light z-10">
				<div className="max-w-6xl mx-auto text-center text-text-gray text-sm">
					<p>© 2025 Rutheniai s.r.o. All rights reserved.</p>
				</div>
			</footer>
		</div>
	);
}
