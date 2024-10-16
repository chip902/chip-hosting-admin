import { RecentTransactionsProps, Transaction } from "@/types";
import React from "react";
import { format } from "date-fns";

const RecentTransactions = ({ accounts, transactions, page = 1 }: RecentTransactionsProps) => {
	const transactionsPerPage = 10;
	const startIndex = (page - 1) * transactionsPerPage;
	const endIndex = startIndex + transactionsPerPage;
	const displayedTransactions = transactions.slice(startIndex, endIndex);

	const getAccountName = (accountId: string) => {
		const account = accounts.find((acc) => acc.id === accountId);
		return account ? account.name : "Unknown Account";
	};

	return (
		<section className="recent-transactions">
			<header className="flex items-center justify-between mb-4">
				<h2 className="text-xl font-semibold">Recent Transactions</h2>
			</header>
			<div className="overflow-x-auto">
				<table className="min-w-full bg-white">
					<thead className="bg-gray-100">
						<tr>
							<th className="py-2 px-4 text-left">Date</th>
							<th className="py-2 px-4 text-left">Description</th>
							<th className="py-2 px-4 text-left">Account</th>
							<th className="py-2 px-4 text-right">Amount</th>
						</tr>
					</thead>
					<tbody>
						{displayedTransactions.map((transaction: Transaction) => (
							<tr key={transaction.id} className="border-b">
								<td className="py-2 px-4">{format(new Date(transaction.date), "MMM d, yyyy")}</td>
								<td className="py-2 px-4">{transaction.name}</td>
								<td className="py-2 px-4">{getAccountName(transaction.accountId)}</td>
								<td className={`py-2 px-4 text-right ${transaction.amount < 0 ? "text-red-500" : "text-green-500"}`}>
									${Math.abs(transaction.amount).toFixed(2)}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</section>
	);
};

export default RecentTransactions;
