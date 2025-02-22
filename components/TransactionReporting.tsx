"use client";
import React, { useMemo, useState } from "react";
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
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "./ui/calendar";
import { format } from "date-fns";

interface TransactionReportingProps {
	userId: string;
	range?: {
		startDate: Date | undefined;
		endDate: Date | undefined;
	};
}

const TransactionReporting = ({ userId, range }: TransactionReportingProps) => {
	// Memoize the initial date range
	const initialDateRange = useMemo(
		() => ({
			startDate: new Date(new Date().setDate(1)),
			endDate: new Date(),
		}),
		[]
	);

	const [dateRange, setDateRange] = useState(initialDateRange);
	const [selectedTab, setSelectedTab] = useState("all");
	const currentYear = useMemo(() => dateRange.startDate.getFullYear(), [dateRange.startDate]);

	// Single source of truth for transactions
	const { transactions, isLoading, error } = usePlaidTransactions(userId, {
		startDate: dateRange.startDate,
		endDate: dateRange.endDate,
	});

	const yearTransactions = useMemo(() => {
		return transactions?.filter((tx) => new Date(tx.date).getFullYear() === currentYear) || [];
	}, [transactions, currentYear]);

	// Memoize the accounts query
	const { data: banksData } = useQuery({
		queryKey: ["plaidBanks", userId],
		queryFn: async () => {
			const response = await axios.get(`/api/bank/get-accounts?userId=${userId}`);
			return response;
		},
		staleTime: 30000, // Add staleTime to prevent frequent refetches
	});

	const { mutate: syncTransactions, isPending: isSyncing, isSuccess: isSyncSuccess, data: syncData } = useSyncTransactions(userId);
	const accounts = useMemo(
		() =>
			banksData?.data?.accounts?.map((account: Account) => ({
				...account,
				id: account.id || account.accountId,
				accountId: account.accountId || account.id,
				name: account.name || account.official_name || "Unknown Bank",
			})) || [],
		[banksData?.data?.accounts]
	);

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
			{/* Date Range Picker */}
			<div className="flex items-center gap-4">
				<Popover>
					<PopoverTrigger asChild>
						<Button variant="outline" className="flex items-center gap-2">
							<CalendarIcon className="h-4 w-4" />
							{format(dateRange.startDate, "MMM d, yyyy")} - {format(dateRange.endDate, "MMM d, yyyy")}
						</Button>
					</PopoverTrigger>
					<PopoverContent className="w-auto p-0" align="start">
						<Calendar
							mode="range"
							selected={{
								from: dateRange.startDate,
								to: dateRange.endDate,
							}}
							onSelect={(range) => {
								if (range?.from && range?.to) {
									setDateRange({
										startDate: range.from,
										endDate: range.to,
									});
								}
							}}
							initialFocus
						/>
					</PopoverContent>
				</Popover>
			</div>
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
				<TaxReportGenerator key={currentYear} year={currentYear} userId={userId} accounts={accounts} transactions={yearTransactions} />
			</div>
		</div>
	);
};

export default TransactionReporting;
