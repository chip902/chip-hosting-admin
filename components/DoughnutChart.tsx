"use client";
import { DoughnutChartProps } from "@/types";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

const DoughnutChart = ({ accounts }: DoughnutChartProps) => {
	// Generate a color for each account
	const generateColors = (numColors: number) => {
		const colors = [];
		for (let i = 0; i < numColors; i++) {
			const hue = (i * 137.5) % 360; // Use golden angle approximation for distribution
			colors.push(`hsl(${hue}, 70%, 60%)`);
		}
		return colors;
	};

	const data = {
		datasets: [
			{
				label: "Account Balance",
				data: accounts.map((account) => account.currentBalance),
				backgroundColor: generateColors(accounts.length),
			},
		],
		labels: accounts.map((account) => account.name),
	};

	return (
		<Doughnut
			options={{
				cutout: "60%",
				plugins: {
					legend: {
						display: false,
					},
					tooltip: {
						callbacks: {
							label: (context) => {
								const label = context.label || "";
								const value = context.formattedValue;
								return `${label}: $${value}`;
							},
						},
					},
				},
			}}
			data={data}
		/>
	);
};

export default DoughnutChart;
