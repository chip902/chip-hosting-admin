"use client";

import { ResponsiveContainer, BarChart, XAxis, YAxis, Bar } from "recharts";
import React from "react";
import { Card } from "@/components/ui/card";

const IssueChart = () => {
	const data = [
		{ label: "Revenue", value: 405091.0, unit: "USD" },
		{ label: "Overdue invoices", value: 12787.0, unit: "USD" },
		{ label: "Outstanding invoices", value: 245988.0, unit: "USD" },
		{ label: "Expenses", value: 30156.0, unit: "USD" },
	];
	return (
		<Card className="p-10 mt-10">
			<ResponsiveContainer width="100%" height={300} className="px-5">
				<BarChart data={data}>
					<XAxis dataKey="label" />
					<YAxis />
					<Bar dataKey="value" barSize={60} style={{ fill: "darkcyan" }} />
				</BarChart>
			</ResponsiveContainer>
		</Card>
	);
};
export default IssueChart;
