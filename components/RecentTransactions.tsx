import { Account, CategoryBadgeProps, RecentTransactionsProps, Transaction } from "@/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import React from "react";
import { format } from "date-fns";
import Link from "next/link";
import TransactionsTable from "./TransactionsTable";
import BankInfo from "./BankInfo";
import { cn } from "@/lib/utils";
import { BankTabItem } from "./BankTabItem";

const RecentTransactions = ({ accounts, transactions, page = 1 }: RecentTransactionsProps) => {
	const transactionsPerPage = 10;
	const startIndex = (page - 1) * transactionsPerPage;
	const endIndex = startIndex + transactionsPerPage;
	const displayedTransactions = transactions.slice(startIndex, endIndex);

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
				const filteredTransactions = displayedTransactions.filter((transaction) => transaction.accountId === account.id);

				return (
					<div key={account.id} className="mb-4">
						<h3 className="text-xl font-semibold mb-2">{account.name}</h3>
						<TransactionsTable transactions={filteredTransactions} />
					</div>
				);
			})}
		</section>
	);
};

export default RecentTransactions;
