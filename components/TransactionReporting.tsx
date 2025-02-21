"use client";
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useSyncTransactions } from "@/app/hooks/useSyncTransactions";
import { usePlaidTransactions } from "@/app/hooks/usePlaidTransactions";

import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import TransactionsTable from "./TransactionsTable";
import _ from "lodash";
import { Account, Transaction } from "@/types";
import { formatAmount } from "@/lib/utils";
import TaxReportGenerator from "./TaxReportGenerator";
import { Alert, AlertDescription } from "./ui/alert";

interface TransactionReportingProps {
	userId: string;
	range?: {
		startDate: Date | undefined;
		endDate: Date | undefined;
	};
}

const TransactionReporting = ({
	userId,
	range = {
		startDate: new Date(new Date().setDate(1)),
		endDate: new Date(),
	},
}: TransactionReportingProps) => {
	const [selectedTab, setSelectedTab] = useState("all");

	const { data: banksData } = useQuery({
		queryKey: ["plaidBanks", userId],
		queryFn: async () => {
			const response = await axios.get(`/api/bank/get-accounts?userId=${userId}`);
			return response;
		},
	});

	const { mutate: syncTransactions, isPending: isSyncing, isSuccess: isSyncSuccess, data: syncData } = useSyncTransactions(userId);
	const { transactions, isLoading, error } = usePlaidTransactions(userId, range);
	// Extract accounts from banksData, ensuring we have the correct structure
	const accounts =
		banksData?.data?.accounts?.map((account: Account) => ({
			...account,
			id: account.id || account.accountId, // fallback to accountId if id not present
			accountId: account.accountId || account.id, // ensure we have accountId
			name: account.name || account.official_name || "Unknown Bank",
		})) || [];

	console.log("Processed accounts:", accounts);

	// Add debug logging to see what we're working with
	console.log("Transactions:", transactions);
	console.log("Accounts:", accounts);

	// Filter out accounts without IDs and ensure unique keys
	const validAccounts = accounts.filter((account: Account): account is Account & { accountId: string } => {
		if (!account.accountId) {
			console.warn("Account found without accountId:", account);
			return false;
		}
		return true;
	});

	const getFilteredTransactions = (accountId?: string) => {
		if (!accountId || accountId === "all") {
			return transactions;
		}

		console.log("Filtering transactions:", {
			accountId,
			totalTransactions: transactions?.length || 0,
			matchingTransactions: transactions?.filter((tx) => tx.accountId === accountId)?.length || 0,
		});

		return transactions?.filter((tx) => tx.accountId === accountId) || [];
	};

	// Add error handling
	if (error) {
		return <div className="flex items-center justify-center p-4">Error loading transactions: {error.message}</div>;
	}

	// Early return for loading state
	if (isLoading) {
		return <div className="flex items-center justify-center p-4">Loading transactions...</div>;
	}

	return (
		<div className="flex flex-col gap-8">
			{/* Controls */}
			<div className="flex flex-col md:flex-row gap-4 items-center justify-between">
				<Button onClick={() => syncTransactions()} disabled={isSyncing} className="plaidlink-primary">
					{isSyncing ? "Syncing..." : "Sync Transactions"}
				</Button>
			</div>

			{isSyncSuccess && (
				<Alert>
					<AlertDescription>Successfully synced transactions from {syncData?.results?.length} banks</AlertDescription>
				</Alert>
			)}

			{/* Bank Tabs and Transactions */}
			<div className="rounded-lg overflow-x-auto border border-gray-200 bg-white p-6 dark:bg-gray-800 dark:border-gray-700">
				<h2 className="text-18 font-semibold text-gray-900 dark:text-gray-100 mb-4">Transaction Details</h2>

				<Tabs value={selectedTab} onValueChange={setSelectedTab}>
					<TabsList>
						<TabsTrigger value="all">All Banks</TabsTrigger>
						{accounts.map((account: Account) => (
							<TabsTrigger key={`tab-${account.id}`} value={account.accountId}>
								{account.name}
							</TabsTrigger>
						))}
					</TabsList>

					<TabsContent value="all">
						<div className="p-4">
							<TransactionsTable transactions={transactions} />
						</div>
					</TabsContent>

					{accounts.map((account: Account) => (
						<TabsContent key={`transactions-${account.id}`} value={account.accountId}>
							<div className="p-4">
								<TransactionsTable filterByBank={account.name} transactions={getFilteredTransactions(account.accountId)} />
							</div>
						</TabsContent>
					))}
				</Tabs>
			</div>

			<div className="rounded-lg overflow-x-auto border border-gray-200 bg-white p-6 dark:bg-gray-800 dark:border-gray-700">
				<h2 className="text-18 font-semibold text-gray-900 dark:text-gray-100 mb-4">Tax Reporting</h2>
				<TaxReportGenerator transactions={transactions} year={new Date().getFullYear() - 1} />
			</div>
		</div>
	);
};

export default TransactionReporting;
