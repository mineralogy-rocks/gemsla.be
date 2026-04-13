import { TextareaHTMLAttributes } from "react";

import type { FieldIssue } from "../Input/Input.types";

export type TextAreaSize = "sm" | "md" | "lg";

export interface TextAreaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "size"> {
	label?: string;
	error?: string;
	issues?: FieldIssue[];
	size?: TextAreaSize;
	rows?: number;
}
