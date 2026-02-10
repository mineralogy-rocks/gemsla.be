"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Input } from "../../../components/Input";
import { Button } from "../../../components/Button";
import { resetPassword } from "../../../actions/auth";

const initialState = { error: null as string | null, success: false };

export default function ForgotPasswordPage() {
	const [state, formAction, pending] = useActionState(
		async (_prevState: typeof initialState, formData: FormData): Promise<typeof initialState> => {
			const result = await resetPassword(formData);
			if ('error' in result && result.error) {
				return { error: result.error, success: false };
			}
			return { error: null, success: true };
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
						Reset Password
					</h1>

					{state.success ? (
						<div className="text-center"
						     role="alert"
						     aria-live="polite">
							<p className="text-text-gray mb-8">
								Check your email for a password reset link. If you don&apos;t see it, check your spam folder.
							</p>
							<Link href="/auth/sign-in"
							      className="text-sm text-foreground hover:text-callout-accent transition-colors duration-300">
								Back to Sign In
							</Link>
						</div>
					) : (
						<>
							<p className="text-center text-text-gray mb-8">
								Enter your email address and we&apos;ll send you a link to reset your password.
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
											{pending ? "Sending..." : "Send Reset Link"}
										</Button>
									</div>

									<div className="text-center">
										<Link href="/auth/sign-in"
										      className="text-sm text-text-gray hover:text-callout-accent transition-colors duration-300">
											Back to Sign In
										</Link>
									</div>
								</div>
							</form>
						</>
					)}
				</div>
			</section>
		</div>
	);
}
