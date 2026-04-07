"use client";

import React, { forwardRef, useId } from "react";

import { InputProps, InputSize, FieldIssue } from "./Input.types";

const sizeClasses: Record<InputSize, string> = {
	sm: "py-2 px-3 text-sm",
	md: "py-3 px-4",
	lg: "py-4 px-5 text-lg",
};

const severityOrder: Record<FieldIssue["severity"], number> = {
	error: 0,
	warning: 1,
	info: 2,
};

const severityBorder: Record<FieldIssue["severity"], string> = {
	error: "border-red-500",
	warning: "border-orange-400",
	info: "border-blue-400",
};

const severityText: Record<FieldIssue["severity"], string> = {
	error: "text-red-500",
	warning: "text-orange-500",
	info: "text-blue-500",
};


export const Input = forwardRef<HTMLInputElement, InputProps>(
	({ label, error, issues, size = "sm", className = "", id, ...props }, ref) => {
		const generatedId = useId();
		const inputId = id || generatedId;

		const hasIssues = issues && issues.length > 0;
		const highestSeverity = hasIssues
			? issues.reduce((acc, i) => (severityOrder[i.severity] < severityOrder[acc] ? i.severity : acc), issues[0].severity)
			: null;

		const baseClasses = "w-full border rounded-md bg-background text-foreground placeholder:text-text-gray transition-colors duration-200";
		const focusClasses = "focus:ring focus:ring-callout-accent focus:outline-none";
		const borderClasses = error
			? "border-red-500"
			: highestSeverity
				? severityBorder[highestSeverity]
				: "border-border";

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
					<span className="text-sm text-red-500">{error}</span>
				)}
				{hasIssues && issues.map((issue, i) => (
					<span key={i}
					      className={`text-xs ${severityText[issue.severity]}`}>
						{issue.message}
					</span>
				))}
			</div>
		);
	}
);

Input.displayName = "Input";

export default Input;