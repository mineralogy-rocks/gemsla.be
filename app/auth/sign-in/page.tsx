"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Input } from "../../components/Input";
import { Button } from "../../components/Button";
import { signIn } from "../../actions/auth";

const initialState = { error: null as string | null };

export default function SignInPage() {
	const [state, formAction, pending] = useActionState(
		async (_prevState: typeof initialState, formData: FormData) => {
			const result = await signIn(formData);
			return result || { error: null };
		},
		initialState
	);

	return (
		<div className="min-h-screen relative pt-16">
			<div className="fixed inset-0 z-0 opacity-10 pointer-events-none"
			     style={{
				     backgroundImage: 'url("/NNNoise Texture Generator.svg")',
				     backgroundSize: "400px 400px",
				     backgroundRepeat: "repeat",
			     }} />

			<section className="relative py-12 px-4 sm:px-6 lg:px-8 z-10">
				<div className="max-w-md mx-auto">
					<h1 className="text-center mb-4">
						Sign In
					</h1>
					<p className="text-center text-text-gray mb-8">
						Enter your credentials to access the dashboard.
					</p>

					<form action={formAction}>
						<div className="flex flex-col gap-5">
							<div>
								<Input label="Email"
								       id="email-input"
								       name="email"
								       size="md"
								       type="email"
								       placeholder="your.email@example.com"
								       autoComplete="email"
								       required />
							</div>

							<div>
								<Input label="Password"
								       id="password-input"
								       name="password"
								       size="md"
								       type="password"
								       placeholder="Enter your password"
								       autoComplete="current-password"
								       required />
							</div>

							{state.error && (
								<div role="alert"
								     aria-live="polite">
									<p className="text-sm text-red-500">
										{state.error}
									</p>
								</div>
							)}

							<div>
								<Button type="submit"
								        size="md"
								        disabled={pending}
								        loading={pending}
								        className="w-full">
									{pending ? "Signing in..." : "Sign In"}
								</Button>
							</div>

							<div className="text-center">
								<Link href="/auth/sign-in/forgot-password"
								      className="text-sm text-text-gray hover:text-callout-accent transition-colors duration-300">
									Forgot your password?
								</Link>
							</div>
						</div>
					</form>
				</div>
			</section>
		</div>
	);
}
