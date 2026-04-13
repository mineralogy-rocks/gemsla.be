"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { fadeInUp, staggerContainer, staggerItem } from "../lib/animations";
import type { User } from "@supabase/supabase-js";

interface DashboardContentProps {
	user: User;
	isAdmin: boolean;
}

export function DashboardContent({ user, isAdmin }: DashboardContentProps) {
	const displayName = user.user_metadata?.full_name || user.email?.split("@")[0];

	return (
		<div className="min-h-screen relative pt-16">
			<div className="fixed inset-0 z-0 opacity-10 pointer-events-none"
			     style={{
				     backgroundImage: 'url("/NNNoise Texture Generator.svg")',
				     backgroundSize: "400px 400px",
				     backgroundRepeat: "repeat",
			     }} />

			<section className="relative py-12 px-4 sm:px-6 lg:px-8 z-10">
				<div className="max-w-4xl mx-auto">
					<motion.div variants={staggerContainer}
					            initial="hidden"
					            animate="visible"
					            className="mb-10">
						<motion.div variants={staggerItem}
						            className="w-8 h-0.5 bg-gold mb-4" />
						<motion.h2 variants={staggerItem}
						           className="text-2xl sm:text-3xl font-medium text-foreground">
							Welcome back, {displayName}
						</motion.h2>
						<motion.p variants={staggerItem}
						          className="mt-2 text-text-gray">
							Manage your reports and services
						</motion.p>
					</motion.div>

					{isAdmin && (
						<motion.div variants={staggerContainer}
						            initial="hidden"
						            animate="visible"
						            className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
							<motion.div variants={staggerItem}>
								<Link href="/reports"
								      className="glass-card group flex flex-col p-6">
									<div className="flex items-center justify-between mb-3">
										<div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center">
											<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gold">
												<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
												<path d="M14 2v6h6" />
												<path d="M16 13H8" />
												<path d="M16 17H8" />
												<path d="M10 9H8" />
											</svg>
										</div>
										<span className="text-sm text-text-gray opacity-0 group-hover:opacity-100 transition-opacity duration-200">
											Open →
										</span>
									</div>
									<h3 className="text-lg font-medium text-foreground">Reports</h3>
									<p className="mt-1 text-sm text-text-gray">View and manage gemological reports</p>
								</Link>
							</motion.div>
							<motion.div variants={staggerItem}>
								<Link href="/stones"
								      className="glass-card group flex flex-col p-6">
									<div className="flex items-center justify-between mb-3">
										<div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center">
											<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gold">
												<path d="M12 2L2 7l10 5 10-5-10-5Z" />
												<path d="M2 17l10 5 10-5" />
												<path d="M2 12l10 5 10-5" />
											</svg>
										</div>
										<span className="text-sm text-text-gray opacity-0 group-hover:opacity-100 transition-opacity duration-200">
											Open →
										</span>
									</div>
									<h3 className="text-lg font-medium text-foreground">Stones</h3>
									<p className="mt-1 text-sm text-text-gray">Manage stone inventory</p>
								</Link>
							</motion.div>
							<motion.div variants={staggerItem}>
								<Link href="/invoices"
								      className="glass-card group flex flex-col p-6">
									<div className="flex items-center justify-between mb-3">
										<div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center">
											<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gold">
												<path d="M9 14l6-6" />
												<circle cx="9.5" cy="8.5" r="1.5" />
												<circle cx="14.5" cy="13.5" r="1.5" />
												<path d="M5 21V5a2 2 0 012-2h10a2 2 0 012 2v16l-3.5-2L12 21l-3.5-2L5 21z" />
											</svg>
										</div>
										<span className="text-sm text-text-gray opacity-0 group-hover:opacity-100 transition-opacity duration-200">
											Open →
										</span>
									</div>
									<h3 className="text-lg font-medium text-foreground">Invoices</h3>
									<p className="mt-1 text-sm text-text-gray">Manage invoices and PDF documents</p>
								</Link>
							</motion.div>
						</motion.div>
					)}
				</div>
			</section>
		</div>
	);
}
