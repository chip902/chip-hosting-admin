import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { Account, Transaction } from "@/types";
import * as XLSX from "xlsx";
import { formatAmount } from "@/lib/utils";
import { PersonalFinanceCategory } from "plaid";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";

interface ExpenseRow {
	Date: string;
	"Check #"?: string;
	Payee?: string;
	Amount: number;
	"Office Expense"?: string | number | undefined | undefined;
	"Telephone Expense"?: string | number | undefined;
	Personal?: string | number | undefined;
	Accounting?: string | number | undefined;
	"Bank Charge"?: string | number | undefined;
	Ads?: string | number | undefined;
	Insurance?: string | number | undefined;
	"Medical Exp"?: string | number | undefined;
	Utilities?: string | number | undefined;
	MISC?: string | number | undefined;
	Description: string;
}

interface DepositRow {
	Date: string;
	Source: string;
	Amount: number;
	"W-2 Income": string | number | undefined;
	"Self Employed Income": string | number | undefined;
	"Personal funds": string | number | undefined;
}

interface TaxReportAccumulator {
	expenses: ExpenseRow[];
	deposits: DepositRow[];
}

interface TaxReportGeneratorProps {
	year: number;
	userId: string;
	accounts: Account[];
	transactions: Transaction[];
}

const getCategory = (category: string | PersonalFinanceCategory): string => {
	if (typeof category === "string") {
		return category;
	}
	return category.primary;
};

const mapExpenseCategory = (transaction: Transaction): Partial<ExpenseRow> => {
	const category = getCategory(transaction.category);
	// Don't need to use Math.abs here since we're already handling signs properly
	const amount = transaction.amount;

	const mapping: Partial<ExpenseRow> = {
		"Office Expense": "",
		"Telephone Expense": "",
		Personal: "",
		Accounting: "",
		"Bank Charge": "",
		Ads: "",
		Insurance: "",
		"Medical Exp": "",
		Utilities: "",
		MISC: "",
	};

	// Updated categories to match Plaid's personal finance categories
	switch (category) {
		case "UTILITIES":
			mapping.Utilities = amount;
			break;
		case "INSURANCE":
			mapping.Insurance = amount;
			break;
		case "ADVERTISING":
		case "MARKETING":
			mapping.Ads = amount;
			break;
		case "BANK_FEES":
		case "FINANCE_CHARGE":
			mapping["Bank Charge"] = amount;
			break;
		case "MEDICAL":
		case "HEALTHCARE":
			mapping["Medical Exp"] = amount;
			break;
		case "OFFICE_SUPPLIES":
		case "OFFICE_EXPENSE":
			mapping["Office Expense"] = amount;
			break;
		case "TELECOMMUNICATIONS":
		case "PHONE":
			mapping["Telephone Expense"] = amount;
			break;
		case "PERSONAL":
			mapping.Personal = amount;
			break;
		case "PROFESSIONAL_SERVICES":
			mapping.Accounting = amount;
			break;
		default:
			mapping.MISC = amount;
	}

	return mapping;
};

const TaxReportGenerator: React.FC<TaxReportGeneratorProps> = ({ year, userId, accounts, transactions }) => {
	// Use useState instead of useRef or useMemo for the date range
	const [dateRange] = useState({
		startDate: new Date(`${year}-01-01`),
		endDate: new Date(`${year}-12-31`),
	});

	// Add selected banks state
	const [selectedBanks, setSelectedBanks] = useState<string[]>([]);
	const isQueryEnabled = useMemo(() => {
		return selectedBanks.length > 0;
	}, [selectedBanks]);

	const { data: fiscalYearData, isLoading } = useQuery<{ transactions: Transaction[] }>({
		queryKey: ["fiscal-year-transactions", userId, year, selectedBanks],
		queryFn: async () => {
			const response = await axios.get<{ transactions: Transaction[] }>("/api/transactions/get-transactions", {
				params: {
					userId,
					startDate: dateRange.startDate.toISOString().split("T")[0],
					endDate: dateRange.endDate.toISOString().split("T")[0],
					bankIds: selectedBanks.join(","),
				},
			});
			return response.data;
		},
		enabled: isQueryEnabled, // Only run query when banks are selected
		refetchOnWindowFocus: false,
		refetchOnMount: false,
		staleTime: Infinity,
	});

	const fiscalYearTransactions = fiscalYearData?.transactions || [];

	const filteredTransactions = useMemo(() => {
		if (selectedBanks.length === 0) return [];
		return transactions.filter((tx) => selectedBanks.includes(tx.accountId));
	}, [transactions, selectedBanks]);

	// Use filtered transactions for calculations
	const { expenses, deposits } = useMemo(() => {
		return filteredTransactions.reduce<TaxReportAccumulator>(
			(acc: TaxReportAccumulator, transaction: Transaction) => {
				const transactionDate = new Date(transaction.date);
				const transactionYear = transactionDate.getFullYear();

				if (transactionYear === year) {
					if (transaction.amount < 0) {
						const expenseCategories = mapExpenseCategory(transaction);
						acc.expenses.push({
							Date: transactionDate.toLocaleDateString(),
							"Check #": transaction.paymentChannel === "check" ? "" : "",
							Payee: transaction.name,
							Amount: Math.abs(transaction.amount),
							...expenseCategories,
							Description: transaction.name,
						});
					} else {
						acc.deposits.push({
							Date: transactionDate.toLocaleDateString(),
							Source: transaction.name,
							Amount: transaction.amount,
							"W-2 Income": transaction.category === "INCOME" && transaction.name.toLowerCase().includes("payroll") ? transaction.amount : "",
							"Self Employed Income":
								transaction.category === "INCOME" && !transaction.name.toLowerCase().includes("payroll") ? transaction.amount : "",
							"Personal funds": transaction.category === "TRANSFER_IN" ? transaction.amount : "",
						});
					}
				}
				return acc;
			},
			{ expenses: [], deposits: [] }
		);
	}, [fiscalYearTransactions, year]);

	const generateExcel = () => {
		const wb = XLSX.utils.book_new();

		// Create Expenses worksheet
		const wsExpenses = XLSX.utils.json_to_sheet(expenses);
		XLSX.utils.book_append_sheet(wb, wsExpenses, "Expenses");

		// Create Deposits worksheet
		const wsDeposits = XLSX.utils.json_to_sheet(deposits);
		XLSX.utils.book_append_sheet(wb, wsDeposits, "Deposits");

		// Save the file
		XLSX.writeFile(wb, `tax_report_${year}.xlsx`);
	};

	return (
		<div className="space-y-4">
			{/* Bank Selection */}
			<div className="p-4 border rounded-lg">
				<h3 className="text-lg font-medium mb-2">Select Banks for Tax Report</h3>
				<div className="flex flex-wrap gap-2">
					{accounts.map((account: Account) => (
						<label key={account.accountId} className="flex items-center space-x-2">
							<input
								type="checkbox"
								checked={selectedBanks.includes(account.accountId)}
								onChange={(e) => {
									if (e.target.checked) {
										setSelectedBanks([...selectedBanks, account.accountId]);
									} else {
										setSelectedBanks(selectedBanks.filter((id) => id !== account.accountId));
									}
								}}
								className="rounded border-gray-300"
							/>
							<span>{account.name}</span>
						</label>
					))}
				</div>
			</div>

			{/* Rest of your existing JSX */}
			<div className="flex justify-between items-center">
				<h2 className="text-xl font-semibold">Tax Report Generator ({year})</h2>
				<Button onClick={generateExcel} className="flex items-center gap-2">
					<Download className="h-4 w-4" />
					Export Tax Report
				</Button>
			</div>

			<div className="grid grid-cols-2 gap-4">
				<div className="p-4 border rounded-lg">
					<h3 className="text-lg font-medium mb-2">Expenses Summary</h3>
					<p>Total Records: {expenses.length}</p>
					<p>Total Amount: {formatAmount(expenses.reduce((sum: number, exp: ExpenseRow) => sum + exp.Amount, 0))}</p>
				</div>

				<div className="p-4 border rounded-lg">
					<h3 className="text-lg font-medium mb-2">Deposits Summary</h3>
					<p>Total Records: {deposits.length}</p>
					<p>Total Amount: {formatAmount(deposits.reduce((sum: number, dep: DepositRow) => sum + dep.Amount, 0))}</p>
				</div>
			</div>
		</div>
	);
};

export default TaxReportGenerator;
