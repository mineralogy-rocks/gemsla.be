import { InputHTMLAttributes } from "react";

export type InputSize = "sm" | "md" | "lg";

export interface FieldIssue {
	severity: "error" | "warning" | "info";
	message: string;
}

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
	label?: string;
	error?: string;
	issues?: FieldIssue[];
	size?: InputSize;
}
