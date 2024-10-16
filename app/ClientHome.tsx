"use client";

import { useDwollaAccounts } from "@/app/hooks/useDwollaAccounts";
import { usePlaidBanks } from "@/app/hooks/usePlaidBanks";
import TotalBalanceBox from "@/components/TotalBalanceBox";

interface ClientHomeProps {
	userId: string;
}

export default function ClientHome({ userId }: ClientHomeProps) {
	const { data: dwollaAccounts, isLoading: isDwollaLoading } = useDwollaAccounts(userId);
	const { data: plaidData, isLoading: isPlaidLoading } = usePlaidBanks(userId);

	const accounts = plaidData?.accounts || [];
	const totalBanks = plaidData?.totalBanks || 0;
	const totalCurrentBalance = plaidData?.totalCurrentBalance || 0;

	if (isDwollaLoading || isPlaidLoading) {
		return <div>Loading account data...</div>;
	}

	return <TotalBalanceBox accounts={accounts} totalBanks={totalBanks} totalCurrentBalance={totalCurrentBalance} />;
}
