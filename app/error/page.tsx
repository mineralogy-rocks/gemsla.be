"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "../components/Button";

function ErrorContent() {
	const searchParams = useSearchParams();
	const message = searchParams.get("message") || "Something went wrong";

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
						Oops!
					</h1>
					<p className="text-text-gray mb-8">
						{message}
					</p>
					<div className="flex flex-col sm:flex-row justify-center gap-4">
						<Link href="/">
							<Button variant="primary"
							        size="md">
								Go Home
							</Button>
						</Link>
						<Link href="/sign-in">
							<Button variant="outline"
							        size="md">
								Try Sign In
							</Button>
						</Link>
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
