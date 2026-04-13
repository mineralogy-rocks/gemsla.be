"use client";

import type { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface BulkActionBarProps {
	isOpen: boolean;
	selectedCount: number;
	children: ReactNode;
}


export function BulkActionBar({ isOpen, selectedCount, children }: BulkActionBarProps) {
	return (
		<AnimatePresence>
			{isOpen && (
				<motion.div initial={{ opacity: 0, y: 20 }}
				            animate={{ opacity: 1, y: 0 }}
				            exit={{ opacity: 0, y: 20 }}
				            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
				            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 rounded-lg border border-border bg-background px-4 py-2.5 shadow-lg">
					<span className="text-xs font-medium text-text-gray tabular-nums">
						{selectedCount} selected
					</span>
					<div className="h-4 w-px bg-border" />
					{children}
				</motion.div>
			)}
		</AnimatePresence>
	);
}