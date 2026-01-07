import { NextResponse } from "next/server";
import { Resend } from "resend";

import { createClient } from "@/lib/supabase/server";

const resend = new Resend(process.env.RESEND_API_KEY);

const SERVICE_LABELS: Record<string, string> = {
	initial_consultation: "Initial Consultation (€90)",
	standard_examination: "Standard Examination (€165)",
	comprehensive_analysis: "Comprehensive Analysis (€320)",
};

function generateEmailTemplate(name: string, email: string, message: string, chosenService?: string): string {
	const timestamp = new Date().toLocaleString("en-US", {
		dateStyle: "medium",
		timeStyle: "short",
	});

	return `
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>New Contact Submission</title>
</head>
<body style="margin: 0; padding: 0; background-color: #faf6f1; font-family: Georgia, 'Times New Roman', serif;">
	<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #faf6f1;">
		<tr>
			<td align="center" style="padding: 40px 20px;">
				<table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border: 1px solid #d9d4cc;">
					<tr>
						<td style="padding: 32px 40px; border-bottom: 1px solid #d9d4cc; text-align: center;">
							<h1 style="margin: 0; font-size: 24px; font-weight: 400; letter-spacing: 0.08em; color: #1a1a1a; text-transform: uppercase;">
								Olena Gem
							</h1>
						</td>
					</tr>
					<tr>
						<td style="padding: 40px;">
							<h2 style="margin: 0 0 32px 0; font-size: 18px; font-weight: 400; letter-spacing: 0.08em; color: #1a1a1a; text-transform: uppercase; text-align: center;">
								New Contact Submission
							</h2>
							<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 24px;">
								<tr>
									<td>
										<p style="margin: 0 0 4px 0; font-size: 12px; font-weight: 400; letter-spacing: 0.08em; color: #5c5c5c; text-transform: uppercase;">
											Name
										</p>
										<p style="margin: 0; font-size: 16px; color: #1a1a1a; line-height: 1.5;">
											${name}
										</p>
									</td>
								</tr>
							</table>
							<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 24px;">
								<tr>
									<td>
										<p style="margin: 0 0 4px 0; font-size: 12px; font-weight: 400; letter-spacing: 0.08em; color: #5c5c5c; text-transform: uppercase;">
											Email
										</p>
										<p style="margin: 0; font-size: 16px; color: #1a1a1a; line-height: 1.5;">
											<a href="mailto:${email}" style="color: #1a1a1a; text-decoration: underline;">${email}</a>
										</p>
									</td>
								</tr>
							</table>
							${chosenService ? `
							<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 24px;">
								<tr>
									<td>
										<p style="margin: 0 0 4px 0; font-size: 12px; font-weight: 400; letter-spacing: 0.08em; color: #5c5c5c; text-transform: uppercase;">
											Interested In
										</p>
										<p style="margin: 0; font-size: 16px; color: #c4a77d; font-weight: 500; line-height: 1.5;">
											${SERVICE_LABELS[chosenService] || chosenService}
										</p>
									</td>
								</tr>
							</table>
							` : ""}
							<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
								<tr>
									<td>
										<p style="margin: 0 0 4px 0; font-size: 12px; font-weight: 400; letter-spacing: 0.08em; color: #5c5c5c; text-transform: uppercase;">
											Message
										</p>
										<p style="margin: 0; font-size: 16px; color: #1a1a1a; line-height: 1.6; white-space: pre-wrap;">${message.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
									</td>
								</tr>
							</table>
						</td>
					</tr>
					<tr>
						<td style="padding: 24px 40px; border-top: 1px solid #d9d4cc; text-align: center;">
							<p style="margin: 0; font-size: 13px; color: #5c5c5c;">
								Received: ${timestamp}
							</p>
						</td>
					</tr>
				</table>
			</td>
		</tr>
	</table>
</body>
</html>
	`.trim();
}

export async function POST(request: Request) {
	try {
		const { name, email, message, chosen_service } = await request.json();

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

		// Validate chosen_service if provided
		const validServices = ["initial_consultation", "standard_examination", "comprehensive_analysis"];
		const sanitizedService = chosen_service && validServices.includes(chosen_service) ? chosen_service : null;

		const supabase = await createClient();
		await supabase.from('contact_submissions').insert({
			name,
			email,
			message,
			chosen_service: sanitizedService,
		});

		const { error: emailError } = await resend.emails.send({
			from: "GemsLabe <noreply@notifications.gemsla.be>",
			to: ["liubomyr.gavryliv@gmail.com"],
			replyTo: email,
			subject: `New contact from ${name}${sanitizedService ? ` - ${SERVICE_LABELS[sanitizedService]}` : ""}`,
			html: generateEmailTemplate(name, email, message, sanitizedService || undefined),
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
