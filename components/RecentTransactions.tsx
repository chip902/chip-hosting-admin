// components/RecentTransactions.tsx
"use client";
import { RecentTransactionsProps } from "@/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import TransactionsTable from "./TransactionsTable";
import { Transaction } from "@prisma/client";

const RecentTransactions = ({ accounts, userId, startDate, endDate }: RecentTransactionsProps) => {
	const [page, setPage] = useState(1);
	const [transactions, setTransactions] = useState([]);
	const [selectedTab, setSelectedTab] = useState(accounts?.[0]?.id?.toString() || "all");

	useEffect(() => {
		fetchTransactions(startDate, endDate, page);
	}, [startDate, endDate, page]);

	const transactionsPerPage = 10;
	const startIndex = (page - 1) * transactionsPerPage;
	const endIndex = startIndex + transactionsPerPage;
	const displayedTransactions = transactions.slice(startIndex, endIndex);

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

	const fetchTransactions = async (startDate: string, endDate: string, page: number) => {
		try {
			const response = await fetch(`/api/transactions/get-transactions?userId=${userId}&startDate=${startDate}&endDate=${endDate}&page=${page}`);
			if (!response.ok) {
				throw new Error("Failed to fetch transactions");
			}
			const data = await response.json();
			setTransactions(data.transactions);
		} catch (error) {
			console.error("Error fetching transactions:", error);
		}
	};

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
							<TransactionsTable
								filterByBank={account.name}
								transactions={displayedTransactions.filter((tx: Transaction) => tx.accountId === account.id)}
							/>
						</div>
					</TabsContent>
				))}
			</Tabs>

			<div style={{ display: "flex", justifyContent: "center", marginTop: "20px" }}>
				<button
					onClick={() => setPage(page > 1 ? page - 1 : 1)}
					disabled={page === 1}
					className="bg-blue-500 text-white px-4 py-2 rounded mr-2 cursor-pointer">
					Previous
				</button>
				<div className="inline-block px-10">
					<span className="text-gray-700 dark:text-white">Page {page}</span>
				</div>
				<button
					onClick={() => setPage(page + 1)}
					disabled={startIndex + transactionsPerPage >= transactions.length}
					className="bg-blue-500 text-white px-4 py-2 rounded ml-2 cursor-pointer">
					Next
				</button>
			</div>
		</section>
	);
};

export default RecentTransactions;
