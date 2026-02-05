"use client";

import { Button } from "../components/Button";
import { PageHeader } from "../components/PageHeader";
import type { User } from "@supabase/supabase-js";

interface DashboardContentProps {
	user: User;
}

export function DashboardContent({ user }: DashboardContentProps) {
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
					<PageHeader title="Dashboard"
						           subtitle={`Welcome back, ${user.email}.`} />

					<div className="border border-border rounded-lg p-6 bg-background">
						<h2 className="text-lg font-medium mb-4">
							Account Information
						</h2>
						<dl className="space-y-3">
							<div>
								<dt className="text-sm text-text-gray">Email</dt>
								<dd className="text-foreground">{user.email}</dd>
							</div>
							<div>
								<dt className="text-sm text-text-gray">User ID</dt>
								<dd className="text-foreground text-sm font-mono">{user.id}</dd>
							</div>
							<div>
								<dt className="text-sm text-text-gray">Last Sign In</dt>
								<dd className="text-foreground">
									{user.last_sign_in_at
										? new Date(user.last_sign_in_at).toLocaleString()
										: "N/A"}
								</dd>
							</div>
						</dl>
					</div>
				</div>
			</section>
		</div>
	);
}
