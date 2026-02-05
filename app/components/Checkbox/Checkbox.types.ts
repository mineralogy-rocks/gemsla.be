import { InputHTMLAttributes } from "react";

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
	label: string;
	checked: boolean;
	onChange: () => void;
}
