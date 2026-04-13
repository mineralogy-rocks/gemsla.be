"use client";

import { useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/app/components/Button";

interface ConfirmDialogProps {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: () => void;
	title: string;
	message: string;
	confirmText?: string;
	isPending?: boolean;
}

export function ConfirmDialog({
	isOpen,
	onClose,
	onConfirm,
	title,
	message,
	confirmText = "Confirm",
	isPending = false,
}: ConfirmDialogProps) {
	const handleClose = useCallback(() => {
		if (!isPending) onClose();
	}, [onClose, isPending]);

	useEffect(() => {
		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === "Escape" && isOpen && !isPending) {
				handleClose();
			}
		};

		document.addEventListener("keydown", handleEscape);
		return () => document.removeEventListener("keydown", handleEscape);
	}, [isOpen, isPending, handleClose]);

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
				<div className="fixed inset-0 z-50 overflow-y-auto"
				     role="dialog"
				     aria-modal="true"
				     aria-labelledby="confirm-dialog-title">
					<div className="flex min-h-full items-center justify-center p-4 text-center">
						<motion.div className="fixed inset-0 bg-foreground/50"
						            initial={{ opacity: 0 }}
						            animate={{ opacity: 1 }}
						            exit={{ opacity: 0 }}
						            onClick={handleClose}
						            aria-hidden="true" />

						<motion.div className="relative w-full max-w-md transform overflow-hidden rounded-lg bg-background text-left shadow-xl"
						            initial={{ opacity: 0, scale: 0.95 }}
						            animate={{ opacity: 1, scale: 1 }}
						            exit={{ opacity: 0, scale: 0.95 }}
						            transition={{ duration: 0.2 }}>
							<div className="px-6 pb-4 pt-5">
								<div className="flex items-start gap-4">
									<div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-green-100">
										<svg className="h-6 w-6 text-green-600"
										     fill="none"
										     viewBox="0 0 24 24"
										     strokeWidth="1.5"
										     stroke="currentColor"
										     aria-hidden="true">
											<path strokeLinecap="round"
											      strokeLinejoin="round"
											      d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
										</svg>
									</div>

									<div className="flex-1">
										<h3 id="confirm-dialog-title"
										    className="text-lg font-semibold leading-6 text-foreground">
											{title}
										</h3>
										<p className="mt-2 text-sm text-text-gray">
											{message}
										</p>
									</div>
								</div>
							</div>

							<div className="flex flex-col-reverse gap-3 border-t border-border px-6 py-4 sm:flex-row sm:justify-end">
								<Button variant="outline"
								        size="sm"
								        onClick={handleClose}
								        disabled={isPending}
								        className="w-full sm:w-auto">
									Cancel
								</Button>
								<Button variant="primary"
								        size="sm"
								        onClick={onConfirm}
								        disabled={isPending}
								        loading={isPending}
								        className="w-full sm:w-auto">
									{confirmText}
								</Button>
							</div>
						</motion.div>
					</div>
				</div>
			)}
		</AnimatePresence>
	);
}

export default ConfirmDialog;
