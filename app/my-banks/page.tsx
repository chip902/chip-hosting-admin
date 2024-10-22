import HeaderBox from "@/components/HeaderBox";
import React from "react";
import ClientPage from "./ClientPage";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { User } from "@/types";

export default async function MyBanks() {
	const session = await getServerSession(authOptions);
	const user = session?.user as User | undefined;
	const userName = user?.name || user?.email || "Guest";
	if (!user) throw new Error("You must be logged in.");

	return (
		<section className="flex">
			<div className="my-banks">
				<HeaderBox title="My Accounts" subtext="Manage all Accounts" />
				<div className="space-y-4">
					<h2 className="header-2">Your Accounts</h2>
					<div className="flex flex-wrap gap-6">{user?.userId && <ClientPage userId={user.userId} userName={userName} />}</div>
				</div>
			</div>
		</section>
	);
}
