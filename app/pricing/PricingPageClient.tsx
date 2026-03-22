"use client";

import {Button3D} from "../components/Button3D";
import {PricingCard} from "../components/PricingCard";
import {PageHeader} from "../components/PageHeader";

const pricingTiers = [
	{
		title: "Initial Consultation",
		price: "€70 per hour",
		description: "A quick yet thorough assessment to answer your immediate questions about a gemstone.",
		features: [
			"Verbal consultation and recommendations",
			"Quick market research",
			"Visual examination"
		],
		bestFor: "Purchase advice",
		isHighlighted: false,
		serviceParam: "initial",
	},
	{
		title: "Standard Examination",
		price: "€140",
		description: "Comprehensive analysis with scientific identification and official documentation.",
		features: [
			"Standard gemological examination",
			"Raman Spectroscopy identification",
			"Treatment detection",
			{ text: "Authentic certificate of analysis", link: "/reports/195617c5-eb3c-49f3-b599-201d834af5c5" },
			"All Initial Consultation services included",
		],
		bestFor: "Verifying gemstone identity and quality",
		isHighlighted: true,
		serviceParam: "standard",
	},
	{
		title: "Comprehensive Analysis",
		price: "€300",
		description: "The most detailed examination using multiple advanced analytical techniques.",
		features: [
			"Infrared Spectroscopy",
			"Ultraviolet-Visible-near-Infrared Spectroscopy",
			"Fluorescence Spectroscopy",
			"Origin determination (when possible)",
			"All Standard Examination services included",
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
				<div className="max-w-5xl mx-auto">
					<PageHeader layout="centered"
					            title="Services & Pricing"
					            subtitle="I believe quality gemological services should be accessible to everyone. Whether you have a single treasured stone or an entire collection, I offer transparent pricing and personalized attention for every analysis."
					            subtitleClassName="text-lg max-w-2xl mx-auto" />
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
					</p>
				</div>
			</section>

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
