import HeaderBox from "@/components/HeaderBox";
import RightSidebar from "../components/RightSidebar";
import TotalBalanceBox from "../components/TotalBalanceBox";
import IssueChart from "./IssueChart";
import React from "react";
import { auth } from "@/auth";
import { User } from "next-auth";

export default async function Home() {
	const session = await auth();
	const userName = session?.user?.name || session?.user?.email || "Guest";

	return (
		<>
			<section className="home">
				<div className="home-content">
					<header className="home-header">
						<TotalBalanceBox accounts={[]} totalBanks={1} totalCurrentBalance={1234.12} />
						<HeaderBox type="greeting" title="Welcome" user={userName} subtext="Make that money!" />
					</header>
					RECENT TRANSACTIONS
				</div>
				<RightSidebar user={session?.user as User | null} transactions={[]} banks={[]} />
			</section>
		</>
	);
}
