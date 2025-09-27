"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useSyncTransactions } from "@/app/hooks/useSyncTransactions";
import { usePlaidTransactions } from "@/app/hooks/usePlaidTransactions";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import TransactionsTable from "./TransactionsTable";
import _ from "lodash";
import { Account } from "@/types";
import TaxReportGenerator from "./TaxReportGenerator";
import { Alert, AlertDescription } from "./ui/alert";
import { DateRangePicker } from "./ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { format, startOfYear, endOfYear } from "date-fns";

interface TransactionReportingProps {
	userId: string;
	range?: {
		startDate: Date | undefined;
		endDate: Date | undefined;
	};
}

const TransactionReporting = ({ userId }: TransactionReportingProps) => {
	// Initialize with current year (Jan 1 to today for YTD view)
	const currentYear = new Date().getFullYear();
	const [dateRange, setDateRange] = useState<DateRange>({
		from: startOfYear(new Date()),
		to: new Date(), // Today's date for YTD view
	});
	const [selectedTab, setSelectedTab] = useState<string>("all");

	const { mutate: syncTransactions, isPending: isSyncing, isSuccess: isSyncSuccess, data: syncData } = useSyncTransactions(userId);

	useEffect(() => {
		if (userId) {
			syncTransactions();
		}
	}, [userId]);

	// Memoize the accounts query
	const { data: banksData } = useQuery({
		queryKey: ["plaidBanks", userId],
		queryFn: async () => {
			const response = await axios.get(`/api/bank/get-accounts?userId=${userId}`);
			return response;
		},
		staleTime: 30000,
	});

	// Single source of truth for transactions - use dateRange from state
	const { transactions, isLoading, error } = usePlaidTransactions(userId, {
		startDate: dateRange.from,
		endDate: dateRange.to,
	});

	// Debug logging
	useEffect(() => {
		console.log("TransactionReporting Debug:", {
			userId,
			dateRange,
			transactionsCount: transactions?.length || 0,
			isLoading,
			error: error?.message,
			banksDataLength: banksData?.data?.accounts?.length || 0,
		});
	}, [userId, dateRange, transactions, isLoading, error, banksData]);

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
		return transactions.filter((tx) => tx.accountId === accountId);
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
			<div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
				{/* Date Range Picker */}
				<div className="flex flex-col gap-2">
					<label className="text-sm font-medium text-gray-700 dark:text-gray-300">Date Range (for Year-to-Date deposits, select Jan 1 - today)</label>
					<DateRangePicker
						from={dateRange.from}
						to={dateRange.to}
						onSelect={(range) => {
							if (range) {
								setDateRange(range);
							}
						}}
						className="w-auto"
					/>
				</div>

				{/* Quick Date Buttons */}
				<div className="flex gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => {
							const now = new Date();
							setDateRange({
								from: startOfYear(now),
								to: now,
							});
						}}>
						Year to Date
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={() => {
							const now = new Date();
							setDateRange({
								from: startOfYear(now),
								to: endOfYear(now),
							});
						}}>
						Full Year
					</Button>
				</div>
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
				<Tabs value="all" onValueChange={setSelectedTab}>
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
							{transactions && transactions.length > 0 ? (
								<TransactionsTable transactions={transactions} />
							) : (
								<div className="text-center py-8 text-gray-500">
									{isLoading ? (
										"Loading transactions..."
									) : error ? (
										<div>
											<p>Error loading transactions: {error.message}</p>
											<p className="text-sm mt-2">Check console for more details</p>
										</div>
									) : (
										<div>
											<p>No transactions found for the selected date range.</p>
											<p className="text-sm mt-2">Try adjusting your date range or make sure you have connected bank accounts.</p>
											<p className="text-sm mt-1">
												Accounts found: {accounts.length} | Date range: {dateRange.from?.toLocaleDateString()} -{" "}
												{dateRange.to?.toLocaleDateString()}
											</p>
										</div>
									)}
								</div>
							)}
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
				<TaxReportGenerator key={currentYear} year={currentYear} userId={userId} accounts={accounts} />
			</div>
		</div>
	);
};

export default TransactionReporting;
