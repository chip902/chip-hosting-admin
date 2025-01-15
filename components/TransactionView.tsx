"use client";

import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Account, Transaction } from "@/types";
import { usePlaidTransactions, TransactionsResponse } from "@/app/hooks/usePlaidTransactions";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { formatAmount } from "@/lib/utils";
import { PersonalFinanceCategory } from "plaid";

interface TransactionViewProps {
	accounts: Account[];
	userId?: string;
}

const formatCategory = (category: string | PersonalFinanceCategory): string => {
	if (typeof category === "string") {
		return category;
	}
	return category.primary || "Uncategorized";
};

const TransactionView = ({ accounts, userId }: TransactionViewProps) => {
	const [activeTab, setActiveTab] = useState("all");
	const { data: transactionsData, isLoading } = usePlaidTransactions(userId);

	// Get the transactions array from the response
	const transactions = transactionsData?.transactions || [];

	const exportTransactions = (accountId?: string) => {
		const filteredTransactions = accountId ? transactions.filter((t: Transaction) => t.accountId === accountId) : transactions;

		const csvContent = [
			// CSV Headers
			["Date", "Description", "Category", "Amount", "Account", "Status"].join(","),
			// CSV Rows
			...filteredTransactions.map((t: Transaction) =>
				[
					t.date,
					`"${t.name}"`,
					formatCategory(t.category),
					t.amount,
					accounts.find((a) => a.account_id === t.accountId)?.name || "Unknown Account",
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
		<div className="flex-1">
			<table className="recent-transactions w-full">
				<thead>
					<tr className="border-b">
						<th className="px-4 py-2 text-left">Date</th>
						<th className="px-4 py-2 text-left">Description</th>
						<th className="px-4 py-2 text-left">Category</th>
						<th className="px-4 py-2 text-right">Amount</th>
						<th className="px-4 py-2 text-left">Account</th>
						<th className="px-4 py-2 text-left">Status</th>
					</tr>
				</thead>
				<tbody>
					{filteredTransactions.map((transaction) => {
						const account = accounts.find((a) => a.account_id === transaction.accountId);
						return (
							<tr key={transaction.id} className="border-b hover:bg-gray-50">
								<td className="px-4 py-2 whitespace-nowrap">{new Date(transaction.date).toLocaleDateString()}</td>
								<td className="truncate block items-center px-4 py-2">{transaction.name}</td>
								<td className="px-4 py-2">
									<span className="px-2 py-1 rounded-full bg-gray-100 text-sm">{formatCategory(transaction.category)}</span>
								</td>
								<td className={`px-4 py-2 text-right ${transaction.amount < 0 ? "text-red-600" : "text-green-600"}`}>
									{formatAmount(Math.abs(transaction.amount))}
								</td>
								<td className="px-4 py-2">{account?.name || "Unknown Account"}</td>
								<td className="px-4 py-2">
									<span
										className={`px-2 py-1 rounded-full text-sm ${
											transaction.pending ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"
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

	if (isLoading) {
		return <div>Loading transactions...</div>;
	}

	return (
		<Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
			<div className="flex justify-between items-center mb-4">
				<TabsList>
					<TabsTrigger value="all">All Accounts</TabsTrigger>
					{accounts.map((account) => (
						<TabsTrigger key={account.id} value={account.id}>
							{account.name}
						</TabsTrigger>
					))}
				</TabsList>
				<Button variant="outline" onClick={() => exportTransactions(activeTab !== "all" ? activeTab : undefined)}>
					<Download className="mr-2 h-4 w-4" />
					Export CSV
				</Button>
			</div>

			<TabsContent value="all">{renderTransactionTable(transactions)}</TabsContent>

			{accounts.map((account) => (
				<TabsContent key={account.id} value={account.id}>
					{renderTransactionTable(transactions.filter((t: Transaction) => t.accountId === account.account_id))}
				</TabsContent>
			))}
		</Tabs>
	);
};

export default TransactionView;
