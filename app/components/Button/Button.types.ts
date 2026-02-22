export type ButtonVariant = "primary" | "secondary" | "outline" | "accent" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps {
	variant?: ButtonVariant;
	size?: ButtonSize;
	loading?: boolean;
	disabled?: boolean;
	className?: string;
	children?: React.ReactNode;
}
