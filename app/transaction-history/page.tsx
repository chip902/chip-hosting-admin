// app/transaction-history/page.tsx
import { authOptions } from "@/auth";
import HeaderBox from "@/components/HeaderBox";
import TransactionView from "@/components/TransactionView";
import { getAccounts } from "@/lib/actions/bank.actions";
import { Account, GetAccountsResult } from "@/types";
import { getServerSession } from "next-auth/next";

const TransactionHistory = async () => {
	const session = await getServerSession(authOptions);

	let accounts: Account[] = [];
	if (session?.user) {
		const user = session.user;
		const userId = user.userId;

		if (typeof userId === "string") {
			const accountsResult: GetAccountsResult = await getAccounts(userId);
			accounts = accountsResult.accounts;
		} else {
			console.error("UserId is not a string:", userId);
		}
	}

	return (
		<div className="transactions space-y-6 overflow-x-auto w-full">
			<div className="transactions-header flex justify-between items-center">
				<HeaderBox title="Transaction History" subtext={`${accounts.length} Account${accounts.length !== 1 ? "s" : ""}`} />
			</div>
			<TransactionView accounts={accounts} userId={session?.user?.userId} />
		</div>
	);
};

export default TransactionHistory;
