import { SelectHTMLAttributes } from "react";

export type SelectSize = "sm" | "md" | "lg";

export interface SelectOption {
	value: string;
	label: string;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> {
	label?: string;
	error?: string;
	size?: SelectSize;
	options: SelectOption[];
	placeholder?: string;
}
