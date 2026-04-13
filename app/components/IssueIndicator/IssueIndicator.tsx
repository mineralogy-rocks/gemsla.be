"use client";

import type { FieldIssue } from "../Input/Input.types";


const severityText: Record<FieldIssue["severity"], string> = {
	error: "text-red-500",
	warning: "text-orange-500",
	info: "text-blue-500",
};


interface IssueIndicatorProps {
	issues?: FieldIssue[];
}

export function IssueIndicator({ issues }: IssueIndicatorProps) {
	if (!issues || issues.length === 0) return null;

	return (
		<>
			{issues.map((issue, i) => (
				<span key={i}
				      className={`block text-[10px] leading-tight mt-0.5 ${severityText[issue.severity]}`}>
					{issue.message}
				</span>
			))}
		</>
	);
}
