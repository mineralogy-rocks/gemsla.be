import { NextResponse } from "next/server";
import { Resend } from "resend";

import { db } from "@/db";
import { contactSubmissions } from "@/db/schema";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
	try {
		const { name, email, message } = await request.json();

		if (!name || !email || !message) {
			return NextResponse.json(
				{ error: "All fields are required" },
				{ status: 400 }
			);
		}

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return NextResponse.json(
				{ error: "Invalid email format" },
				{ status: 400 }
			);
		}

		await db.insert(contactSubmissions).values({
			name,
			email,
			message,
		});

		const { error: emailError } = await resend.emails.send({
			from: "Contact Form <onboarding@resend.dev>",
			to: ["liubomyr.gavryliv@gmail.com"],
			subject: `New contact from ${name}`,
			html: `
				<h2>New Contact Form Submission</h2>
				<p><strong>Name:</strong> ${name}</p>
				<p><strong>Email:</strong> ${email}</p>
				<p><strong>Message:</strong></p>
				<p>${message.replace(/\n/g, "<br>")}</p>
			`,
		});

		if (emailError) {
			console.error("Email error:", emailError);
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Contact form error:", error);
		return NextResponse.json(
			{ error: "Failed to submit form" },
			{ status: 500 }
		);
	}
}
