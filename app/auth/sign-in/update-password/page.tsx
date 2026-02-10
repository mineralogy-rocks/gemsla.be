"use client";

import { useActionState } from "react";
import { Input } from "../../../components/Input";
import { Button } from "../../../components/Button";
import { updatePassword } from "../../../actions/auth";

const initialState = { error: null as string | null };

export default function UpdatePasswordPage() {
	const [state, formAction, pending] = useActionState(
		async (_prevState: typeof initialState, formData: FormData) => {
			const result = await updatePassword(formData);
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
						Update Password
					</h1>
					<p className="text-center text-text-gray mb-8">
						Enter your new password below.
					</p>

					<form action={formAction}>
						<div className="flex flex-col gap-5">
							<div>
								<Input label="New Password"
								       id="password-input"
								       name="password"
								       size="md"
								       type="password"
								       placeholder="Enter new password"
								       autoComplete="new-password"
								       required />
							</div>

							<div>
								<Input label="Confirm Password"
								       id="confirm-password-input"
								       name="confirmPassword"
								       size="md"
								       type="password"
								       placeholder="Confirm new password"
								       autoComplete="new-password"
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
									{pending ? "Updating..." : "Update Password"}
								</Button>
							</div>
						</div>
					</form>
				</div>
			</section>
		</div>
	);
}
