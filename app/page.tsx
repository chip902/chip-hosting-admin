import HeaderBox from "@/components/HeaderBox";
import RightSidebar from "../components/RightSidebar";
import TotalBalanceBox from "../components/TotalBalanceBox";
import IssueChart from "./IssueChart";
import React from "react";
import { auth } from "@/auth";
import { User } from "next-auth";
import { headers } from "next/headers";
import { cookies } from "next/headers";

export default async function Home() {
	console.log("Home component rendered");
	let session;
	let error;
	let debugInfo: any = {};

	try {
		const headersList = headers();
		const cookieStore = cookies();
		const req = {
			headers: Object.fromEntries(headersList.entries()),
			method: "GET",
			url: "/",
			cookies: Object.fromEntries(cookieStore.getAll().map((c) => [c.name, c.value])),
		};
		const res = { getHeader: () => {}, setHeader: () => {} };
		session = await auth(req as any, res as any);
		console.log("Auth function called, session:", JSON.stringify(session, null, 2));

		debugInfo = {
			session,
			cookies: req.cookies,
		};
	} catch (e) {
		error = e;
		console.error("Error calling auth function:", e);
		debugInfo.error = e;
	}

	const userName = session?.user?.name || session?.user?.email || "Guest";
	console.log("User name being passed to HeaderBox:", userName);

	return (
		<>
			<section className="home">
				<div className="home-content">
					<header className="home-header">
						<TotalBalanceBox accounts={[]} totalBanks={1} totalCurrentBalance={1234.12} />
						<HeaderBox type="greeting" title="Welcome" user={userName} subtext="Make that money!" />
						<div>
							<h2>Debug Info:</h2>
							<pre>{JSON.stringify(debugInfo, null, 2)}</pre>
						</div>
					</header>
					RECENT TRANSACTIONS
				</div>
				<RightSidebar user={session?.user as User | null} transactions={[]} banks={[]} />
			</section>
		</>
	);
}
