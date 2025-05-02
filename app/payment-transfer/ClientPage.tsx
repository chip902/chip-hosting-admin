"use client";
import { usePlaidBanks } from "@/app/hooks/usePlaidBanks";
import { usePlaidTransactions } from "@/app/hooks/usePlaidTransactions";
import { useEffect } from "react";
import { useToast } from "@/app/hooks/useToast";
import { Account } from "@/types";
import BankCard from "@/components/BankCard";
import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert } from "@/components/ui/alert";

interface ClientPageProps {
	userId: string;
	userName: string;
}

export default function ClientHome({ userId, userName }: ClientPageProps) {
	const { data: plaidData, isLoading: isPlaidLoading, error: plaidError } = usePlaidBanks(userId);
	const { transactions, isLoading: isTransactionsLoading, error: transactionsError } = usePlaidTransactions(userId);
	const { toast } = useToast();

	const accounts = plaidData?.accounts || [];

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

	if (accounts.length > 0) {
		return (
			<>
				{accounts.map((account: Account) => (
					<BankCard userName={userName} account={account} key={account.id} />
				))}
			</>
		);
	} else {
		return <Alert>No accounts found.</Alert>;
	}
}
