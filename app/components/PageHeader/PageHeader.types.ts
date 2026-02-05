import type { ReactNode } from "react";

export type PageHeaderLayout = "default" | "centered";

export interface PageHeaderProps {
	title: ReactNode;
	subtitle?: ReactNode;
	actions?: ReactNode;
	layout?: PageHeaderLayout;
	animated?: boolean;
	className?: string;
	subtitleClassName?: string;
}
