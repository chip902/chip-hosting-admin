"use client";
import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import axios from "axios";
import { Button } from "@/components/ui/button";
import * as Select from "@radix-ui/react-select";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Alert, AlertDescription } from "@/components/ui/alert";
import TransactionsTable from "./TransactionsTable";
import _ from "lodash";
import { DateRange } from "react-day-picker";

interface Transaction {
	id: string;
	amount: number;
	date: string;
	name: string;
	category: string;
	paymentChannel: string;
}

interface TransactionReportingProps {
	userId: string;
}

const TransactionReporting = ({ userId }: TransactionReportingProps) => {
	const [selectedBank, setSelectedBank] = useState<string>("all");
	const [dateRange, setDateRange] = useState<DateRange>({
		from: new Date(new Date().setFullYear(new Date().getFullYear() - 2)),
		to: new Date(),
	});

	// Fetch banks
	const { data: banks } = useQuery({
		queryKey: ["plaidBanks", userId],
		queryFn: async () => {
			const response = await axios.get(`/api/bank/get-accounts?userId=${userId}`);
			return response.data;
		},
	});

	// Sync mutation
	const syncMutation = useMutation({
		mutationFn: async () => {
			const response = await axios.post("/api/transactions/sync", { userId });
			return response.data;
		},
	});

	// Fetch transactions
	const { data: transactions, isLoading } = useQuery({
		queryKey: ["transactions", userId, selectedBank, dateRange],
		queryFn: async () => {
			const response = await axios.get("/api/transactions/get-transactions", {
				params: {
					userId,
					bankId: selectedBank !== "all" ? selectedBank : undefined,
					startDate: dateRange.from?.toISOString(),
					endDate: dateRange.to?.toISOString(),
				},
			});
			return response.data;
		},
	});

	// Process transaction data for reports
	const processedData = React.useMemo(() => {
		if (!transactions) return null;

		const totalIncome = Math.abs(
			_.sumBy(
				transactions.filter((t: Transaction) => t.amount < 0),
				"amount"
			)
		);
		const totalExpenses = _.sumBy(
			transactions.filter((t: Transaction) => t.amount > 0),
			"amount"
		);

		return {
			totalTransactions: transactions.length,
			totalIncome,
			totalExpenses,
		};
	}, [transactions]);

	const handleDateRangeChange = (range: DateRange | undefined) => {
		if (range) {
			setDateRange(range);
		}
	};

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

									{banks?.accounts?.map((bank: any) => (
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

				<Button onClick={() => syncMutation.mutate()} disabled={syncMutation.isPending} className="plaidlink-primary">
					{syncMutation.isPending ? "Syncing..." : "Sync Transactions"}
				</Button>
			</div>

			{syncMutation.isSuccess && (
				<Alert>
					<AlertDescription>Successfully synced transactions from {syncMutation.data.results.length} banks</AlertDescription>
				</Alert>
			)}

			{/* Summary Cards */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<div className="bank-info">
					<div className="bank-info_content">
						<div>
							<p className="text-14 font-medium text-gray-600 dark:text-gray-400">Total Transactions</p>
							<p className="text-24 font-semibold text-gray-900 dark:text-gray-100">{processedData?.totalTransactions || 0}</p>
						</div>
					</div>
				</div>

				<div className="bank-info">
					<div className="bank-info_content">
						<div>
							<p className="text-14 font-medium text-gray-600 dark:text-gray-400">Total Income</p>
							<p className="text-24 font-semibold text-green-600 dark:text-green-400">${processedData?.totalIncome.toFixed(2) || "0.00"}</p>
						</div>
					</div>
				</div>

				<div className="bank-info">
					<div className="bank-info_content">
						<div>
							<p className="text-14 font-medium text-gray-600 dark:text-gray-400">Total Expenses</p>
							<p className="text-24 font-semibold text-red-600 dark:text-red-400">${processedData?.totalExpenses.toFixed(2) || "0.00"}</p>
						</div>
					</div>
				</div>
			</div>

			{/* Transactions Table */}
			{transactions && (
				<div className="rounded-lg border border-gray-200 bg-white p-6 dark:bg-gray-800 dark:border-gray-700">
					<h2 className="text-18 font-semibold text-gray-900 dark:text-gray-100 mb-4">Transaction Details</h2>
					<TransactionsTable transactions={transactions} />
				</div>
			)}
		</div>
	);
};

export default TransactionReporting;
