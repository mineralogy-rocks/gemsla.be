"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/app/components/Button";
import { Input } from "@/app/components/Input";

interface DeleteDialogProps {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: () => void;
	title: string;
	message: string;
	confirmText?: string;
	isPending?: boolean;
}

export function DeleteDialog({
	isOpen,
	onClose,
	onConfirm,
	title,
	message,
	confirmText = "Delete",
	isPending = false,
}: DeleteDialogProps) {
	const [confirmInput, setConfirmInput] = useState("");

	const handleConfirm = useCallback(() => {
		if (confirmInput === "DELETE") {
			onConfirm();
			setConfirmInput("");
		}
	}, [confirmInput, onConfirm]);

	const handleClose = useCallback(() => {
		setConfirmInput("");
		onClose();
	}, [onClose]);

	// Handle escape key
	useEffect(() => {
		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === "Escape" && isOpen && !isPending) {
				handleClose();
			}
		};

		document.addEventListener("keydown", handleEscape);
		return () => document.removeEventListener("keydown", handleEscape);
	}, [isOpen, isPending, handleClose]);

	// Prevent body scroll when dialog is open
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
				     aria-labelledby="delete-dialog-title">
					<div className="flex min-h-full items-center justify-center p-4 text-center">
						{/* Backdrop */}
						<motion.div className="fixed inset-0 bg-foreground/50"
						            initial={{ opacity: 0 }}
						            animate={{ opacity: 1 }}
						            exit={{ opacity: 0 }}
						            onClick={handleClose}
						            aria-hidden="true" />

						{/* Dialog */}
						<motion.div className="relative w-full max-w-lg transform overflow-hidden rounded-lg bg-background text-left shadow-xl"
						            initial={{ opacity: 0, scale: 0.95 }}
						            animate={{ opacity: 1, scale: 1 }}
						            exit={{ opacity: 0, scale: 0.95 }}
						            transition={{ duration: 0.2 }}>
							<div className="px-6 pb-4 pt-5">
								<div className="flex items-start gap-4">
									{/* Warning icon */}
									<div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-100">
										<svg className="h-6 w-6 text-red-600"
										     fill="none"
										     viewBox="0 0 24 24"
										     strokeWidth="1.5"
										     stroke="currentColor"
										     aria-hidden="true">
											<path strokeLinecap="round"
											      strokeLinejoin="round"
											      d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
										</svg>
									</div>

									<div className="flex-1">
										<h3 id="delete-dialog-title"
										    className="text-lg font-semibold leading-6 text-foreground">
											{title}
										</h3>
										<div className="mt-2">
											<p className="text-sm text-text-gray">
												{message}
											</p>
											<p className="mt-4 text-sm text-text-gray">
												Type <span className="font-semibold text-foreground">DELETE</span> to confirm:
											</p>
											<Input size="sm"
											       value={confirmInput}
											       onChange={(e) => setConfirmInput(e.target.value)}
											       onKeyDown={(e) => {
												       if (e.key === "Enter" && confirmInput === "DELETE" && !isPending) {
													       handleConfirm();
												       }
											       }}
											       placeholder="DELETE"
											       disabled={isPending}
											       className="mt-2 disabled:opacity-50"
											       autoFocus
											       aria-label="Type DELETE to confirm" />
										</div>
									</div>
								</div>
							</div>

							<div className="flex flex-col-reverse gap-3 border-t border-border bg-background-creme px-6 py-4 sm:flex-row sm:justify-end">
								<Button variant="outline"
								        size="sm"
								        onClick={handleClose}
								        disabled={isPending}
								        className="w-full sm:w-auto">
									Cancel
								</Button>
								<Button variant="accent"
								        size="sm"
								        onClick={handleConfirm}
								        disabled={confirmInput !== "DELETE" || isPending}
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

export default DeleteDialog;
