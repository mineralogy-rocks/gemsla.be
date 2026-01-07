"use client";

import React, { forwardRef, useId } from "react";
import { TextAreaProps, TextAreaSize } from "./TextArea.types";

const sizeClasses: Record<TextAreaSize, string> = {
	sm: "py-2 px-3 text-sm",
	md: "py-3 px-4",
	lg: "py-4 px-5 text-lg",
};

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
	({ label, error, size = "md", rows = 4, className = "", id, ...props }, ref) => {
		const generatedId = useId();
		const textareaId = id || generatedId;

		const baseClasses = "w-full border rounded-md bg-background text-foreground placeholder:text-text-gray transition-colors duration-200 resize-vertical";
		const focusClasses = "focus:ring-2 focus:ring-callout-accent focus:outline-none";
		const borderClasses = error ? "border-red-500" : "border-border";

		return (
			<div className="flex flex-col gap-1.5">
				{label && (
					<label htmlFor={textareaId}
					       className="text-sm font-medium text-foreground">
						{label}
					</label>
				)}
				<textarea ref={ref}
				          id={textareaId}
				          rows={rows}
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

TextArea.displayName = "TextArea";

export default TextArea;
