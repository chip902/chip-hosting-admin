// components/TaxReportGenerator.tsx
"use client";
import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { Account, Transaction } from "@/types";
import * as XLSX from "xlsx";
import { formatAmount } from "@/lib/utils";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";

//
// 1) Type declarations
//

/**
 * ExpenseRow can have standard fields like Date, Payee, etc.
 * but also any other string key for categories (e.g. "Meals/Entertainment").
 * The values can be string (for "Check #") or number (for amounts).
 */
interface ExpenseRow {
	Date: string;
	"Check #"?: string | undefined;
	Payee: string;
	Amount: number;
	"Office Expense"?: string | number | undefined;
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
	[key: string]: string | number | undefined;
}

interface DepositRow {
	Date: string;
	Source: string;
	Amount: number;
	"W-2 Income": string | number;
	"Self Employed Income": string | number;
	"Personal funds": string | number;
}

interface TaxReportAccumulator {
	expenses: ExpenseRow[];
	deposits: DepositRow[];
}

interface TaxReportGeneratorProps {
	year: number;
	userId: string;
	accounts: Account[];
}

//
// 2) Simple mapping from personal_finance_category.primary -> your business category
//
function mapPfcToBusinessCategory(primaryCat: string | undefined, transactionName: string): string {
	// If we have no category, try to determine it from the transaction name
	const name = transactionName.toUpperCase();

	console.log("Attempting to categorize transaction:", {
		originalName: transactionName,
		normalizedName: name,
		originalCategory: primaryCat,
	});

	// Check transaction name patterns
	if (name.includes("VERIZON")) {
		return "Telephone Expense";
	}
	if (name.includes("OPTIMUM") || name.includes("NYSEG")) {
		return "Utilities";
	}
	if (name.includes("AMERICAN EXPRESS") || name.includes("WIRE FEE")) {
		return "Bank Charge";
	}
	if (name.includes("TRANSFER") || name.includes("FID BKG SVC")) {
		return "Transfer / Owner Draw";
	}
	if (name.includes("NYS DTF") || name.includes("IRS") || name.includes("TAX")) {
		return "Accounting";
	}
	if (name.includes("SERVICE FEE")) {
		return "Bank Charge";
	}
	if (name.includes("SMASHBALLOON") || name.includes("ELEMENTOR")) {
		return "Office Expense";
	}
	if (name.includes("DOMESTIC INCOMING")) {
		return "Personal funds";
	}

	// If no pattern matches, log it and return MISC
	console.log("No category match found for transaction:", transactionName);
	return "MISC";
}

function cleanupTransactionName(name: string): string {
	// Remove common prefixes
	let cleaned = name.replace(/ORIG CO NAME:|DESC DATE:|CO ENTRY DESCR:|SEC:|TRACE#:|EED:|IND ID:|IND NAME:|TRN:|\s+TC$/g, "");

	// Remove transaction numbers and references
	cleaned = cleaned.replace(/transaction#:\s*\d+/g, "");
	cleaned = cleaned.replace(/reference#:\s*\d+[A-Z]+\s+\d+\/\d+/g, "");

	// Remove ORIG ID and similar technical identifiers
	cleaned = cleaned.replace(/ORIG ID:[A-Z0-9]+/g, "");

	// Clean up specific patterns in your transactions
	const specialCases: Record<string, string> = {
		"OPTIMUM 7819": "Optimum Cable",
		"NYS DTF PIT": "NYS Tax Payment",
		"NATL FIN SVC LLC": "National Financial Services",
		"DOMESTIC INCOMING WIRE": "Incoming Wire Transfer",
		"Online Realtime Transfer to Personal Checking": "Transfer to Personal Account",
		"Online Transfer to MMA": "Transfer to Money Market Account",
		"MONTHLY SERVICE FEE": "Bank Service Fee",
	};

	// Apply special case replacements
	for (const [pattern, replacement] of Object.entries(specialCases)) {
		if (cleaned.includes(pattern)) {
			cleaned = replacement;
		}
	}

	// Clean up any remaining technical details
	cleaned = cleaned.replace(/\d{6,}/g, ""); // Remove long number sequences
	cleaned = cleaned.replace(/\s+/g, " "); // Remove extra spaces
	cleaned = cleaned.trim();

	// Proper case the final result (first letter of each word capitalized)
	cleaned = cleaned
		.split(" ")
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
		.join(" ");

	return cleaned;
}

function mapExpenseCategory(tx: Transaction): Partial<ExpenseRow> {
	const primary = tx.personal_finance_category?.primary;
	const businessCategory = mapPfcToBusinessCategory(primary, tx.name);
	const cleanedName = cleanupTransactionName(tx.name);

	const partialRow: Partial<ExpenseRow> = {
		"Meals/Entertainment": 0,
		"Travel Expenses": 0,
		"Repairs & Maintenance": 0,
		"Medical Expenses": 0,
		"Transfer / Owner Draw": 0,
		"Office Expense": 0,
		"Telephone Expense": 0,
		"Bank Charge": 0,
		Utilities: 0,
		Accounting: 0,
		"Personal funds": 0,
		MISC: 0,
	};

	return {
		...partialRow,
		Payee: cleanedName,
		Description: cleanedName,
		[businessCategory]: Math.abs(tx.amount),
	};
}
//
// 4) The main component
//
const TaxReportGenerator: React.FC<TaxReportGeneratorProps> = ({ year, userId, accounts }) => {
	const [dateRange] = useState({
		startDate: new Date(`${year}-01-01`),
		endDate: new Date(`${year}-12-31`),
	});

	const [selectedBanks, setSelectedBanks] = useState<string[]>([]);
	const isQueryEnabled = selectedBanks.length > 0;

	// Query the server for transactions, assuming personal_finance_category
	const { data: fiscalYearData, isLoading } = useQuery({
		queryKey: ["fiscal-year-transactions", userId, year, selectedBanks],
		queryFn: async () => {
			const resp = await axios.get("/api/transactions/get-transactions", {
				params: {
					userId,
					startDate: dateRange.startDate.toISOString().split("T")[0],
					endDate: dateRange.endDate.toISOString().split("T")[0],
					bankIds: selectedBanks.join(","),
				},
			});
			return resp.data as { transactions: Transaction[] };
		},
		enabled: isQueryEnabled,
		refetchOnWindowFocus: false,
		staleTime: Infinity,
	});

	const fiscalYearTransactions = fiscalYearData?.transactions || [];

	// Summaries
	const { expenses, deposits } = useMemo(() => {
		return fiscalYearTransactions.reduce<TaxReportAccumulator>(
			(acc, tx) => {
				const transactionDate = new Date(tx.date);
				if (transactionDate.getFullYear() === year) {
					if (tx.amount < 0) {
						// It's an expense
						const mappedExpCat = mapExpenseCategory(tx);
						acc.expenses.push({
							Date: transactionDate.toLocaleDateString(),
							"Check #": tx.paymentChannel === "check" ? "" : "",
							Payee: tx.name,
							Amount: Math.abs(tx.amount),
							...mappedExpCat,
							Description: tx.name,
						});
					} else {
						// It's a deposit
						acc.deposits.push({
							Date: transactionDate.toLocaleDateString(),
							Source: tx.name,
							Amount: tx.amount,
							"W-2 Income": tx.category === "INCOME" && tx.name.toLowerCase().includes("payroll") ? tx.amount : "",
							"Self Employed Income": tx.category === "INCOME" && !tx.name.toLowerCase().includes("payroll") ? tx.amount : "",
							"Personal funds": tx.personal_finance_category?.primary === "TRANSFER_IN" ? tx.amount : "",
						});
					}
				}
				return acc;
			},
			{ expenses: [], deposits: [] }
		);
	}, [fiscalYearTransactions, year]);

	const generateExcel = async () => {
		try {
			// Instead of fetching new transactions, use the already filtered transactions
			// from fiscalYearTransactions which respects the selectedBanks
			const final = fiscalYearTransactions.reduce<TaxReportAccumulator>(
				(acc, tx) => {
					const transactionDate = new Date(tx.date);
					if (transactionDate.getFullYear() === year) {
						if (tx.amount < 0) {
							const mappedExpCat = mapExpenseCategory(tx);
							acc.expenses.push({
								Date: transactionDate.toLocaleDateString(),
								"Check #": tx.paymentChannel === "check" ? "" : "",
								Payee: tx.name,
								Amount: Math.abs(tx.amount),
								...mappedExpCat,
								Description: tx.name,
							});
						} else {
							acc.deposits.push({
								Date: transactionDate.toLocaleDateString(),
								Source: tx.name,
								Amount: tx.amount,
								"W-2 Income": tx.category === "INCOME" && tx.name.toLowerCase().includes("payroll") ? tx.amount : "",
								"Self Employed Income": tx.category === "INCOME" && !tx.name.toLowerCase().includes("payroll") ? tx.amount : "",
								"Personal funds": tx.personal_finance_category?.primary === "TRANSFER_IN" ? tx.amount : "",
							});
						}
					}
					return acc;
				},
				{ expenses: [], deposits: [] }
			);

			// Make Excel
			const wb = XLSX.utils.book_new();
			const wsExpenses = XLSX.utils.json_to_sheet(final.expenses);
			XLSX.utils.book_append_sheet(wb, wsExpenses, "Expenses");

			const wsDeposits = XLSX.utils.json_to_sheet(final.deposits);
			XLSX.utils.book_append_sheet(wb, wsDeposits, "Deposits");

			XLSX.writeFile(wb, `tax_report_${year}.xlsx`);
		} catch (err) {
			console.error("Error generating report:", err);
		}
	};

	// UI
	return (
		<div className="space-y-4">
			{/* Bank Selection */}
			<div className="p-4 border rounded-lg">
				<h3 className="text-lg font-medium mb-2">Select Banks for Tax Report</h3>
				<div className="flex flex-wrap gap-2">
					{accounts.map((account) => (
						<label key={account.accountId} className="flex items-center space-x-2">
							<input
								type="checkbox"
								checked={selectedBanks.includes(account.accountId)}
								onChange={(e) => {
									if (e.target.checked) {
										setSelectedBanks((prev) => [...prev, account.accountId]);
									} else {
										setSelectedBanks((prev) => prev.filter((id) => id !== account.accountId));
									}
								}}
								className="rounded border-gray-300"
							/>
							<span>{account.name}</span>
						</label>
					))}
				</div>
			</div>

			{/* Header / Export */}
			<div className="flex justify-between items-center">
				<h2 className="text-xl font-semibold">Tax Report Generator ({year})</h2>
				<Button onClick={generateExcel} disabled={!isQueryEnabled || isLoading} className="flex items-center gap-2">
					<Download className="h-4 w-4" />
					{isLoading ? "Loading..." : "Export Tax Report"}
				</Button>
			</div>

			{/* Loading / no selection states */}
			{isQueryEnabled && isLoading && <div className="p-2 text-gray-500">Loading transactions...</div>}
			{!isQueryEnabled && <div className="p-2 text-gray-500">Select at least one bank to see the report.</div>}

			{/* Summaries */}
			<div className="grid grid-cols-2 gap-4">
				<div className="p-4 border rounded-lg">
					<h3 className="text-lg font-medium mb-2">Expenses Summary</h3>
					<p>Total Records: {expenses.length}</p>
					{/* Amount could be undefined, so do (exp.Amount || 0). */}
					<p>Total Amount: {formatAmount(expenses.reduce((sum, exp) => sum + (exp.Amount || 0), 0))}</p>
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
