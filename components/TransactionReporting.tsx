"use client";
import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import axios from "axios";
import { useSyncTransactions } from "@/app/hooks/useSyncTransactions";
import { usePlaidTransactions } from "@/app/hooks/usePlaidTransactions";

import { Button } from "@/components/ui/button";
import * as Select from "@radix-ui/react-select";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Alert, AlertDescription } from "@/components/ui/alert";
import TransactionsTable from "./TransactionsTable";
import { DateRange } from "react-day-picker";
import _ from "lodash";
import { Transaction } from "@/types";
import { formatAmount } from "@/lib/utils";

interface TransactionReportingProps {
	userId: string;
}

const TransactionReporting = ({ userId }: TransactionReportingProps) => {
	const [selectedBank, setSelectedBank] = useState<string>("all");
	const [dateRange, setDateRange] = useState<DateRange>({
		from: new Date(new Date().setFullYear(new Date().getFullYear() - 2)),
		to: new Date(),
	});

	// Fetch banks with proper error handling
	const { data: banksData } = useQuery({
		queryKey: ["plaidBanks", userId],
		queryFn: async () => {
			const response = await axios.get(`/api/bank/get-accounts?userId=${userId}`, {
				data: userId,
			});
			return response;
		},
	});

	const { mutate: syncTransactions, isPending: isSyncing, isSuccess: isSyncSuccess, data: syncData } = useSyncTransactions(userId);

	const { data: transactionsData, isLoading } = usePlaidTransactions(userId);

	// Process transaction data for reports with null checks
	const processedData = React.useMemo(() => {
		if (!transactionsData?.transactions || !Array.isArray(transactionsData.transactions)) {
			return {
				totalTransactions: 0,
				totalIncome: 0,
				totalExpenses: 0,
			};
		}

		const totalIncome = Math.abs(
			_.sumBy(
				transactionsData.transactions.filter((t: Transaction) => {
					// Type guard to ensure t is a Transaction
					return t && typeof t.amount === "number" && t.amount < 0;
				}),
				"amount"
			)
		);

		const totalExpenses = _.sumBy(
			transactionsData.transactions.filter((t) => {
				return t && typeof t.amount === "number" && t.amount > 0;
			}),
			"amount"
		);

		return {
			totalTransactions: transactionsData.transactions.length,
			totalIncome,
			totalExpenses,
		};
	}, [transactionsData?.transactions]);

	// Early return for loading state
	if (isLoading) {
		return <div className="flex items-center justify-center p-4">Loading transactions...</div>;
	}

	const handleDateRangeChange = (range: DateRange | undefined) => {
		if (range) {
			setDateRange(range);
		}
	};

	const banks = banksData?.data.accounts || [];
	const transactions = transactionsData?.transactions || [];

	return (
		<div className="flex flex-col gap-8">
			{/* Controls */}
			<div className="flex flex-col md:flex-row gap-4 items-center justify-between">
				<Select.Root value={selectedBank} onValueChange={setSelectedBank}>
					<Select.Trigger className="w-[200px] inline-flex items-center justify-between rounded-lg px-4 py-2 text-sm bg-white border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
						<Select.Value placeholder="All Banks" />
					</Select.Trigger>

					<Select.Portal>
						<Select.Content className="overflow-hidden rounded-lg bg-white shadow-lg dark:bg-gray-800 dark:border dark:border-gray-700">
							<Select.ScrollUpButton />
							<Select.Viewport className="p-2">
								<Select.Group>
									<Select.Item
										value="all"
										className="relative flex items-center px-8 py-2 rounded-md text-sm hover:bg-gray-100 dark:hover:bg-gray-700">
										<Select.ItemText>All Banks</Select.ItemText>
									</Select.Item>

									{banks.map((bank: any) => (
										<Select.Item
											key={bank.id}
											value={bank.id}
											className="relative flex items-center px-8 py-2 rounded-md text-sm hover:bg-gray-100 dark:hover:bg-gray-700">
											<Select.ItemText>{bank.name}</Select.ItemText>
										</Select.Item>
									))}
								</Select.Group>
							</Select.Viewport>
							<Select.ScrollDownButton />
						</Select.Content>
					</Select.Portal>
				</Select.Root>

				<DateRangePicker from={dateRange.from} to={dateRange.to} onSelect={handleDateRangeChange} />

				<Button onClick={() => syncTransactions()} disabled={isSyncing} className="plaidlink-primary">
					{isSyncing ? "Syncing..." : "Sync Transactions"}
				</Button>
			</div>

			{isSyncSuccess && (
				<Alert>
					<AlertDescription>Successfully synced transactions from {syncData?.results?.length} banks</AlertDescription>
				</Alert>
			)}

			{/* Summary Cards */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<div className="bank-info">
					<div className="bank-info_content">
						<div>
							<p className="text-14 font-medium text-gray-600 dark:text-gray-400">Total Transactions</p>
							<p className="text-24 font-semibold text-gray-900 dark:text-gray-100">{processedData.totalTransactions}</p>
						</div>
					</div>
				</div>

				<div className="bank-info">
					<div className="bank-info_content">
						<div>
							<p className="text-14 font-medium text-gray-600 dark:text-gray-400">Total Income</p>
							<p className="text-24 font-semibold text-green-600 dark:text-green-400">{formatAmount(processedData.totalIncome)}</p>
						</div>
					</div>
				</div>

				<div className="bank-info">
					<div className="bank-info_content">
						<div>
							<p className="text-14 font-medium text-gray-600 dark:text-gray-400">Total Expenses</p>
							<p className="text-24 font-semibold text-red-600 dark:text-red-400">{formatAmount(processedData.totalExpenses)}</p>
						</div>
					</div>
				</div>
			</div>

			{/* Transactions Table */}
			<div className="rounded-lg overflow-x-auto border border-gray-200 bg-white p-6 dark:bg-gray-800 dark:border-gray-700">
				<h2 className="text-18 font-semibold text-gray-900 dark:text-gray-100 mb-4">Transaction Details</h2>
				<TransactionsTable transactions={transactions} />
			</div>
		</div>
	);
};

export default TransactionReporting;
