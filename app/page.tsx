const stats = [
	{ name: "Revenue", value: "$405,091.00", change: "+4.75%", changeType: "positive" },
	{ name: "Overdue invoices", value: "$12,787.00", change: "+54.02%", changeType: "negative" },
	{ name: "Outstanding invoices", value: "$245,988.00", change: "-1.39%", changeType: "positive" },
	{ name: "Expenses", value: "$30,156.00", change: "+10.18%", changeType: "negative" },
];

function classNames(...classes: string[]) {
	return classes.filter(Boolean).join(" ");
}

export default function Home() {
	return (
		<div className="container mx-auto px-4">
			<dl className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
				{stats.map((stat) => (
					<div key={stat.name} className="flex flex-col items-center p-6 bg-white shadow rounded-lg">
						<dt className="text-sm font-medium text-gray-500">{stat.name}</dt>
						<dd className={classNames(stat.changeType === "negative" ? "text-rose-600" : "text-gray-700", "text-xs font-medium")}>{stat.change}</dd>
						<dd className="text-3xl font-semibold text-gray-900">{stat.value}</dd>
					</div>
				))}
			</dl>
		</div>
	);
}
