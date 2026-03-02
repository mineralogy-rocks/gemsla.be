"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { Input } from "../../components/Input";
import { Button } from "../../components/Button";
import { signIn, signInWithGoogle } from "../../actions/auth";

const initialState = { error: null as string | null };

export default function SignInPage() {
	const [state, formAction, pending] = useActionState(
		async (_prevState: typeof initialState, formData: FormData) => {
			const result = await signIn(formData);
			return result || { error: null };
		},
		initialState
	);

	const [googleState, googleFormAction, googlePending] = useActionState(
		async () => {
			const result = await signInWithGoogle();
			return result || { error: null };
		},
		initialState
	);

	const searchParams = useSearchParams();
	const errorParam = searchParams.get("error");
	const errorMessage = errorParam === "unauthorized"
		? "Only admin accounts can sign in with Google."
		: errorParam
			? "An error occurred. Please try again."
			: null;

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

					{errorMessage && (
						<div role="alert"
						     className="mb-6">
							<p className="text-sm text-red-600 text-center">
								{errorMessage}
							</p>
						</div>
					)}

					{googleState.error && (
						<div role="alert"
						     className="mb-6">
							<p className="text-sm text-red-600 text-center">
								{googleState.error}
							</p>
						</div>
					)}

					<form action={googleFormAction}>
						<Button type="submit"
						        variant="outline"
						        size="sm"
						        disabled={googlePending}
						        loading={googlePending}
						        className="w-full flex items-center justify-center gap-3">
							<svg width="18"
							     height="18"
							     viewBox="0 0 18 18"
							     xmlns="http://www.w3.org/2000/svg"
							     aria-hidden="true">
								<path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
								      fill="#4285F4" />
								<path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
								      fill="#34A853" />
								<path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
								      fill="#FBBC05" />
								<path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"
								      fill="#EA4335" />
							</svg>
							{googlePending ? "Signing in..." : "Continue with Google"}
						</Button>
					</form>

					<div className="relative flex items-center my-6">
						<div className="flex-grow border-t border-border" />
						<span className="mx-4 text-sm text-text-gray">or</span>
						<div className="flex-grow border-t border-border" />
					</div>

					<form action={formAction}>
						<div className="flex flex-col gap-5">
							<Input label="Email"
							       id="email-input"
							       name="email"
							       type="email"
							       placeholder="your.email@example.com"
							       autoComplete="email"
							       required />

							<Input label="Password"
							       id="password-input"
							       name="password"
							       type="password"
							       placeholder="Enter your password"
							       autoComplete="current-password"
							       required />

							{state.error && (
								<div role="alert">
									<p className="text-sm text-red-600">
										{state.error}
									</p>
								</div>
							)}

							<Button type="submit"
							        size="sm"
							        disabled={pending}
							        loading={pending}
							        className="w-full">
								{pending ? "Signing in..." : "Sign In"}
							</Button>

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
