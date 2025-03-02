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

type ReportType = "deposits" | "expenses" | "both";

interface BankSelection {
	accountId: string;
	reportType: ReportType;
}

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
	// Clean up the transaction name first
	const cleanName = cleanupTransactionName(transactionName);
	// Convert to uppercase for consistent matching
	const name = cleanName.toUpperCase();

	console.log("Processing transaction:", {
		original: transactionName,
		cleaned: cleanName,
		upperCase: name,
		plaidCategory: primaryCat,
	});

	// Define category mappings
	const categoryMappings: [string[], string][] = [
		[["VERIZON"], "Telephone Expense"],
		[["OPTIMUM", "NYSEG"], "Utilities"],
		[["AMERICAN EXPRESS", "WIRE FEE", "SERVICE FEE"], "Bank Charge"],
		[["TRANSFER", "FID BKG SVC", "NYS DTF", "IRS", "TAX", "DOMESTIC INCOMING"], "Personal"],
		[["SMASHBALLOON", "ELEMENTOR", "GOOGLE", "ADOBE"], "Office Expense"],
	];

	// Check each category mapping
	for (const [patterns, category] of categoryMappings) {
		if (patterns.some((pattern) => name.includes(pattern))) {
			console.log(`Mapped "${cleanName}" to category: ${category}`);
			return category;
		}
	}

	// If no matches found
	console.log(`No category match found for "${cleanName}", defaulting to MISC`);
	return "MISC";
}

function cleanupTransactionName(name: string): string {
	// Remove common prefixes and technical details
	let cleaned = name.replace(/ORIG CO NAME:|DESC DATE:|CO ENTRY DESCR:|SEC:|TRACE#:|EED:|IND ID:|IND NAME:|TRN:|\s+TC$/g, "");

	// Remove transaction numbers and references
	cleaned = cleaned.replace(/transaction#:\s*\d+/g, "");
	cleaned = cleaned.replace(/reference#:\s*\d+[A-Z]+\s+\d+\/\d+/g, "");
	cleaned = cleaned.replace(/ORIG ID:[A-Z0-9]+/g, "");

	// Special case replacements
	const specialCases: Record<string, string> = {
		"OPTIMUM 7819": "Optimum Cable",
		"NYS DTF PIT": "NYS Tax Payment",
		"NATL FIN SVC LLC": "National Financial Services",
		"DOMESTIC INCOMING WIRE": "Incoming Wire Transfer",
		"Online Realtime Transfer to Personal Checking": "Transfer to Personal Account",
		"Online Transfer to MMA": "Transfer to Money Market Account",
		"MONTHLY SERVICE FEE": "Bank Service Fee",
		"AMERICAN EXPRESS": "Amex Payment",
		GOOGLE: "Google Services",
		ADOBE: "Adobe Software",
		ELEMENTOR: "Elementor Website Builder",
		SMASHBALLOON: "SmashBalloon Social Media Plugin",
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

	// Proper case the final result
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
		"Medical Exp": 0,
		"Office Expense": 0,
		"Telephone Expense": 0,
		Ads: 0,
		Utilities: 0,
		Accounting: 0,
		Personal: 0,
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
	const [bankSelections, setBankSelections] = useState<BankSelection[]>([]);
	const isQueryEnabled = bankSelections.length > 0;

	// Helper function to check if a bank is selected for a specific type
	const isBankSelectedFor = (accountId: string, type: ReportType) => {
		return bankSelections.some((selection) => selection.accountId === accountId && (selection.reportType === type || selection.reportType === "both"));
	};

	// Query the server for transactions, assuming personal_finance_category
	const { data: fiscalYearData, isLoading } = useQuery({
		queryKey: ["fiscal-year-transactions", userId, year, bankSelections],
		queryFn: async () => {
			const resp = await axios.get("/api/transactions/get-transactions", {
				params: {
					userId,
					startDate: dateRange.startDate.toISOString().split("T")[0],
					endDate: dateRange.endDate.toISOString().split("T")[0],
					// Map the accountIds from bankSelections
					bankIds: bankSelections.map((s) => s.accountId).join(","),
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
		// Sort transactions by date first
		const sortedTransactions = [...fiscalYearTransactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
		return sortedTransactions.reduce<TaxReportAccumulator>(
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
			// Sort transactions by date first
			const sortedTransactions = [...fiscalYearTransactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

			// Process transactions with proper filtering and mapping
			const final = sortedTransactions.reduce<TaxReportAccumulator>(
				(acc, tx) => {
					const transactionDate = new Date(tx.date);
					if (transactionDate.getFullYear() === year) {
						// Find the bank selection for this transaction
						const bankSelection = bankSelections.find((s) => s.accountId === tx.accountId);
						if (!bankSelection) return acc; // Skip if bank not selected

						if (tx.amount < 0 && (bankSelection.reportType === "expenses" || bankSelection.reportType === "both")) {
							const mappedExpCat = mapExpenseCategory(tx);
							const cleanedName = cleanupTransactionName(tx.name);
							acc.expenses.push({
								Date: transactionDate.toLocaleDateString(),
								"Check #": tx.paymentChannel === "check" ? tx.paymentChannel : "",
								Payee: cleanedName,
								Amount: Math.abs(tx.amount),
								"Office Expense": mappedExpCat["Office Expense"] || 0,
								"Telephone Expense": mappedExpCat["Telephone Expense"] || 0,
								Personal: mappedExpCat["Personal"] || 0,
								Accounting: mappedExpCat["Accounting"] || 0,
								"Bank Charge": mappedExpCat["Bank Charge"] || 0,
								Ads: mappedExpCat["Ads"] || 0,
								Insurance: mappedExpCat["Insurance"] || 0,
								"Medical Exp": mappedExpCat["Medical Exp"] || 0,
								Utilities: mappedExpCat["Utilities"] || 0,
								MISC: mappedExpCat["MISC"] || 0,
								Description: cleanedName,
							});
						} else if (tx.amount > 0 && (bankSelection.reportType === "deposits" || bankSelection.reportType === "both")) {
							const cleanedName = cleanupTransactionName(tx.name);
							acc.deposits.push({
								Date: transactionDate.toLocaleDateString(),
								Source: cleanedName,
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

			// Create Excel workbook
			const wb = XLSX.utils.book_new();

			// Define headers
			const expenseHeaders = [
				"Date",
				"Check #",
				"Payee",
				"Amount",
				"Office Expense",
				"Telephone Expense",
				"Personal",
				"Accounting",
				"Bank Charge",
				"Ads",
				"Insurance",
				"Medical Exp",
				"Utilities",
				"MISC",
				"Description",
			];

			const depositHeaders = ["Date", "Source", "Amount", "W-2 Income", "Self Employed Income", "Personal funds"];

			// Create Expenses sheet if there are expenses
			if (final.expenses.length > 0) {
				const wsExpenses = XLSX.utils.json_to_sheet(final.expenses, {
					header: expenseHeaders,
					skipHeader: true,
				});

				// Add headers with styling
				XLSX.utils.sheet_add_aoa(wsExpenses, [expenseHeaders], { origin: "A1" });

				// Optional: Add some basic styling to headers
				for (let i = 0; i < expenseHeaders.length; i++) {
					const cellRef = XLSX.utils.encode_cell({ r: 0, c: i });
					if (!wsExpenses[cellRef]) wsExpenses[cellRef] = {};
					wsExpenses[cellRef].s = { font: { bold: true } };
				}

				XLSX.utils.book_append_sheet(wb, wsExpenses, "Expenses");
			}

			// Create Deposits sheet if there are deposits
			if (final.deposits.length > 0) {
				const wsDeposits = XLSX.utils.json_to_sheet(final.deposits, {
					header: depositHeaders,
					skipHeader: true,
				});

				// Add headers with styling
				XLSX.utils.sheet_add_aoa(wsDeposits, [depositHeaders], { origin: "A1" });

				// Optional: Add some basic styling to headers
				for (let i = 0; i < depositHeaders.length; i++) {
					const cellRef = XLSX.utils.encode_cell({ r: 0, c: i });
					if (!wsDeposits[cellRef]) wsDeposits[cellRef] = {};
					wsDeposits[cellRef].s = { font: { bold: true } };
				}

				XLSX.utils.book_append_sheet(wb, wsDeposits, "Deposits");
			}

			// Save the file
			XLSX.writeFile(wb, `tax_report_${year}.xlsx`);
		} catch (err) {
			console.error("Error generating report:", err);
			// You might want to add some user feedback here
		}
	};
	// UI
	return (
		<div className="space-y-4">
			{/* Bank Selection */}
			<div className="p-4 border rounded-lg">
				<h3 className="text-lg font-medium mb-2">Select Banks and Report Types</h3>
				<div className="flex flex-col gap-4">
					{accounts.map((account) => (
						<div key={account.accountId} className="space-y-2">
							<div className="font-medium">{account.name}</div>
							<div className="flex gap-4 ml-4">
								<label className="flex items-center space-x-2">
									<input
										type="radio"
										name={`report-type-${account.accountId}`}
										checked={isBankSelectedFor(account.accountId, "expenses")}
										onChange={() => {
											setBankSelections((prev) => {
												const filtered = prev.filter((s) => s.accountId !== account.accountId);
												return [...filtered, { accountId: account.accountId, reportType: "expenses" }];
											});
										}}
										className="rounded border-gray-300"
									/>
									<span>Expenses Only</span>
								</label>
								<label className="flex items-center space-x-2">
									<input
										type="radio"
										name={`report-type-${account.accountId}`}
										checked={isBankSelectedFor(account.accountId, "deposits")}
										onChange={() => {
											setBankSelections((prev) => {
												const filtered = prev.filter((s) => s.accountId !== account.accountId);
												return [...filtered, { accountId: account.accountId, reportType: "deposits" }];
											});
										}}
										className="rounded border-gray-300"
									/>
									<span>Deposits Only</span>
								</label>
								<label className="flex items-center space-x-2">
									<input
										type="radio"
										name={`report-type-${account.accountId}`}
										checked={bankSelections.some((s) => s.accountId === account.accountId && s.reportType === "both")}
										onChange={() => {
											setBankSelections((prev) => {
												// Remove any existing selection for this account
												const filtered = prev.filter((s) => s.accountId !== account.accountId);
												// Add the new selection
												return [
													...filtered,
													{
														accountId: account.accountId,
														reportType: "both",
													},
												];
											});
										}}
										className="rounded border-gray-300"
									/>
									<span>Both</span>
								</label>
								<label className="flex items-center space-x-2">
									<input
										type="radio"
										name={`report-type-${account.accountId}`}
										checked={!bankSelections.some((s) => s.accountId === account.accountId)}
										onChange={() => {
											setBankSelections((prev) => prev.filter((s) => s.accountId !== account.accountId));
										}}
										className="rounded border-gray-300"
									/>
									<span>None</span>
								</label>
							</div>
						</div>
					))}
				</div>
			</div>

			{/* Header / Export */}
			<div className="flex justify-between items-center">
				<h2 className="text-xl font-semibold">Tax Report Generator ({year})</h2>
				<Button onClick={generateExcel} disabled={bankSelections.length === 0 || isLoading} className="flex items-center gap-2">
					<Download className="h-4 w-4" />
					{isLoading ? "Loading..." : "Export Tax Report"}
				</Button>
			</div>

			{/* Loading / no selection states */}
			{isQueryEnabled && isLoading && <div className="p-2 text-gray-500">Loading transactions...</div>}
			{bankSelections.length === 0 && <div className="p-2 text-gray-500">Select at least one bank and report type to generate the report.</div>}

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
