"use client";

import { Toaster } from "react-hot-toast";

export function ToastProvider() {
	return (
		<Toaster position="bottom-right"
		         toastOptions={{
			         duration: 3000,
			         style: {
				         background: "#f5f0e8",
				         color: "#000000",
				         border: "0.5px solid #d4cec4",
				         fontFamily: "var(--font-lora)",
				         fontSize: "0.875rem",
			         },
			         success: {
				         iconTheme: {
					         primary: "#c4a77d",
					         secondary: "#f5f0e8",
				         },
			         },
			         error: {
				         iconTheme: {
					         primary: "#ef4444",
					         secondary: "#f5f0e8",
				         },
			         },
		         }} />
	);
}
