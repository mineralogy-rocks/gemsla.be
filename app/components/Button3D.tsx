"use client";

import React from "react";
import {motion, HTMLMotionProps} from "framer-motion";

type ButtonVariant = "primary" | "secondary";
type ButtonSize = "sm" | "md" | "lg";

interface Button3DBaseProps {
	variant?: ButtonVariant;
	size?: ButtonSize;
	children: React.ReactNode;
	className?: string;
}

type Button3DAsButton = Button3DBaseProps &
	Omit<HTMLMotionProps<"button">, keyof Button3DBaseProps> & {
		as?: "button";
		href?: never;
	};

type Button3DAsAnchor = Button3DBaseProps &
	Omit<HTMLMotionProps<"a">, keyof Button3DBaseProps> & {
		as: "a";
		href: string;
	};

type Button3DProps = Button3DAsButton | Button3DAsAnchor;

const sizeClasses = {
	sm: "px-5 py-2 text-sm",
	md: "px-8 py-3 text-base",
	lg: "px-10 py-4 text-lg",
};

export function Button3D({
	as = "button",
	variant = "primary",
	size = "md",
	children,
	className = "",
	...props
}: Button3DProps) {
	const Component = as === "a" ? motion.a : motion.button;
	const isPrimary = variant === "primary";

	return (
		<Component className={`group relative inline-block rounded-xl border-none bg-transparent p-0 cursor-pointer outline-offset-4 select-none [-webkit-tap-highlight-color:transparent] ${className}`}
		           whileHover="hover"
		           whileTap="pressed"
		           initial="idle"
		           {...(props as any)}>

			<motion.span className="absolute inset-0 rounded-xl will-change-transform"
			             style={{
				             background: "hsl(0deg 0% 0% / 0.25)",
			             }}
			             variants={{
				             idle: {
					             y: 2,
					             transition: {
						             duration: 0.6,
						             ease: [0.3, 0.7, 0.4, 1],
					             },
				             },
				             hover: {
					             y: 4,
					             transition: {
						             duration: 0.25,
						             ease: [0.3, 0.7, 0.4, 1.5],
					             },
				             },
				             pressed: {
					             y: 1,
					             transition: {
						             duration: 0.034,
						             ease: "easeOut",
					             },
				             },
			             }}
			             aria-hidden="true" />

			<motion.span className="absolute inset-0 rounded-xl"
			             style={{
				             background: isPrimary
					             ? "linear-gradient(to bottom, #a08060, #5c4a3a)"
					             : "linear-gradient(to bottom, var(--border), var(--foreground-muted))",
			             }}
			             aria-hidden="true" />

			<motion.span className={`relative block rounded-xl ${sizeClasses[size]} ${isPrimary ? "bg-foreground text-secondary" : "bg-background-creme text-foreground border-2 border-foreground"} font-normal tracking-wide will-change-transform`}
			             variants={{
				             idle: {
					             y: -4,
					             transition: {
						             duration: 0.6,
						             ease: [0.3, 0.7, 0.4, 1],
					             },
				             },
				             hover: {
					             y: -6,
					             filter: "brightness(1.1)",
					             transition: {
						             duration: 0.25,
						             ease: [0.3, 0.7, 0.4, 1.5],
					             },
				             },
				             pressed: {
					             y: -2,
					             transition: {
						             duration: 0.034,
						             ease: "easeOut",
					             },
				             },
			             }}>
				{children}
			</motion.span>
		</Component>
	);
}

export default Button3D;
