"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "../components/Button";

type ErrorType = "auth_error" | "expired_link" | "invalid_token" | "default";

interface ErrorConfig {
	title: string;
	defaultMessage: string;
	showRequestNewLink: boolean;
}

const errorConfigs: Record<ErrorType, ErrorConfig> = {
	auth_error: {
		title: "Authentication Error",
		defaultMessage: "There was a problem with your authentication. Please try signing in again.",
		showRequestNewLink: true,
	},
	expired_link: {
		title: "Link Expired",
		defaultMessage: "This password reset link has expired. Please request a new one to continue.",
		showRequestNewLink: true,
	},
	invalid_token: {
		title: "Invalid Link",
		defaultMessage: "This link is invalid or has already been used. Please request a new one.",
		showRequestNewLink: true,
	},
	default: {
		title: "Oops!",
		defaultMessage: "Something went wrong",
		showRequestNewLink: false,
	},
};

function ErrorContent() {
	const searchParams = useSearchParams();
	const type = (searchParams.get("type") as ErrorType) || "default";
	const message = searchParams.get("message");

	const config = errorConfigs[type] || errorConfigs.default;
	const displayMessage = message || config.defaultMessage;

	return (
		<div className="min-h-screen relative pt-16">
			<div className="fixed inset-0 z-0 opacity-10 pointer-events-none"
			     style={{
				     backgroundImage: 'url("/NNNoise Texture Generator.svg")',
				     backgroundSize: "400px 400px",
				     backgroundRepeat: "repeat",
			     }} />

			<section className="relative py-12 px-4 sm:px-6 lg:px-8 z-10">
				<div className="max-w-md mx-auto text-center">
					<h1 className="mb-4">
						{config.title}
					</h1>
					<p className="text-text-gray mb-8">
						{displayMessage}
					</p>
					<div className="flex flex-col sm:flex-row justify-center gap-4">
						{config.showRequestNewLink && (
							<Link href="/auth/sign-in/forgot-password">
								<Button variant="primary"
								        size="md">
									Request New Link
								</Button>
							</Link>
						)}
						<Link href="/">
							<Button variant={config.showRequestNewLink ? "outline" : "primary"}
							        size="md">
								Go Home
							</Button>
						</Link>
						{!config.showRequestNewLink && (
							<Link href="/auth/sign-in">
								<Button variant="outline"
								        size="md">
									Try Sign In
								</Button>
							</Link>
						)}
					</div>
				</div>
			</section>
		</div>
	);
}

export default function ErrorPage() {
	return (
		<Suspense fallback={<div className="min-h-screen pt-16" />}>
			<ErrorContent />
		</Suspense>
	);
}
