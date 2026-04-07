"use client";

import { useState } from "react";

import type { Issue } from "@/app/api/stones/types";


interface IssuesBannerProps {
	issues: Issue[];
	onApplyFix?: (issue: Issue) => void;
}


export function IssuesBanner({ issues, onApplyFix }: IssuesBannerProps) {
	const [expanded, setExpanded] = useState(false);

	if (issues.length === 0) return null;

	const errors = issues.filter((i) => i.severity === "error");
	const warnings = issues.filter((i) => i.severity === "warning");
	const infos = issues.filter((i) => i.severity === "info");

	const variant: "danger" | "warning" | "info" =
		errors.length > 0 ? "danger" : warnings.length > 0 ? "warning" : "info";

	const borderColor = errors.length > 0 ? "border-red-400" : warnings.length > 0 ? "border-orange-400" : "border-blue-400";
	const dotColor = errors.length > 0 ? "bg-red-500" : warnings.length > 0 ? "bg-orange-500" : "bg-blue-500";
	const summaryColor = errors.length > 0 ? "text-red-600" : warnings.length > 0 ? "text-orange-600" : "text-blue-600";

	const severityColor = (severity: Issue["severity"]) => {
		if (severity === "error") return "text-red-600";
		if (severity === "warning") return "text-orange-600";
		return "text-blue-600";
	};

	const summary = [
		errors.length && `${errors.length} error${errors.length > 1 ? "s" : ""}`,
		warnings.length && `${warnings.length} warning${warnings.length > 1 ? "s" : ""}`,
		infos.length && `${infos.length} note${infos.length > 1 ? "s" : ""}`,
	].filter(Boolean).join(", ");

	return (
		<div className={`rounded-lg mb-5 px-3.5 py-2.5 border ${borderColor}`}>
			<div className="flex items-center gap-2.5">
				<span className={`w-2 h-2 rounded-full ${dotColor}`} />
				<span className={`text-xs ${summaryColor} flex-1`}>{summary}</span>
				<button onClick={() => setExpanded(!expanded)}
				        className={`text-xs px-2.5 py-1 rounded ${summaryColor} hover:opacity-80`}>
					{expanded ? "Hide" : "Review"}
				</button>
			</div>

			{expanded && (
				<ul className="mt-3 mb-1 pl-5.5 text-xs list-disc">
					{issues.map((issue, idx) => (
						<li key={idx}
						    className={`mb-1.5 leading-relaxed ${severityColor(issue.severity)}`}>
							<span className="font-medium capitalize">{issue.severity}:</span>{" "}
							{issue.message}
							{issue.field && <span className="opacity-70"> ({issue.field})</span>}
							{issue.fix && onApplyFix && (
								<button className="ml-2 text-[11px] px-2 py-0.5 rounded border border-border-light hover:bg-background-creme/50"
								        onClick={() => onApplyFix(issue)}>
									{issue.fix}
								</button>
							)}
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
