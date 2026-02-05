"use client";

import { motion, type Variants } from "framer-motion";
import type { PageHeaderProps } from "./PageHeader.types";

const containerVariants: Variants = {
	hidden: { opacity: 0 },
	show: {
		opacity: 1,
		transition: {
			staggerChildren: 0.12,
			delayChildren: 0.05,
		},
	},
};

const titleVariants: Variants = {
	hidden: { opacity: 0, y: 20 },
	show: {
		opacity: 1,
		y: 0,
		transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
	},
};

const accentVariants: Variants = {
	hidden: { scaleX: 0, opacity: 0 },
	show: {
		scaleX: 1,
		opacity: 1,
		transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
	},
};

const subtitleVariants: Variants = {
	hidden: { opacity: 0, y: 12 },
	show: {
		opacity: 1,
		y: 0,
		transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
	},
};

const actionsVariants: Variants = {
	hidden: { opacity: 0, y: 10 },
	show: {
		opacity: 1,
		y: 0,
		transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
	},
};

export function PageHeader({
	title,
	subtitle,
	actions,
	layout = "default",
	animated = true,
	className = "",
	subtitleClassName = "",
}: PageHeaderProps) {
	const isCentered = layout === "centered";
	const MotionWrapper = animated ? motion.div : "div";
	const MotionChild = animated ? motion.div : "div";

	const containerProps = animated
		? { variants: containerVariants, initial: "hidden", animate: "show" }
		: {};

	const childProps = (variants: Variants) =>
		animated ? { variants } : {};

	return (
		<MotionWrapper
			className={`mb-8 ${isCentered ? "text-center" : "flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"} ${className}`}
			{...containerProps}
		>
			{isCentered ? (
				<>
					<MotionChild {...childProps(titleVariants)}>
						<h1 className="mb-2">{title}</h1>
					</MotionChild>
					<MotionChild
						{...childProps(accentVariants)}
						className="flex justify-center mb-4"
					>
						<div
							className="h-0.5 w-12 bg-page-header-accent rounded-full"
							style={{ originX: 0.5 }}
						/>
					</MotionChild>
					{subtitle && (
						<MotionChild {...childProps(subtitleVariants)}>
							<p className={`text-text-gray leading-relaxed ${subtitleClassName}`}>
								{subtitle}
							</p>
						</MotionChild>
					)}
				</>
			) : (
				<>
					<div>
						<MotionChild {...childProps(titleVariants)}>
							<h1 className="mb-2">{title}</h1>
						</MotionChild>
						<MotionChild
							{...childProps(accentVariants)}
							className="mb-3"
							style={{ originX: 0 }}
						>
							<div className="h-0.5 w-8 bg-page-header-accent rounded-full" />
						</MotionChild>
						{subtitle && (
							<MotionChild {...childProps(subtitleVariants)}>
								<p className={`text-text-gray ${subtitleClassName}`}>
									{subtitle}
								</p>
							</MotionChild>
						)}
					</div>
					{actions && (
						<MotionChild {...childProps(actionsVariants)}>
							{actions}
						</MotionChild>
					)}
				</>
			)}
		</MotionWrapper>
	);
}
