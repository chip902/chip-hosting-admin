import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CategoryBadgeProps, Transaction, TransactionTableProps } from "@/types";
import { cn, formatAmount, formatDateTime, getTransactionStatus, removeSpecialCharacters } from "@/lib/utils";
import { transactionCategoryStyles } from "@/constants";

const CategoryBadge = ({ category }: CategoryBadgeProps) => {
	const { borderColor, backgroundColor, textColor, chipBackgroundColor } =
		transactionCategoryStyles[category as keyof typeof transactionCategoryStyles] || transactionCategoryStyles.default;
	return (
		<div className={cn("category-badge", borderColor, chipBackgroundColor)}>
			<div className={cn("size-2 rounded-full", backgroundColor)} />
			<p className={cn("text-[12px] font-medium", textColor)}>{category}</p>
		</div>
	);
};

const TransactionsTable = ({ transactions, filterByBank }: TransactionTableProps) => {
	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead className="px-2">Transaction</TableHead>
					<TableHead className="px-2">Amount</TableHead>
					<TableHead className="px-2">Status</TableHead>
					<TableHead className="px-2">Date</TableHead>
					<TableHead className="px-2 max-md:hidden">Channel</TableHead>
					<TableHead className="px-2 max-md:hidden">Category</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{transactions.map((t: Transaction) => {
					const status = getTransactionStatus(new Date(t.date));
					const amount = formatAmount(t.amount);
					const isDebit = t.type === "debit";
					const isCredit = t.type === "credit";
					return (
						<TableRow
							key={t.id}
							className={`${isDebit || amount[0] === "-" ? "text-orange-600" : "text-green-600"} !over:bg-none !border-b-DEFAULT`}>
							<TableCell>
								<div className="flex items-center gap-3">
									<h1 className={`text-14 truncate font-semibold ${isDebit || amount[0] === "-" ? "text-orange-600" : "text-green-600"} `}>
										{removeSpecialCharacters(t.name)}
									</h1>
								</div>
							</TableCell>
							<TableCell className={`text-14 truncate font-semibold ${isDebit || amount[0] === "-" ? "text-orange-600" : "text-green-600"} `}>
								<div>
									<h1>{isDebit ? `-${amount}` : isCredit ? `+${amount}` : amount}</h1>
								</div>
							</TableCell>
							<TableCell className="pl-2 pr-10">
								<CategoryBadge category={status} />
							</TableCell>
							<TableCell className="min-w-32 pl-2 pr-10">
								<div>
									<h1>{formatDateTime(new Date(t.date)).dateTime}</h1>
								</div>
							</TableCell>
							<TableCell className="capitalize pl-2 pr-10 min-w-24">
								<div>
									<h1>{t.paymentChannel}</h1>
								</div>
							</TableCell>
							<TableCell className="pl-2 pr-10 max-md:hidden">
								<div>
									<CategoryBadge category={typeof t.category === "string" ? t.category : t.category.primary} />
								</div>
							</TableCell>
						</TableRow>
					);
				})}
			</TableBody>
		</Table>
	);
};

export default TransactionsTable;
