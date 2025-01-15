// components/RecentTransactions.tsx
import { Account, RecentTransactionsProps, Transaction } from "@/types";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import React from "react";
import Link from "next/link";
import TransactionsTable from "./TransactionsTable";
import { BankTabItem } from "./BankTabItem";

const RecentTransactions = ({ accounts, transactions: rawTransactions, page = 1 }: RecentTransactionsProps) => {
	const transactions = Array.isArray(rawTransactions?.transactions) ? rawTransactions.transactions : [];

	const transactionsPerPage = 10;
	const startIndex = (page - 1) * transactionsPerPage;
	const endIndex = startIndex + transactionsPerPage;
	const displayedTransactions = transactions.slice(startIndex, endIndex);

	if (!accounts || accounts.length === 0) {
		return (
			<section className="recent-transactions">
				<header className="flex items-center justify-between mb-4">
					<h2 className="text-xl font-semibold">Recent Transactions</h2>
					<Link className="view-all-btn" href={`/transaction-history/`}>
						View All
					</Link>
				</header>
				<p>No accounts available.</p>
			</section>
		);
	}

	return (
		<section className="recent-transactions">
			<header className="flex items-center justify-between mb-4">
				<h2 className="text-xl font-semibold">Recent Transactions</h2>
				<Link className="view-all-btn" href={`/transaction-history/`}>
					View All
				</Link>
			</header>
			<Tabs defaultValue={accounts[0].name} className="w-full">
				<TabsList className="recent-transactions-tablist">
					{accounts.map((account: Account) => (
						<TabsTrigger key={account.id} value={account.name}>
							<BankTabItem account={account} />
						</TabsTrigger>
					))}
				</TabsList>
			</Tabs>
			{accounts.map((account) => {
				const accountTransactions = displayedTransactions.filter((transaction: Transaction) => transaction && transaction.accountId === account.id);

				return (
					<div key={account.id} className="mb-4">
						<h3 className="text-xl font-semibold mb-2">{account.name}</h3>
						<TransactionsTable transactions={accountTransactions} />
					</div>
				);
			})}
		</section>
	);
};

export default RecentTransactions;
