"use client";

import React, { forwardRef } from "react";
import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";
import { type ButtonProps, type ButtonVariant, type ButtonSize } from "./Button.types";

const variantClasses: Record<ButtonVariant, string> = {
	primary: "bg-foreground text-background hover:shadow-[0_4px_16px_rgba(0,0,0,0.15),0_1px_4px_rgba(0,0,0,0.1)] hover:opacity-[0.92]",
	secondary: "bg-background-creme text-foreground border border-border hover:border-gold hover:bg-background-warm hover:shadow-[0_4px_16px_rgba(196,167,125,0.18),0_1px_4px_rgba(0,0,0,0.06)]",
	outline: "border border-border text-foreground hover:border-gold hover:bg-background-creme/50 hover:shadow-[0_4px_16px_rgba(196,167,125,0.15),0_1px_4px_rgba(0,0,0,0.05)]",
	accent: "bg-[#8B3A3A] text-background hover:bg-[#7A3030] hover:shadow-[0_4px_16px_rgba(139,58,58,0.3),0_1px_4px_rgba(0,0,0,0.1)]",
};

const sizeClasses: Record<ButtonSize, string> = {
	sm: "py-2 px-4 text-sm",
	md: "py-3 px-6",
	lg: "py-4 px-8 text-lg",
};

const Spinner = () => (
	<svg className="animate-spin h-5 w-5"
	     xmlns="http://www.w3.org/2000/svg"
	     fill="none"
	     viewBox="0 0 24 24">
		<circle className="opacity-25"
		        cx="12"
		        cy="12"
		        r="10"
		        stroke="currentColor"
		        strokeWidth="4" />
		<path className="opacity-75"
		      fill="currentColor"
		      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
	</svg>
);

type MotionButtonProps = HTMLMotionProps<"button"> & ButtonProps;

export const Button = forwardRef<HTMLButtonElement, MotionButtonProps>(
	({ variant = "primary", size = "md", loading = false, disabled, className = "", children, ...props }, ref) => {
		const isDisabled = disabled || loading;
		const prefersReducedMotion = useReducedMotion();

		const baseClasses = "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-all duration-250 ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground";
		const disabledClasses = isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer";

		return (
			<motion.button ref={ref}
			               disabled={isDisabled}
			               className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabledClasses} ${className}`}
			               whileTap={isDisabled || prefersReducedMotion ? undefined : { scale: 0.98 }}
			               {...props}>
				{loading && <Spinner />}
				{children}
			</motion.button>
		);
	}
);

Button.displayName = "Button";

export default Button;
