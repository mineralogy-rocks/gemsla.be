"use client";

import {useState, useEffect} from "react";
import Link from "next/link";

export function Header() {
	const [isScrolled, setIsScrolled] = useState(false);

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
						<Link href="/pricing"
						      className="text-sm text-foreground hover:text-callout-accent transition-colors duration-300">
							Pricing
						</Link>
						<Link href="/contact"
						      className="text-sm text-foreground hover:text-callout-accent transition-colors duration-300">
							Contact
						</Link>
					</div>
				</div>
			</nav>
		</header>
	);
}

export default Header;
