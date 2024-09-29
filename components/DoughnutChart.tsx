"use client";
import { DoughnutChartProps } from "@/types";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

const DoughnutChart = ({ accounts }: DoughnutChartProps) => {
	const data = {
		datasets: [
			{
				label: "Banks",
				data: [2314, 9843, 2318],
				backgroundColor: ["#0747b6", "#2265d8", "#2f91fa"],
			},
		],
		labels: ["Bank A", "Bank B", "Bank C"],
	};
	return (
		<Doughnut
			options={{
				cutout: "60%",
				plugins: {
					legend: {
						display: false,
					},
				},
			}}
			data={data}
		/>
	);
};

export default DoughnutChart;
