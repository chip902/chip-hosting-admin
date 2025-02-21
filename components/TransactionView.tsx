"use client";
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Account, Transaction } from "@/types";
import { usePlaidTransactions } from "@/app/hooks/usePlaidTransactions";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { formatAmount } from "@/lib/utils";
import { PersonalFinanceCategory } from "plaid";

interface TransactionViewProps {
	accounts: Account[];
	userId?: string;
}

// Simplified since category is now just a string in your payload
const formatCategory = (category: string | PersonalFinanceCategory | undefined): string => {
	if (!category) return "Uncategorized";
	if (typeof category === "string") {
		return category;
	}
	return category.primary || "Uncategorized";
};

const TransactionView = ({ accounts, userId }: TransactionViewProps) => {
	const [activeTab, setActiveTab] = useState("all");
	const { transactions, isLoading, error } = usePlaidTransactions(userId || "");

	if (!userId) {
		return <div>You are not authorized to view transactions.</div>;
	}

	const exportTransactions = (accountId?: string) => {
		const filteredTransactions = accountId ? transactions.filter((t) => t.accountId === accountId) : transactions;

		const csvContent = [
			["Date", "Description", "Category", "Amount", "Account", "Status"].join(","),
			...filteredTransactions.map((t) =>
				[
					t.date,
					`"${t.name}"`,
					formatCategory(t.category),
					t.amount,
					accounts.find((a) => a.accountId === t.accountId)?.name || "Unknown Account",
					t.pending ? "Pending" : "Completed",
				].join(",")
			),
		].join("\n");

		const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
		const link = document.createElement("a");
		link.href = URL.createObjectURL(blob);
		link.download = `transactions${accountId ? `-${accountId}` : ""}-${new Date().toISOString().split("T")[0]}.csv`;
		link.click();
	};

	const renderTransactionTable = (filteredTransactions: Transaction[]) => (
		<div className="w-full overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
			<table className="w-full min-w-full table-auto">
				{/* ... existing thead remains the same ... */}
				<tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
					{filteredTransactions.map((transaction) => {
						const account = accounts.find((a) => a.accountId === transaction.accountId);
						return (
							<tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
								<td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
									{new Date(transaction.date).toLocaleDateString()}
								</td>
								<td className="max-w-md px-6 py-4">
									<div className="text-sm text-gray-900 dark:text-gray-100 truncate">{transaction.name}</div>
								</td>
								<td className="whitespace-nowrap px-6 py-4">
									<span className="inline-flex rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-800 dark:bg-gray-700 dark:text-gray-200">
										{formatCategory(transaction.category)}
									</span>
								</td>
								<td
									className={`whitespace-nowrap px-6 py-4 text-right text-sm font-medium ${
										transaction.amount < 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"
									}`}>
									{formatAmount(Math.abs(transaction.amount))}
								</td>
								<td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-gray-100">{account?.name || "Unknown Account"}</td>
								<td className="whitespace-nowrap px-6 py-4">
									<span
										className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
											transaction.pending
												? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
												: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
										}`}>
										{transaction.pending ? "Pending" : "Completed"}
									</span>
								</td>
							</tr>
						);
					})}
				</tbody>
			</table>
		</div>
	);

	// ... rest of the component remains the same ...

	return (
		<Tabs defaultValue="all" className="w-full space-y-6" onValueChange={setActiveTab}>
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
				<TabsList className="w-full sm:w-auto overflow-x-auto">
					<TabsTrigger value="all">All Accounts</TabsTrigger>
					{accounts.map((account) => (
						<TabsTrigger key={account.id} value={account.id}>
							{account.name}
						</TabsTrigger>
					))}
				</TabsList>
				<Button variant="outline" onClick={() => exportTransactions(activeTab !== "all" ? activeTab : undefined)} className="w-full sm:w-auto">
					<Download className="mr-2 h-4 w-4" />
					Export CSV
				</Button>
			</div>

			<TabsContent value="all">{renderTransactionTable(transactions)}</TabsContent>

			{accounts.map((account) => (
				<TabsContent key={account.id} value={account.id}>
					{renderTransactionTable(transactions.filter((t) => t.accountId === account.accountId))}
				</TabsContent>
			))}
		</Tabs>
	);
};

export default TransactionView;
