import { InputHTMLAttributes } from "react";

export interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
	value: string;
	onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	onClear: () => void;
	placeholder?: string;
}
