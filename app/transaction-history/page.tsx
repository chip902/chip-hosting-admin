import { authOptions } from "@/auth";
import HeaderBox from "@/components/HeaderBox";
import TransactionsTable from "@/components/TransactionsTable";
import { getAccounts } from "@/lib/actions/bank.actions";
import { Account, SearchParamProps } from "@/types";
import { getServerSession } from "next-auth/next";
import React from "react";

const TransactionHistory = async ({ searchParams: { id, page } }: SearchParamProps) => {
	const session = await getServerSession(authOptions);

	let accounts: Account[] = [];
	if (session?.user) {
		const user = session.user;
		const userId = user.userId;

		if (typeof userId === "string") {
			accounts = await getAccounts(userId);
		} else {
			console.error("UserId is not a string:", userId);
		}
	}

	return (
		<div className="transactions">
			<div className="transactions-header">
				<HeaderBox title="Transaction History" subtext="Review Transaction Details" />
			</div>
			<div className="space-y-6">
				<div className="transactions-account">
					<div className="flex flex-col gap-2"></div>
				</div>
			</div>
		</div>
	);
};

export default TransactionHistory;
