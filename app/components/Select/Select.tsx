"use client";

import React, { forwardRef, useId } from "react";
import { SelectProps, SelectSize } from "./Select.types";

const sizeClasses: Record<SelectSize, string> = {
	sm: "py-2 px-3 text-sm",
	md: "py-3 px-4",
	lg: "py-4 px-5 text-lg",
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
	({ label, error, size = "md", className = "", id, options, placeholder, ...props }, ref) => {
		const generatedId = useId();
		const selectId = id || generatedId;

		const baseClasses = "w-full border rounded-md bg-background text-foreground transition-colors duration-200 appearance-none cursor-pointer";
		const focusClasses = "focus:ring-2 focus:ring-callout-accent focus:outline-none";
		const borderClasses = error ? "border-red-500" : "border-border";

		return (
			<div className="flex flex-col gap-1.5">
				{label && (
					<label htmlFor={selectId}
					       className="text-sm font-medium text-foreground">
						{label}
					</label>
				)}
				<div className="relative">
					<select ref={ref}
					        id={selectId}
					        className={`${baseClasses} ${sizeClasses[size]} ${focusClasses} ${borderClasses} ${className} pr-10`}
					        {...props}>
						{placeholder && (
							<option value="">
								{placeholder}
							</option>
						)}
						{options.map((option) => (
							<option key={option.value}
							        value={option.value}>
								{option.label}
							</option>
						))}
					</select>
					<div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
						<svg className="h-5 w-5 text-text-gray"
						     viewBox="0 0 20 20"
						     fill="currentColor"
						     aria-hidden="true">
							<path fillRule="evenodd"
							      d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
							      clipRule="evenodd" />
						</svg>
					</div>
				</div>
				{error && (
					<span className="text-sm text-red-500">
						{error}
					</span>
				)}
			</div>
		);
	}
);

Select.displayName = "Select";

export default Select;
