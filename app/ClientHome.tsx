"use client";
import { useDwollaAccounts } from "@/app/hooks/useDwollaAccounts";
import { usePlaidBanks } from "@/app/hooks/usePlaidBanks";
import { usePlaidTransactions } from "@/app/hooks/usePlaidTransactions";
import RecentTransactions from "@/components/RecentTransactions";
import TotalBalanceBox from "@/components/TotalBalanceBox";

interface ClientHomeProps {
	userId: string;
}

export default function ClientHome({ userId }: ClientHomeProps) {
	const { data: dwollaAccounts, isLoading: isDwollaLoading } = useDwollaAccounts(userId);
	const { data: plaidData, isLoading: isPlaidLoading } = usePlaidBanks(userId);
	const { data: transactions, isLoading: isTransactionsLoading } = usePlaidTransactions(userId);

	const accounts = plaidData?.accounts || [];
	const totalBanks = plaidData?.totalBanks || 0;
	const totalCurrentBalance = plaidData?.totalCurrentBalance || 0;

	if (isDwollaLoading || isPlaidLoading || isTransactionsLoading) {
		return <div>Loading account data...</div>;
	}

	return (
		<>
			<TotalBalanceBox accounts={accounts} totalBanks={totalBanks} totalCurrentBalance={totalCurrentBalance} />
			<RecentTransactions accounts={accounts} transactions={transactions || []} page={1} />
		</>
	);
}
