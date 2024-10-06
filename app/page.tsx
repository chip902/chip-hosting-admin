import HeaderBox from "@/components/HeaderBox";
import RightSidebar from "../components/RightSidebar";
import TotalBalanceBox from "../components/TotalBalanceBox";
import React from "react";
import { auth } from "@/auth";
import { User } from "next-auth";
import { Bank } from "@/types";

export default async function Home() {
	const session = await auth();
	const user = session?.user as User;
	const userName = user?.name || user?.email || "Guest";

	return (
		<>
			<section className="home">
				<div className="home-content">
					<header className="home-header">
						<HeaderBox type="greeting" title="Welcome" user={userName} subtext="Make that money!" />
						<TotalBalanceBox accounts={[]} totalBanks={1} totalCurrentBalance={1234.12} />
					</header>
					RECENT TRANSACTIONS
				</div>
				{user ? <RightSidebar user={user as User} transactions={[]} banks={[]} /> : "Loading User Data ..."}
			</section>
		</>
	);
}
