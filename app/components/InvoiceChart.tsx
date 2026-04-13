"use client";

import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Legend,
	ResponsiveContainer,
} from "recharts";

import type { MonthlyInvoiceStat } from "@/app/api/stones/types";


interface InvoiceChartProps {
	data: MonthlyInvoiceStat[];
}


function fmtMonth(month: string) {
	const [year, m] = month.split("-");
	return new Date(Number(year), Number(m) - 1).toLocaleString("default", { month: "short", year: "2-digit" });
}

function fmtEur(value: number) {
	return `€${value.toLocaleString("en", { maximumFractionDigits: 0 })}`;
}


export function InvoiceChart({ data }: InvoiceChartProps) {
	if (data.length === 0) return null;

	const chartData = data.map((d) => ({ ...d, month: fmtMonth(d.month) }));

	return (
		<div className="mb-5">
			<ResponsiveContainer width="100%"
			                     height={160}>
				<BarChart data={chartData}
				          barGap={2}
				          barCategoryGap="30%"
				          margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
					<CartesianGrid vertical={false}
					               stroke="#f0ece6"
					               strokeDasharray="2 4" />
					<XAxis dataKey="month"
					       tick={{ fontSize: 10, fill: "#5c5c5c" }}
					       axisLine={false}
					       tickLine={false} />
					<YAxis tickFormatter={fmtEur}
					       tick={{ fontSize: 10, fill: "#5c5c5c" }}
					       axisLine={false}
					       tickLine={false}
					       width={60} />
					<Tooltip formatter={(value) => fmtEur(Number(value))}
					         contentStyle={{
						         fontSize: 11,
						         border: "none",
						         borderRadius: 4,
						         background: "white",
						         boxShadow: "0 1px 6px rgba(0,0,0,0.08)",
					         }} />
					<Legend wrapperStyle={{ fontSize: 11, paddingTop: 12 }} />
					<Bar dataKey="invested_all"
					     name="Invested (projected)"
					     fill="#e6e0d6"
					     radius={[2, 2, 0, 0]} />
					<Bar dataKey="invested_paid"
					     name="Invested (paid)"
					     fill="#5c5c5c"
					     radius={[2, 2, 0, 0]} />
					<Bar dataKey="revenue_all"
					     name="Revenue (projected)"
					     fill="#bfdbfe"
					     radius={[2, 2, 0, 0]} />
					<Bar dataKey="revenue_paid"
					     name="Revenue (paid)"
					     fill="#3b82f6"
					     radius={[2, 2, 0, 0]} />
				</BarChart>
			</ResponsiveContainer>
		</div>
	);
}
