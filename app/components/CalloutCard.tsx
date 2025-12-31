"use client";

import React, {useRef} from "react";
import {motion, useScroll, useTransform} from "framer-motion";

type CalloutVariant = "service" | "quote";

interface CalloutCardProps {
	variant: CalloutVariant;
	title?: string;
	children: React.ReactNode;
}

export function CalloutCard({variant, title, children}: CalloutCardProps) {
	const isQuote = variant === "quote";
	const isService = variant === "service";
	const ref = useRef<HTMLDivElement>(null);

	const {scrollYProgress} = useScroll({
		target: ref,
		offset: ["start end", "end start"]
	});

	const titleY = useTransform(scrollYProgress, [0, 1], [20, -20]);

	if (isQuote) {
		return (
			<div className="relative py-8 px-6 sm:px-12 text-center">
				<span className="absolute top-0 left-4 sm:left-8 text-6xl sm:text-8xl text-quote-mark font-serif leading-none select-none"
				      aria-hidden="true">
					&ldquo;
				</span>
				<div className="text-xl sm:text-2xl italic text-foreground leading-relaxed">
					{children}
				</div>
				<span className="absolute bottom-0 right-4 sm:right-8 text-6xl sm:text-8xl text-quote-mark font-serif leading-none select-none"
				      aria-hidden="true">
					&rdquo;
				</span>
			</div>
		);
	}

	if (isService && title) {
		return (
			<div ref={ref}
			     className="relative">
				<motion.h4 className="text-xl md:text-2xl font-medium text-foreground mb-4 md:mb-0 md:absolute md:right-full md:mr-20 md:pt-1 md:text-right md:w-40"
				           style={{y: titleY}}>
					{title}
				</motion.h4>
				<div className="bg-callout-bg border-l-6 border-2 border-foreground rounded-lg p-6 sm:p-8">
					<div className="leading-relaxed">
						{children}
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className={isService
			? "bg-callout-bg border-l-4 border-l-callout-accent-light rounded p-6 sm:p-8"
			: "bg-callout-bg/50 border border-border-light rounded p-4 sm:p-6"}>
			<div className={isService ? "text-text-gray leading-relaxed" : "text-text-gray text-sm leading-relaxed"}>
				{children}
			</div>
		</div>
	);
}

export default CalloutCard;
