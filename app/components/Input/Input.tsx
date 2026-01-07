"use client";

import React, { forwardRef, useId } from "react";
import { InputProps, InputSize } from "./Input.types";

const sizeClasses: Record<InputSize, string> = {
	sm: "py-2 px-3 text-sm",
	md: "py-3 px-4",
	lg: "py-4 px-5 text-lg",
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
	({ label, error, size = "md", className = "", id, ...props }, ref) => {
		const generatedId = useId();
		const inputId = id || generatedId;

		const baseClasses = "w-full border rounded-md bg-background text-foreground placeholder:text-text-gray transition-colors duration-200";
		const focusClasses = "focus:ring-2 focus:ring-callout-accent focus:outline-none";
		const borderClasses = error ? "border-red-500" : "border-border";

		return (
			<div className="flex flex-col gap-1.5">
				{label && (
					<label htmlFor={inputId}
					       className="text-sm font-medium text-foreground">
						{label}
					</label>
				)}
				<input ref={ref}
				       id={inputId}
				       className={`${baseClasses} ${sizeClasses[size]} ${focusClasses} ${borderClasses} ${className}`}
				       {...props} />
				{error && (
					<span className="text-sm text-red-500">
						{error}
					</span>
				)}
			</div>
		);
	}
);

Input.displayName = "Input";

export default Input;
