import React, { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { Transaction } from "@/types";
import * as XLSX from "xlsx";
import { formatAmount } from "@/lib/utils";
import { PersonalFinanceCategory } from "plaid";

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
	transactions: Transaction[];
	year: number;
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

const TaxReportGenerator: React.FC<TaxReportGeneratorProps> = ({ transactions, year }) => {
	// Add transaction date debugging
	console.log("Transaction dates:", {
		year,
		transactionYears: transactions.map((t) => new Date(t.date).getFullYear()),
		dateRange: {
			start: `${year}-01-01`,
			end: `${year}-12-31`,
		},
		sampleDates: transactions.slice(0, 3).map((t) => ({
			original: t.date,
			parsed: new Date(t.date).toISOString(),
			year: new Date(t.date).getFullYear(),
		})),
	});

	const { expenses, deposits } = useMemo(() => {
		const startDate = new Date(`${year}-01-01T00:00:00.000Z`);
		const endDate = new Date(`${year}-12-31T23:59:59.999Z`);

		return transactions.reduce<TaxReportAccumulator>(
			(acc, transaction) => {
				const transactionDate = new Date(transaction.date);
				const transactionYear = transactionDate.getFullYear();

				// Debug each transaction's date comparison
				console.log("Transaction date check:", {
					date: transaction.date,
					year: transactionYear,
					targetYear: year,
					amount: transaction.amount,
					isInYear: transactionYear === year,
				});

				if (transactionYear === year) {
					// Simplified year check
					if (transaction.amount < 0) {
						const expenseCategories = mapExpenseCategory(transaction);
						acc.expenses.push({
							Date: transactionDate.toLocaleDateString(),
							"Check #": transaction.paymentChannel === "check" ? (transaction as any).checkNumber || "" : "",
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
	}, [transactions, year]);

	// Debug the final results
	console.log("Tax Report Results:", {
		year,
		totalTransactions: transactions.length,
		filteredExpenses: expenses.length,
		filteredDeposits: deposits.length,
		expensesTotal: expenses.reduce((sum, exp) => sum + exp.Amount, 0),
		depositsTotal: deposits.reduce((sum, dep) => sum + dep.Amount, 0),
		sampleExpense: expenses[0],
		sampleDeposit: deposits[0],
	});

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
					<p>Total Amount: {formatAmount(expenses.reduce((sum, exp) => sum + exp.Amount, 0))}</p>
				</div>

				<div className="p-4 border rounded-lg">
					<h3 className="text-lg font-medium mb-2">Deposits Summary</h3>
					<p>Total Records: {deposits.length}</p>
					<p>Total Amount: {formatAmount(deposits.reduce((sum, dep) => sum + dep.Amount, 0))}</p>
				</div>
			</div>
		</div>
	);
};

export default TaxReportGenerator;
