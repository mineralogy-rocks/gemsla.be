export function Footer() {
	return (
		<footer className="bg-white">
			<div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">

				<div className="grid grid-cols-1 sm:grid-cols-2 gap-10 sm:gap-12 lg:gap-16">
					{/* Company Column */}
					<div>
						<address className="not-italic text-sm text-text-gray space-y-1.5">
							<p>
								<span className="font-medium text-foreground tracking-wide">Rutheniai s.r.o.</span>
								<span className="mx-3 opacity-40">·</span>
								<span>IČO: 57 211 604</span>
							</p>
							<p className="leading-relaxed">Karpatske namestie 7770/10A, Bratislava - Raca, 831 06, Slovakia</p>
						</address>
					</div>

					{/* Contact Column */}
					<div className="flex items-start justify-start sm:justify-end">
						<ul className="flex items-center gap-6">
							<li>
								<a href="mailto:rybnikovageochem95@gmail.com"
								   className="flex items-center gap-2 text-sm text-text-gray hover:text-callout-accent transition-colors duration-200">
									<svg className="w-4 h-4"
									     viewBox="0 0 24 24"
									     fill="none"
									     stroke="currentColor"
									     strokeWidth={1.5}
									     aria-hidden="true">
										<rect x="2" y="4" width="20" height="16" rx="2" />
										<path d="M22 6L12 13L2 6" />
									</svg>
									Email
								</a>
							</li>

							<li>
								<a href="https://www.instagram.com/olena_rybnikova"
								   target="_blank"
								   rel="noopener noreferrer"
								   className="flex items-center gap-2 text-sm text-text-gray hover:text-callout-accent transition-colors duration-200">
									<svg className="w-4 h-4"
									     viewBox="0 0 24 24"
									     fill="none"
									     stroke="currentColor"
									     strokeWidth={1.5}
									     aria-hidden="true">
										<rect x="2" y="2" width="20" height="20" rx="5" />
										<circle cx="12" cy="12" r="4" />
										<circle cx="18" cy="6" r="1" fill="currentColor" stroke="none" />
									</svg>
									Instagram
								</a>
							</li>
						</ul>
					</div>
				</div>

				{/* Bottom bar */}
				<div className="mt-12 pt-8 border-t border-border-light">
					<div className="flex flex-col sm:flex-row items-center justify-end">
						<p className="text-xs text-text-gray tracking-wide">
							&copy; 2025-present Rutheniai s.r.o. All rights reserved.
						</p>
					</div>
				</div>
			</div>
		</footer>
	);
}

export default Footer;
