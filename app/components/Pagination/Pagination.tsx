"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { type PaginationProps } from "./Pagination.types";

const generatePageNumbers = (currentPage: number, totalPages: number): (number | "...")[] => {
	if (totalPages <= 7) {
		return Array.from({ length: totalPages }, (_, i) => i + 1);
	}

	const pages: (number | "...")[] = [];

	if (currentPage <= 4) {
		pages.push(1, 2, 3, 4, 5, "...", totalPages);
	} else if (currentPage >= totalPages - 3) {
		pages.push(1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
	} else {
		pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
	}

	return pages;
};

const ChevronLeft = () => (
	<svg className="h-4 w-4"
	     fill="none"
	     stroke="currentColor"
	     viewBox="0 0 24 24"
	     xmlns="http://www.w3.org/2000/svg">
		<path strokeLinecap="round"
		      strokeLinejoin="round"
		      strokeWidth={2}
		      d="M15 19l-7-7 7-7" />
	</svg>
);

const ChevronRight = () => (
	<svg className="h-4 w-4"
	     fill="none"
	     stroke="currentColor"
	     viewBox="0 0 24 24"
	     xmlns="http://www.w3.org/2000/svg">
		<path strokeLinecap="round"
		      strokeLinejoin="round"
		      strokeWidth={2}
		      d="M9 5l7 7-7 7" />
	</svg>
);

export const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange, className = "" }) => {
	const prefersReducedMotion = useReducedMotion();
	const pageNumbers = generatePageNumbers(currentPage, totalPages);

	const isPreviousDisabled = currentPage === 1;
	const isNextDisabled = currentPage === totalPages;

	const baseButtonClasses = "inline-flex items-center justify-center min-w-[32px] h-8 rounded-md text-xs font-medium transition-all duration-250 ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground";

	return (
		<div className={`flex items-center justify-end gap-1 ${className}`}>
			<motion.button onClick={() => onPageChange(currentPage - 1)}
			               disabled={isPreviousDisabled}
			               className={`${baseButtonClasses} px-3 text-foreground hover:bg-background-creme/50 ${isPreviousDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
			               whileTap={isPreviousDisabled || prefersReducedMotion ? undefined : { scale: 0.95 }}>
				<ChevronLeft />
				<span className="hidden sm:inline">Previous</span>
			</motion.button>

			{pageNumbers.map((page, index) => {
				if (page === "...") {
					return (
						<span key={`ellipsis-${index}`}
						      className="inline-flex items-center justify-center min-w-[32px] h-8 text-text-gray">
							...
						</span>
					);
				}

				const isActive = page === currentPage;

				return (
					<motion.button key={page}
					               onClick={() => onPageChange(page)}
					               disabled={isActive}
					               className={`${baseButtonClasses} ${
						               isActive
							               ? "bg-foreground text-background cursor-default"
							               : "border border-border bg-background text-foreground hover:border-gold cursor-pointer"
					               } ${index > 2 && index < pageNumbers.length - 1 ? "hidden sm:inline-flex" : ""}`}
					               whileTap={isActive || prefersReducedMotion ? undefined : { scale: 0.95 }}>
						{page}
					</motion.button>
				);
			})}

			<motion.button onClick={() => onPageChange(currentPage + 1)}
			               disabled={isNextDisabled}
			               className={`${baseButtonClasses} px-3 text-foreground hover:bg-background-creme/50 ${isNextDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
			               whileTap={isNextDisabled || prefersReducedMotion ? undefined : { scale: 0.95 }}>
				<span className="hidden sm:inline">Next</span>
				<ChevronRight />
			</motion.button>
		</div>
	);
};

Pagination.displayName = "Pagination";

export default Pagination;
