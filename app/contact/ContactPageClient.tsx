"use client";

import {useState, useEffect, Suspense} from "react";
import {useSearchParams} from "next/navigation";
import {Input} from "../components/Input";
import {TextArea} from "../components/TextArea";
import {Select} from "../components/Select";
import {Button} from "../components/Button";
import {PageHeader} from "../components/PageHeader";

const serviceOptions = [
	{ value: "initial_consultation", label: "Initial Consultation (€70)" },
	{ value: "standard_examination", label: "Standard Examination (€140)" },
	{ value: "comprehensive_analysis", label: "Comprehensive Analysis (€300)" },
];

const serviceParamMap: Record<string, string> = {
	initial: "initial_consultation",
	standard: "standard_examination",
	comprehensive: "comprehensive_analysis",
};

function ContactForm() {
	const searchParams = useSearchParams();
	const [formData, setFormData] = useState({
		name: "",
		email: "",
		chosen_service: "",
		message: "",
	});
	const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
	const [errorMessage, setErrorMessage] = useState("");

	useEffect(() => {
		const serviceParam = searchParams.get("service");
		if (serviceParam && serviceParamMap[serviceParam]) {
			setFormData((prev) => ({
				...prev,
				chosen_service: serviceParamMap[serviceParam],
			}));
		}
	}, [searchParams]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setStatus("loading");
		setErrorMessage("");

		try {
			const response = await fetch("/api/contact", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(formData),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || "Failed to submit form");
			}

			setStatus("success");
			setFormData({name: "", email: "", chosen_service: "", message: ""});
		} catch (error) {
			setStatus("error");
			setErrorMessage(error instanceof Error ? error.message : "Something went wrong");
		}
	};

	return (
		<div className="min-h-screen relative pt-16">
			<div className="fixed inset-0 z-0 opacity-10 pointer-events-none"
			     style={{
				     backgroundImage: 'url("/NNNoise Texture Generator.svg")',
				     backgroundSize: "400px 400px",
				     backgroundRepeat: "repeat",
			     }} />

			<section className="relative py-12 px-4 sm:px-6 lg:px-8 z-10">
				<div className="max-w-2xl mx-auto">
					<PageHeader layout="centered"
						           title={<>I&apos;d Love to Hear From You</>}
						           subtitle="Whether you have a question about gemstones, need a consultation, or just want to say hello, I'm here and happy to help."
						           subtitleClassName="max-w-lg mx-auto" />

					<div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-6 mb-12">
						<a href="https://instagram.com/olena_rybnikova"
						   target="_blank"
						   rel="noopener noreferrer"
						   className="flex items-center justify-center gap-2 min-h-11 min-w-11 px-4 py-2 -mx-4 -my-2 text-foreground hover:text-callout-accent transition-colors duration-300">
							<svg xmlns="http://www.w3.org/2000/svg"
							     width="22"
							     height="22"
							     viewBox="0 0 24 24"
							     fill="none"
							     stroke="currentColor"
							     strokeWidth="1.5"
							     strokeLinecap="round"
							     strokeLinejoin="round">
								<rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
								<path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
								<line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
							</svg>
							<span>Instagram</span>
						</a>
						<a href="https://www.linkedin.com/in/olena-rybnikova-phd/"
						   target="_blank"
						   rel="noopener noreferrer"
						   className="flex items-center justify-center gap-2 min-h-[44px] min-w-[44px] px-4 py-2 -mx-4 -my-2 text-foreground hover:text-callout-accent transition-colors duration-300">
							<svg xmlns="http://www.w3.org/2000/svg"
							     width="22"
							     height="22"
							     viewBox="0 0 24 24"
							     fill="none"
							     stroke="currentColor"
							     strokeWidth="1.5"
							     strokeLinecap="round"
							     strokeLinejoin="round">
								<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
								<rect width="4" height="12" x="2" y="9" />
								<circle cx="4" cy="4" r="2" />
							</svg>
							<span>LinkedIn</span>
						</a>
					</div>

					{status === "success" ? (
						<div className="text-center py-12"
						     role="alert"
						     aria-live="polite">
							<p className="text-xl text-foreground mb-4">
								Thank you for your message!
							</p>
							<p className="text-text-gray mb-8">
								I&apos;ll get back to you as soon as possible.
							</p>
							<div className="mt-10">
								<Button variant="outline"
								        size="md"
								        onClick={() => setStatus("idle")}>
									Send Another Message
								</Button>
							</div>
						</div>
					) : (
						<form onSubmit={handleSubmit}>
							<div className="flex flex-col gap-5">
								<div>
									<Input label="Name"
									       id="name-input"
									       placeholder="Your name"
									       value={formData.name}
									       onChange={(e) =>
										       setFormData({...formData, name: e.target.value})
									       }
									       required />
								</div>

								<div>
									<Input label="Email"
									       id="email-input"
									       type="email"
									       placeholder="your.email@example.com"
									       value={formData.email}
									       onChange={(e) =>
										       setFormData({...formData, email: e.target.value})
									       }
									       aria-describedby={status === "error" ? "error-message" : undefined}
									       required />
								</div>

								<div>
									<Select label="Interested In"
									        id="service-select"
									        placeholder="Not sure yet"
									        options={serviceOptions}
									        value={formData.chosen_service}
									        onChange={(e) =>
										        setFormData({...formData, chosen_service: e.target.value})
									        } />
								</div>

								<div>
									<TextArea label="Message"
									          id="message-input"
									          placeholder="How can I help you?"
									          value={formData.message}
									          onChange={(e) =>
										          setFormData({...formData, message: e.target.value})
									          }
									          rows={6}
									          required />
								</div>

								{status === "error" && (
									<div role="alert"
									     aria-live="polite">
										<p id="error-message"
										   className="text-sm text-red-500">
											{errorMessage}
										</p>
									</div>
								)}

								<div className="flex justify-end">
									<Button type="submit"
									        size="sm"
									        disabled={status === "loading"}
									        loading={status === "loading"}>
										{status === "loading" ? "Sending..." : "Send Message"}
									</Button>
								</div>
							</div>
						</form>
					)}
				</div>
			</section>
		</div>
	);
}

export function ContactPageClient() {
	return (
		<Suspense fallback={<div className="min-h-screen pt-16" />}>
			<ContactForm />
		</Suspense>
	);
}
