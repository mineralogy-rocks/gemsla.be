import { TextareaHTMLAttributes } from "react";

export type TextAreaSize = "sm" | "md" | "lg";

export interface TextAreaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "size"> {
	label?: string;
	error?: string;
	size?: TextAreaSize;
	rows?: number;
}
