"use client";

import { useEffect, useCallback, useRef, type RefObject } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

interface NavLink {
	href: string;
	label: string;
}

interface MobileMenuProps {
	isOpen: boolean;
	onClose: () => void;
	links: NavLink[];
	triggerRef?: RefObject<HTMLButtonElement | null>;
}

export function MobileMenu({ isOpen, onClose, links, triggerRef }: MobileMenuProps) {
	const pathname = usePathname();
	const menuRef = useRef<HTMLDivElement>(null);
	const prevPathname = useRef(pathname);
	const prefersReducedMotion = useReducedMotion();

	useEffect(() => {
		if (prevPathname.current !== pathname) {
			prevPathname.current = pathname;
			onClose();
		}
	}, [pathname, onClose]);

	useEffect(() => {
		if (isOpen) {
			const firstLink = menuRef.current?.querySelector<HTMLElement>("a, button");
			firstLink?.focus();
		} else {
			triggerRef?.current?.focus();
		}
	}, [isOpen, triggerRef]);

	const handleKeyDown = useCallback(
		(e: KeyboardEvent) => {
			if (e.key === "Escape") {
				onClose();
				return;
			}

			if (e.key !== "Tab" || !menuRef.current) return;

			const focusable = Array.from(
				menuRef.current.querySelectorAll<HTMLElement>(
					'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
				)
			);
			if (focusable.length === 0) return;

			const first = focusable[0];
			const last = focusable[focusable.length - 1];

			if (e.shiftKey) {
				if (document.activeElement === first) {
					e.preventDefault();
					last.focus();
				}
			} else {
				if (document.activeElement === last) {
					e.preventDefault();
					first.focus();
				}
			}
		},
		[onClose]
	);

	useEffect(() => {
		if (!isOpen) return;
		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [isOpen, handleKeyDown]);

	const menuTransition = prefersReducedMotion
		? { duration: 0 }
		: { duration: 0.2, ease: [0.22, 1, 0.36, 1] as const };

	return (
		<AnimatePresence>
			{isOpen && (
				<>
					<motion.div
						className="fixed inset-0 z-50 bg-foreground/20"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={menuTransition}
						onClick={onClose}
						aria-hidden="true"
					/>

					<motion.div
						ref={menuRef}
						id="mobile-menu"
						className="fixed top-16 left-0 right-0 z-[55] bg-background border-b border-border shadow-lg"
						initial={{ opacity: 0, y: prefersReducedMotion ? 0 : -8 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: prefersReducedMotion ? 0 : -8 }}
						transition={menuTransition}
						role="dialog"
						aria-modal="true"
						aria-label="Mobile navigation"
					>
						<nav>
							<ul className="max-w-5xl mx-auto px-4 py-2 flex flex-col">
								{links.map(({ href, label }) => (
									<li key={href}>
										<Link
											href={href}
											onClick={onClose}
											className="flex items-center min-h-[44px] px-2 text-sm text-foreground hover:text-callout-accent focus-visible:outline-2 focus-visible:outline-foreground focus-visible:outline-offset-2 transition-colors duration-300 border-b border-border/50 last:border-0"
										>
											{label}
										</Link>
									</li>
								))}
							</ul>
						</nav>
					</motion.div>
				</>
			)}
		</AnimatePresence>
	);
}

export default MobileMenu;
