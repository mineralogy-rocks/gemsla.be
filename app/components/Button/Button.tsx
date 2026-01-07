"use client";

import React, { forwardRef } from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { ButtonProps, ButtonVariant, ButtonSize } from "./Button.types";

const variantClasses: Record<ButtonVariant, string> = {
	primary: "bg-foreground text-background hover:opacity-90",
	secondary: "bg-callout-accent text-foreground hover:opacity-90",
	outline: "border border-foreground text-foreground hover:bg-foreground hover:text-background",
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

type MotionButtonProps = Omit<HTMLMotionProps<"button">, keyof ButtonProps> & ButtonProps;

export const Button = forwardRef<HTMLButtonElement, MotionButtonProps>(
	({ variant = "primary", size = "md", loading = false, disabled, className = "", children, ...props }, ref) => {
		const isDisabled = disabled || loading;

		const baseClasses = "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-all duration-200";
		const disabledClasses = isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer";

		return (
			<motion.button ref={ref}
			               disabled={isDisabled}
			               className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabledClasses} ${className}`}
			               whileHover={isDisabled ? undefined : { scale: 1.02 }}
			               whileTap={isDisabled ? undefined : { scale: 0.98 }}
			               transition={{ duration: 0.15 }}
			               {...props}>
				{loading && <Spinner />}
				{children}
			</motion.button>
		);
	}
);

Button.displayName = "Button";

export default Button;
