// components/RecentTransactions.tsx
"use client";
import { RecentTransactionsProps } from "@/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import React, { useState } from "react";
import Link from "next/link";
import TransactionsTable from "./TransactionsTable";

const RecentTransactions = ({ accounts, transactions: rawTransactions, page = 1 }: RecentTransactionsProps) => {
	const transactions = Array.isArray(rawTransactions?.transactions) ? rawTransactions.transactions : Array.isArray(rawTransactions) ? rawTransactions : [];
	const [selectedTab, setSelectedTab] = useState(accounts?.[0]?.id?.toString() || "all");

	if (!accounts || accounts.length === 0) {
		return (
			<section className="recent-transactions">
				<header className="flex items-center justify-between mb-4">
					<h2 className="text-xl font-semibold">Recent Transactions</h2>
					<Link href={`/transaction-history/`} className="view-all-btn">
						View All
					</Link>
				</header>
				<p>No accounts available.</p>
			</section>
		);
	}

	const transactionsPerPage = 10;
	const startIndex = (page - 1) * transactionsPerPage;
	const endIndex = startIndex + transactionsPerPage;
	const displayedTransactions = transactions.slice(startIndex, endIndex);

	return (
		<section className="recent-transactions">
			<header className="flex items-center justify-between mb-4">
				<h2 className="text-xl font-semibold">Recent Transactions</h2>
				<Link href={`/transaction-history/`} className="view-all-btn">
					View All
				</Link>
			</header>
			<Tabs value={selectedTab} onValueChange={setSelectedTab}>
				<TabsList aria-label="Accounts">
					<TabsTrigger value="all">All Banks</TabsTrigger>
					{accounts.map((account) => (
						<TabsTrigger key={`tab-${account.id}`} value={account.id.toString()}>
							{account.name}
						</TabsTrigger>
					))}
				</TabsList>

				<TabsContent value="all">
					<div className="p-4">
						<TransactionsTable transactions={displayedTransactions} />
					</div>
				</TabsContent>

				{accounts.map((account) => (
					<TabsContent key={`transactions-${account.id}`} value={account.id.toString()}>
						<div className="p-4">
							<TransactionsTable filterByBank={account.name} transactions={displayedTransactions.filter((tx) => tx.accountId === account.id)} />
						</div>
					</TabsContent>
				))}
			</Tabs>
		</section>
	);
};

export default RecentTransactions;
