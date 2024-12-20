import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import HeaderBox from "@/components/HeaderBox";
import RightSidebar from "../components/RightSidebar";
import TotalBalanceBox from "@/components/TotalBalanceBox";
import ClientHome from "./ClientHome";
import { User } from "@/types";

export default async function Home() {
	const session = await getServerSession(authOptions);
	const user = session?.user as User | undefined;
	const userName = user?.firstName || user?.email || "Guest";

	return (
		<section className="home">
			<div className="home-content">
				<header className="home-header">
					<HeaderBox type="greeting" title="Welcome" user={userName} subtext="Make that money!" />
				</header>
				{user && user.userId ? <ClientHome userId={user.userId} /> : <TotalBalanceBox accounts={[]} totalBanks={0} totalCurrentBalance={0} />}
			</div>
			{user ? <RightSidebar user={user} /> : "Loading User Data ..."}
		</section>
	);
}
