import type {Metadata} from "next";
import {ContactPageClient} from "./ContactPageClient";

export const metadata: Metadata = {
	title: "Contact",
	description: "Get in touch with Olena Rybnikova for professional gemological services. Request a consultation, ask questions about gemstones, or book an examination.",
	openGraph: {
		title: "Contact | GemsLabé",
		description: "Get in touch for professional gemological services. Request a consultation or book an examination.",
		url: 'https://gemsla.be/contact',
	},
};

export default function ContactPage() {
	return <ContactPageClient />;
}
