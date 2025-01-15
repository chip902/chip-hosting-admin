"use client";
import { usePlaidBanks } from "@/app/hooks/usePlaidBanks";
import { usePlaidTransactions } from "@/app/hooks/usePlaidTransactions";
import RecentTransactions from "@/components/RecentTransactions";
import TotalBalanceBox from "@/components/TotalBalanceBox";
import { useEffect } from "react";
import { useToast } from "@/app/hooks/useToast";
import { Skeleton } from "@radix-ui/themes";

interface ClientHomeProps {
	userId: string;
}

export default function ClientHome({ userId }: ClientHomeProps) {
	const { data: plaidData, isLoading: isPlaidLoading, error: plaidError } = usePlaidBanks(userId);
	const { data: transactions, isLoading: isTransactionsLoading, error: transactionsError } = usePlaidTransactions(userId);
	const { toast } = useToast();

	const accounts = plaidData?.accounts || [];
	const totalBanks = plaidData?.totalBanks || 0;
	const totalCurrentBalance = plaidData?.totalCurrentBalance || 0;

	useEffect(() => {
		if (plaidError || transactionsError) {
			toast({
				variant: "destructive",
				title: "Error",
				description: plaidError?.message || transactionsError?.message || "An error occurred while fetching data.",
			});
		}
	}, [plaidError, transactionsError, toast]);

	if (isPlaidLoading || isTransactionsLoading) {
		return <Skeleton className="w-full h-full" />;
	}
	return (
		<div>
			<TotalBalanceBox accounts={accounts} totalBanks={totalBanks} totalCurrentBalance={totalCurrentBalance} />
			<RecentTransactions accounts={accounts} transactions={transactions || { transactions: [] }} />
		</div>
	);
}
