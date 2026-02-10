"use client";

import React, { forwardRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SearchInputProps } from "./SearchInput.types";

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
	({ value, onChange, onClear, placeholder = "Search...", className = "", ...props }, ref) => {
		const baseClasses = "w-full rounded-md border border-border bg-background py-2.5 pl-10 pr-10 text-foreground placeholder:text-text-gray transition-colors duration-200";
		const focusClasses = "focus:border-callout-accent focus:outline-none focus:ring-2 focus:ring-callout-accent";

		return (
			<div className="relative">
				<svg className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-text-gray"
				     fill="none"
				     viewBox="0 0 24 24"
				     stroke="currentColor">
					<path strokeLinecap="round"
					      strokeLinejoin="round"
					      strokeWidth={1.5}
					      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
				</svg>

				<input ref={ref}
				       type="text"
				       value={value}
				       onChange={onChange}
				       placeholder={placeholder}
				       className={`${baseClasses} ${focusClasses} ${className}`}
				       {...props} />

				<AnimatePresence>
					{value && (
						<motion.button type="button"
						               onClick={onClear}
						               initial={{ opacity: 0, scale: 0.8 }}
						               animate={{ opacity: 1, scale: 1 }}
						               exit={{ opacity: 0, scale: 0.8 }}
						               transition={{ duration: 0.15 }}
						               className="absolute right-3 top-1/2 -translate-y-1/2 text-text-gray transition-colors duration-200 hover:text-foreground">
							<svg className="h-5 w-5"
							     fill="none"
							     viewBox="0 0 24 24"
							     stroke="currentColor">
								<path strokeLinecap="round"
								      strokeLinejoin="round"
								      strokeWidth={1.5}
								      d="M6 18L18 6M6 6l12 12" />
							</svg>
						</motion.button>
					)}
				</AnimatePresence>
			</div>
		);
	}
);

SearchInput.displayName = "SearchInput";
export default SearchInput;
