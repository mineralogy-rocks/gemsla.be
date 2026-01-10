"use client";

import React from "react";
import Link from "next/link";
import {motion} from "framer-motion";
import {staggerItem} from "../lib/animations";

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
		<motion.div className={`relative bg-callout-bg rounded-lg p-6 sm:p-8 h-full flex flex-col transition-shadow duration-300 ${
			isHighlighted
				? "border-2 border-callout-accent shadow-lg shadow-callout-accent/20 md:scale-105 md:z-10"
				: "border-2 border-foreground hover:shadow-md"
		}`}
		            variants={staggerItem}
		            whileHover={!isHighlighted ? {y: -4, transition: {duration: 0.25, ease: [0.22, 1, 0.36, 1]}} : undefined}>
			{isHighlighted && (
				<div className="absolute -top-3 left-1/2 -translate-x-1/2">
					<span className="bg-callout-accent text-white text-xs font-medium px-4 py-1.5 rounded-full shadow-sm">
						Recommended
					</span>
				</div>
			)}

			<div className="mb-4">
				<h3 className="text-xl font-semibold text-foreground mb-2">
					{title}
				</h3>
				<p className={`text-3xl font-bold ${isHighlighted ? "text-callout-accent" : "text-foreground"}`}>
					{price}
				</p>
			</div>

			<p className="text-text-gray leading-relaxed mb-6">
				{description}
			</p>

			<ul className="space-y-3 mb-6 flex-grow">
				{features.map((feature, index) => (
					<li key={index}
					    className="flex items-start gap-3">
						<svg className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isHighlighted ? "text-callout-accent" : "text-foreground/70"}`}
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

			<div className="pt-4 border-t border-border-light mb-4">
				<p className="text-sm text-text-gray">
					<span className="font-medium text-foreground">Best for:</span> {bestFor}
				</p>
			</div>

			<Link href={contactHref}
			      className={`block w-full text-center py-3 px-4 rounded-lg font-medium transition-all duration-300 ${
				      isHighlighted
					      ? "bg-callout-accent text-white hover:bg-callout-accent/90 shadow-sm hover:shadow-md"
					      : "bg-foreground/5 text-foreground border border-foreground/20 hover:bg-foreground/10 hover:border-foreground/40"
			      }`}>
				Get Started
			</Link>
		</motion.div>
	);
}

export default PricingCard;
