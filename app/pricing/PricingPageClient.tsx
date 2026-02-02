"use client";

import {Button3D} from "../components/Button3D";
import {PricingCard} from "../components/PricingCard";

const pricingTiers = [
	{
		title: "Initial Consultation",
		price: "€90",
		description: "A quick yet thorough assessment to answer your immediate questions about a gemstone.",
		features: [
			"Visual examination with loupe and microscope",
			"Basic optical properties assessment",
			"Verbal consultation and recommendations",
		],
		bestFor: "Quick authenticity check or purchase advice",
		isHighlighted: false,
		serviceParam: "initial",
	},
	{
		title: "Standard Examination",
		price: "€165",
		description: "Comprehensive analysis with scientific identification and official documentation.",
		features: [
			"All Initial Consultation services",
			"Raman Spectroscopy identification",
			"Written certificate of analysis",
			"Treatment detection",
		],
		bestFor: "Verifying gemstone identity and quality",
		isHighlighted: true,
		serviceParam: "standard",
	},
	{
		title: "Comprehensive Analysis",
		price: "€320",
		description: "The most detailed examination using multiple advanced analytical techniques.",
		features: [
			"All Standard Examination services",
			"X-ray Diffraction analysis",
			"Fluorescence Spectroscopy",
			"Detailed written report with full methodology",
			"Origin determination (when possible)",
		],
		bestFor: "High-value stones, collections, insurance",
		isHighlighted: false,
		serviceParam: "comprehensive",
	},
];

export function PricingPageClient() {
	return (
		<div className="min-h-screen relative pt-16">
			{/* Background Noise Texture */}
			<div className="fixed inset-0 z-0 opacity-10 pointer-events-none"
			     style={{
				     backgroundImage: 'url("/NNNoise Texture Generator.svg")',
				     backgroundSize: "400px 400px",
				     backgroundRepeat: "repeat",
			     }} />

			{/* Header Section */}
			<section className="relative py-12 px-4 sm:px-6 lg:px-8 z-10">
				<div className="max-w-5xl mx-auto text-center">
					<h1 className="mb-4">
						Services & Pricing
					</h1>
					<p className="text-lg text-text-gray max-w-2xl mx-auto leading-relaxed">
						I believe quality gemological services should be accessible to everyone.
						Whether you have a single treasured stone or an entire collection,
						I offer transparent pricing and personalized attention for every analysis.
					</p>
				</div>
			</section>

			{/* Pricing Cards Section */}
			<section className="relative py-8 md:py-12 px-4 sm:px-6 lg:px-8 z-10">
				<div className="max-w-5xl mx-auto">
					<div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6 lg:gap-8 items-stretch md:py-4">
						{pricingTiers.map((tier) => (
							<PricingCard key={tier.title}
							             title={tier.title}
							             price={tier.price}
							             description={tier.description}
							             features={tier.features}
							             bestFor={tier.bestFor}
							             isHighlighted={tier.isHighlighted}
							             serviceParam={tier.serviceParam} />
						))}
					</div>
				</div>
			</section>

			<section className="relative py-4 px-4 sm:px-6 lg:px-8 z-10">
				<div className="max-w-5xl mx-auto">
					<p className="text-sm text-text-gray text-center leading-relaxed">
						<span className="text-foreground font-medium">Per-stone pricing</span>
						{" "}·{" "}
						<span className="text-foreground font-medium">3-5 day</span> turnaround
						{" "}·{" "}
						<span className="text-foreground font-medium">Detailed certificates</span> included
					</p>
				</div>
			</section>

			<section className="relative py-8 px-4 sm:px-6 lg:px-8 z-10">
				<div className="max-w-3xl mx-auto">
					<div className="border-t border-border-light pt-6">
						<p className="text-sm text-text-gray text-center leading-relaxed">
							<span className="text-foreground font-medium">Discounts:</span>
							{" "}
							<span className="text-foreground font-medium">10% off</span> for returning customers
							{" "}·{" "}
							<span className="text-foreground font-medium">15% off</span> for 3-5 stones
							{" "}·{" "}
							<span className="text-foreground font-medium">Custom pricing</span> for collections (6+)
						</p>
					</div>
				</div>
			</section>

			{/* CTA Section */}
			<section className="relative py-16 px-4 sm:px-6 lg:px-8 z-10">
				<div className="max-w-2xl mx-auto text-center">
					<p className="text-lg text-foreground leading-relaxed mb-2">
						Not sure which service is right for you?
					</p>
					<p className="text-text-gray leading-relaxed mb-8">
						I am happy to discuss your needs and recommend the best option for your gemstone.
					</p>
					<Button3D as="a"
					          href="/contact"
					          variant="secondary"
					          size="md">
						<span className="font-medium">Ask a Question</span>
					</Button3D>
				</div>
			</section>
		</div>
	);
}
