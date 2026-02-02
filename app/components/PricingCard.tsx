"use client";

import React from "react";
import Link from "next/link";

interface PricingCardProps {
	title: string;
	price: string;
	description: string;
	features: string[];
	bestFor: string;
	isHighlighted?: boolean;
	serviceParam?: string;
}

export function PricingCard({
	title,
	price,
	description,
	features,
	bestFor,
	isHighlighted = false,
	serviceParam,
}: PricingCardProps) {
	const contactHref = serviceParam ? `/contact?service=${serviceParam}` : "/contact";
	return (
		<div className={`relative bg-callout-bg rounded-lg p-5 sm:p-6 h-full flex flex-col transition-shadow duration-300 ${
			isHighlighted
				? "border-2 border-foreground shadow-lg shadow-foreground/10 md:scale-105 md:z-10"
				: "border-2 border-foreground hover:shadow-md"
		}`}>
			{isHighlighted && (
				<div className="absolute -top-3 left-1/2 -translate-x-1/2">
					<span className="bg-foreground text-background text-xs font-medium px-4 py-1.5 rounded-full shadow-sm">
						Recommended
					</span>
				</div>
			)}

			<div className="mb-3">
				<h3 className="text-xl font-semibold text-foreground mb-2">
					{title}
				</h3>
				<p className="text-3xl font-bold text-foreground">
					{price}
				</p>
			</div>

			<p className="text-text-gray leading-relaxed mb-4">
				{description}
			</p>

			<ul className="space-y-2 mb-5 flex-grow">
				{features.map((feature, index) => (
					<li key={index}
					    className="flex items-start gap-2.5">
						<svg className="w-4 h-4 flex-shrink-0 mt-0.5 text-foreground/70"
						     fill="none"
						     stroke="currentColor"
						     viewBox="0 0 24 24"
						     xmlns="http://www.w3.org/2000/svg">
							<path strokeLinecap="round"
							      strokeLinejoin="round"
							      strokeWidth={2}
							      d="M5 13l4 4L19 7" />
						</svg>
						<span className="text-foreground text-sm leading-relaxed">
							{feature}
						</span>
					</li>
				))}
			</ul>

			<div className="pt-3 border-t border-border-light mb-3">
				<p className="text-sm text-text-gray">
					<span className="font-medium text-foreground">Best for:</span> {bestFor}
				</p>
			</div>

			<Link href={contactHref}
			      className={`block w-full text-center py-2.5 px-4 rounded-lg font-medium transition-all duration-300 ${
				      isHighlighted
					      ? "bg-foreground text-background hover:opacity-90 shadow-sm hover:shadow-md"
					      : "bg-foreground/5 text-foreground border border-foreground/20 hover:bg-foreground/10 hover:border-foreground/40"
			      }`}>
				Get Started
			</Link>
		</div>
	);
}

export default PricingCard;
