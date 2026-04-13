"use client";

import { useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";


interface SlidePanelProps {
	isOpen: boolean;
	onClose: () => void;
	title?: string;
	children: React.ReactNode;
	footer?: React.ReactNode;
	maxWidth?: string;
}


const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];


export function SlidePanel({
	isOpen,
	onClose,
	title,
	children,
	footer,
	maxWidth = "28rem",
}: SlidePanelProps) {
	const handleClose = useCallback(() => {
		onClose();
	}, [onClose]);

	useEffect(() => {
		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === "Escape" && isOpen) handleClose();
		};

		document.addEventListener("keydown", handleEscape);
		return () => document.removeEventListener("keydown", handleEscape);
	}, [isOpen, handleClose]);

	useEffect(() => {
		if (isOpen) {
			document.body.style.overflow = "hidden";
		}
		return () => {
			document.body.style.overflow = "";
		};
	}, [isOpen]);


	return (
		<AnimatePresence>
			{isOpen && (
				<div className="fixed inset-0 z-50"
				     role="dialog"
				     aria-modal="true">
					<motion.div className="fixed inset-0 bg-foreground/50"
					            initial={{ opacity: 0 }}
					            animate={{ opacity: 1 }}
					            exit={{ opacity: 0 }}
					            transition={{ duration: 0.2 }}
					            onClick={handleClose}
					            aria-hidden="true" />

					<motion.div className="fixed inset-y-0 right-0 w-full flex flex-col bg-background shadow-xl"
					            style={{ maxWidth }}
					            initial={{ x: "100%" }}
					            animate={{ x: 0 }}
					            exit={{ x: "100%" }}
					            transition={{ duration: 0.3, ease: EASE }}>
						{title && (
							<div className="flex items-center justify-between border-b border-border px-6 py-4 shrink-0">
								<h2 className="text-lg font-medium text-foreground">{title}</h2>
								<button onClick={handleClose}
								        className="rounded-md p-1 text-text-gray hover:text-foreground transition-colors">
									<svg className="h-5 w-5"
									     fill="none"
									     viewBox="0 0 24 24"
									     stroke="currentColor">
										<path strokeLinecap="round"
										      strokeLinejoin="round"
										      strokeWidth={1.5}
										      d="M6 18L18 6M6 6l12 12" />
									</svg>
								</button>
							</div>
						)}

						<div className="flex-1 overflow-y-auto px-6 py-5">
							{children}
						</div>

						{footer && (
							<div className="border-t border-border px-6 py-4 shrink-0">
								{footer}
							</div>
						)}
					</motion.div>
				</div>
			)}
		</AnimatePresence>
	);
}
