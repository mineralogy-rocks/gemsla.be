"use client";

import {useState, useEffect, useActionState} from "react";
import Link from "next/link";
import {signOut} from "@/app/actions/auth";
import {Button} from "@/app/components/Button";
import type {User} from "@supabase/supabase-js";

interface HeaderProps {
	user: User | null;
	isAdmin?: boolean;
}

export function Header({ user, isAdmin = false }: HeaderProps) {
	const [isScrolled, setIsScrolled] = useState(false);
	const [signOutState, signOutAction, signOutPending] = useActionState(
		async () => {
			const result = await signOut();
			if (result?.error) {
				console.error('Sign out error:', result.error);
				return { error: result.error };
			}
			return { error: null };
		},
		{ error: null as string | null }
	);

	useEffect(() => {
		const handleScroll = () => {
			setIsScrolled(window.scrollY > 20);
		};

		window.addEventListener("scroll", handleScroll, {passive: true});
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	return (
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

					<div className="flex items-center gap-6 sm:gap-8">
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
				</div>
			</nav>
		</header>
	);
}

export default Header;
