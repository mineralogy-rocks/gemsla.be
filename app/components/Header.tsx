"use client";

import {useState, useEffect, useCallback, useRef, useActionState} from "react";
import Link from "next/link";
import toast from "react-hot-toast";

import {signOut} from "@/app/actions/auth";
import {Button} from "@/app/components/Button";
import {MobileMenu} from "@/app/components/MobileMenu";
import type {User} from "@supabase/supabase-js";

interface HeaderProps {
	user: User | null;
	isAdmin?: boolean;
}

export function Header({ user }: HeaderProps) {
	const [isScrolled, setIsScrolled] = useState(false);
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
	const hamburgerRef = useRef<HTMLButtonElement>(null);
	const [signOutState, signOutAction, signOutPending] = useActionState(
		async () => {
			const result = await signOut();
			if (result?.error) {
				toast.error("Failed to sign out. Please try again.");
				return { error: result.error };
			}
			return { error: null };
		},
		{ error: null as string | null }
	);

	useEffect(() => {
		const handleScroll = () => setIsScrolled(window.scrollY > 20);
		window.addEventListener("scroll", handleScroll, {passive: true});
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	useEffect(() => {
		document.body.style.overflow = isMobileMenuOpen ? "hidden" : "";
		return () => { document.body.style.overflow = ""; };
	}, [isMobileMenuOpen]);

	const closeMobileMenu = useCallback(() => setIsMobileMenuOpen(false), []);

	const navLinks = [
		{ href: "/about", label: "About" },
		{ href: "/pricing", label: "Pricing" },
		{ href: "/contact", label: "Contact" },
		{ href: "/blog", label: "Blog" },
		...(user ? [{ href: "/dashboard", label: "Dashboard" }] : []),
	];

	return (
		<>
			<header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
				isScrolled
					? "bg-background/70 backdrop-blur-sm"
					: "bg-transparent"
			}`}>
				<nav className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex items-center justify-between h-16">
						<Link href="/"
						      className="text-xl font-medium text-foreground hover:text-callout-accent transition-colors duration-300"
						      style={{letterSpacing: "0.08em"}}>
							GemsLab<i>é</i>
						</Link>

						<div className="hidden md:flex items-center gap-6 lg:gap-8">
							<Link href="/about"
							      className="text-sm text-foreground hover:text-callout-accent transition-colors duration-300">
								About
							</Link>
							<Link href="/pricing"
							      className="text-sm text-foreground hover:text-callout-accent transition-colors duration-300">
								Pricing
							</Link>
							<Link href="/contact"
							      className="text-sm text-foreground hover:text-callout-accent transition-colors duration-300">
								Contact
							</Link>
							<Link href="/blog"
							      className="text-sm text-foreground hover:text-callout-accent transition-colors duration-300">
								Blog
							</Link>
							{user ? (
								<>
									<Link href="/dashboard"
									      className="text-sm text-foreground hover:text-callout-accent transition-colors duration-300">
										Dashboard
									</Link>
									<form action={signOutAction}>
										<Button type="submit"
										        variant="primary"
										        size="sm"
										        loading={signOutPending}
										        disabled={signOutPending}>
											Sign Out
										</Button>
										{signOutState.error && (
											<p className="text-xs text-red-500 mt-1">
												{signOutState.error}
											</p>
										)}
									</form>
								</>
							) : (
								<Link href="/auth/sign-in">
									<Button variant="primary" size="sm">
										Sign In
									</Button>
								</Link>
							)}
						</div>

						<div className="flex md:hidden items-center gap-3">
							{user ? (
								<form action={signOutAction}>
									<Button type="submit"
									        variant="primary"
									        size="sm"
									        loading={signOutPending}
									        disabled={signOutPending}>
										Sign Out
									</Button>
									{signOutState.error && (
										<p className="text-xs text-red-500 mt-1">
											{signOutState.error}
										</p>
									)}
								</form>
							) : (
								<Link href="/auth/sign-in">
									<Button variant="primary" size="sm">
										Sign In
									</Button>
								</Link>
							)}
							<button
								ref={hamburgerRef}
								type="button"
								onClick={() => setIsMobileMenuOpen(prev => !prev)}
								className="flex items-center justify-center w-11 h-11 text-foreground hover:text-callout-accent focus-visible:outline-2 focus-visible:outline-foreground focus-visible:outline-offset-2 transition-colors duration-300"
								aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
								aria-expanded={isMobileMenuOpen}
								aria-controls="mobile-menu"
							>
								{isMobileMenuOpen ? (
									<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
										<line x1="18" y1="6" x2="6" y2="18" />
										<line x1="6" y1="6" x2="18" y2="18" />
									</svg>
								) : (
									<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
										<line x1="3" y1="6" x2="21" y2="6" />
										<line x1="3" y1="12" x2="21" y2="12" />
										<line x1="3" y1="18" x2="21" y2="18" />
									</svg>
								)}
							</button>
						</div>
					</div>
				</nav>
			</header>

			<MobileMenu
				isOpen={isMobileMenuOpen}
				onClose={closeMobileMenu}
				links={navLinks}
				triggerRef={hamburgerRef}
			/>
		</>
	);
}

export default Header;
