"use client";
import { useDwollaAccounts } from "@/app/hooks/useDwollaAccounts";
import { usePlaidBanks } from "@/app/hooks/usePlaidBanks";
import { usePlaidTransactions } from "@/app/hooks/usePlaidTransactions";
import { useEffect } from "react";
import { useToast } from "@/app/hooks/useToast";
import { Skeleton, Text } from "@radix-ui/themes";
import { Account } from "@/types";
import BankCard from "@/components/BankCard";
import React from "react";

interface ClientPageProps {
	userId: string;
	userName: string;
}

export default function ClientHome({ userId, userName }: ClientPageProps) {
	const { data: dwollaAccounts, isLoading: isDwollaLoading, error: dwollaError } = useDwollaAccounts(userId);
	const { data: plaidData, isLoading: isPlaidLoading, error: plaidError } = usePlaidBanks(userId);
	const { data: transactions, isLoading: isTransactionsLoading, error: transactionsError } = usePlaidTransactions(userId);
	const { toast } = useToast();

	const accounts = plaidData?.accounts || [];

	useEffect(() => {
		if (dwollaError || plaidError || transactionsError) {
			toast({
				variant: "destructive",
				title: "Error",
				description: dwollaError?.message || plaidError?.message || transactionsError?.message || "An error occurred while fetching data.",
			});
		}
	}, [dwollaError, plaidError, transactionsError, toast]);

	if (isDwollaLoading || isPlaidLoading || isTransactionsLoading) {
		return <Skeleton className="w-full h-full" />;
	}

	if (accounts.length > 0) {
		return (
			<>
				{accounts.map((account: Account) => (
					<BankCard userName={userName} account={account} key={account.id} />
				))}
			</>
		);
	} else {
		return <Text>No accounts found.</Text>;
	}
}