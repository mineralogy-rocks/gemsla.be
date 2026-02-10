export type ButtonVariant = "primary" | "secondary" | "outline" | "accent";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps {
	variant?: ButtonVariant;
	size?: ButtonSize;
	loading?: boolean;
	disabled?: boolean;
	className?: string;
	children?: React.ReactNode;
}
