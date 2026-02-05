"use client";

import React, { forwardRef, useId } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { CheckboxProps } from "./Checkbox.types";

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
	({ label, checked, onChange, className = "", id, ...props }, ref) => {
		const generatedId = useId();
		const checkboxId = id || generatedId;
		const prefersReducedMotion = useReducedMotion();

		return (
			<label htmlFor={checkboxId}
			       className={`inline-flex items-center gap-3 cursor-pointer group ${className}`}>
				<input ref={ref}
				       id={checkboxId}
				       type="checkbox"
				       checked={checked}
				       onChange={onChange}
				       className="sr-only"
				       {...props} />
				<div className="relative flex items-center justify-center w-5 h-5 border rounded transition-colors duration-200 border-border bg-background group-hover:border-gold group-focus-within:ring-2 group-focus-within:ring-callout-accent data-[checked=true]:bg-foreground data-[checked=true]:border-foreground"
				     data-checked={checked}>
					<motion.svg className="w-3 h-3 text-background"
					            xmlns="http://www.w3.org/2000/svg"
					            viewBox="0 0 24 24"
					            fill="none"
					            stroke="currentColor"
					            strokeWidth="3"
					            strokeLinecap="round"
					            strokeLinejoin="round"
					            initial={false}
					            animate={{
						            scale: checked ? 1 : 0,
						            opacity: checked ? 1 : 0,
					            }}
					            transition={{
						            duration: prefersReducedMotion ? 0 : 0.2,
						            ease: [0.22, 1, 0.36, 1],
					            }}>
						<polyline points="20 6 9 17 4 12" />
					</motion.svg>
				</div>
				<span className="text-foreground select-none">
					{label}
				</span>
			</label>
		);
	}
);

Checkbox.displayName = "Checkbox";

export default Checkbox;
