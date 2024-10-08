import HeaderBox from "@/components/HeaderBox";
import RightSidebar from "../components/RightSidebar";
import TotalBalanceBox from "../components/TotalBalanceBox";
import IssueChart from "./IssueChart";
import React from "react";

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
	const loggedIn = { firstName: "Andrew", lastName: "Chepurny", email: "andrew@chip-hosting.com" };
	return (
		<>
			<section className="home">
				<div className="home-content">
					<header className="home-header">
						<TotalBalanceBox accounts={[]} totalBanks={1} totalCurrentBalance={1234.12} />
						<HeaderBox title={"Welcome"} user={loggedIn.firstName || "Guest"} subtext={"Make that money!"} />
					</header>
					RECENT TRANSACTIONS
				</div>
				<RightSidebar user={loggedIn} transactions={[]} banks={[]} />
			</section>
		</>
	);
}

/**
 * <div className="container mr-auto px-4">
				<dl className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
					{stats.map((stat) => (
						<div key={stat.name} className="flex flex-col items-center p-6 bg-white shadow rounded-lg">
							<dt className="text-sm font-medium text-gray-500">{stat.name}</dt>
							<dd className={classNames(stat.changeType === "negative" ? "text-rose-600" : "text-gray-700", "text-xs font-medium")}>
								{stat.change}
							</dd>
							<dd className="text-3xl font-semibold text-gray-900">{stat.value}</dd>
						</div>
					))}
				</dl>
				<IssueChart />
			</div>
 * 
 */
