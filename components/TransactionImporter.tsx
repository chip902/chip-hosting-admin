"use client";
import React, { useState, ChangeEvent, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Papa, { ParseResult, ParseError } from "papaparse";
import { UploadCloud, FileText, Check, AlertTriangle, ChevronDown, ChevronRight } from "lucide-react";
import axios from "axios";

interface TransactionImporterProps {
	userId: string;
	bankId: string;
	onImportSuccess?: () => void;
}

interface TransactionMetadata {
	transactionNumber?: string;
	referenceNumber?: string;
	originatingBank?: string;
	beneficiary?: string;
	traceNumber?: string;
	originatingCompany?: string;
	originatingId?: string;
	individualId?: string;
	individualName?: string;
	entryDescription?: string;
	secCode?: string;
	effectiveDate?: string;
}

interface ImportedTransaction {
	id: string;
	accountId: string;
	amount: number;
	date: Date;
	name: string;
	paymentChannel: string;
	pending: boolean;
	category: string;
	userId: string;
	bankId: string;
	metadata: TransactionMetadata;
}

interface BankCSVRow {
	Details: string;
	"Posting Date": string;
	Description: string;
	Amount: string;
	Type: string;
	Balance: string;
	"Check or Slip #"?: string;
}

interface UploadStatus {
	status: "" | "loading" | "success" | "error";
	message: string;
}

const TransactionImporter: React.FC<TransactionImporterProps> = ({ userId, bankId, onImportSuccess }) => {
	const [file, setFile] = useState<File | null>(null);
	const [parsedData, setParsedData] = useState<ImportedTransaction[]>([]);
	const [uploadStatus, setUploadStatus] = useState<UploadStatus>({ status: "", message: "" });
	const [previewData, setPreviewData] = useState<ImportedTransaction[]>([]);
	const [originalData, setOriginalData] = useState<BankCSVRow[]>([]);
	const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
	const [isDragging, setIsDragging] = useState(false);

	const { data: banksData } = useQuery({
		queryKey: ["banks"],
		queryFn: async () => {
			const response = await axios.get("/api/bank/get-banks", {
				data: userId,
				params: userId,
			});
			return response;
		},
	});

	const extractMetadata = useCallback((description: string, type: string): TransactionMetadata => {
		const metadata: TransactionMetadata = {};

		try {
			if (type === "ACCT_XFER") {
				const txnMatch = description.match(/transaction#: (\d+)/);
				const refMatch = description.match(/reference#: (\w+)/);
				if (txnMatch) metadata.transactionNumber = txnMatch[1];
				if (refMatch) metadata.referenceNumber = refMatch[1];
			} else if (type === "WIRE_INCOMING") {
				const bankMatch = description.match(/VIA: ([^/]+)/);
				const benMatch = description.match(/BNF=([^/]+)/);
				const traceMatch = description.match(/TRACE#:(\d+)/);
				if (bankMatch) metadata.originatingBank = bankMatch[1].trim();
				if (benMatch) metadata.beneficiary = benMatch[1].trim();
				if (traceMatch) metadata.traceNumber = traceMatch[1];
			} else if (type === "ACH_DEBIT" || type === "ACH_CREDIT") {
				const origCoMatch = description.match(/ORIG CO NAME:([^]+?)(?=ORIG ID:|$)/);
				const origIdMatch = description.match(/ORIG ID:([^]+?)(?=DESC DATE:|$)/);
				const entryDescrMatch = description.match(/CO ENTRY DESCR:([^]+?)(?=SEC:|$)/);
				const secMatch = description.match(/SEC:([^]+?)(?=TRACE#:|$)/);
				const traceMatch = description.match(/TRACE#:(\d+)/);
				const indIdMatch = description.match(/IND ID:([^]+?)(?=IND NAME:|$)/);
				const indNameMatch = description.match(/IND NAME:([^]+?)(?=TRN:|$)/);
				const eedMatch = description.match(/EED:(\d+)/);

				if (origCoMatch) metadata.originatingCompany = origCoMatch[1].trim();
				if (origIdMatch) metadata.originatingId = origIdMatch[1].trim();
				if (entryDescrMatch) metadata.entryDescription = entryDescrMatch[1].trim();
				if (secMatch) metadata.secCode = secMatch[1].trim();
				if (traceMatch) metadata.traceNumber = traceMatch[1];
				if (indIdMatch) metadata.individualId = indIdMatch[1].trim();
				if (indNameMatch) metadata.individualName = indNameMatch[1].trim();
				if (eedMatch) metadata.effectiveDate = eedMatch[1];
			}
		} catch (error) {
			console.error("Error extracting metadata:", error);
		}

		return metadata;
	}, []);

	const processCSVRow = useCallback(
		(row: BankCSVRow): ImportedTransaction | null => {
			try {
				const amount = parseFloat(row.Amount.replace(/[$,]/g, ""));
				if (isNaN(amount)) throw new Error("Invalid amount");

				const dateParts = row["Posting Date"].split("/");
				if (dateParts.length !== 3) throw new Error("Invalid date format");

				const year = dateParts[2].length === 2 ? "20" + dateParts[2] : dateParts[2];
				const date = new Date(`${year}-${dateParts[0]}-${dateParts[1]}`);

				const bankId = banksData?.data?.bankId || "default";
				const metadata = extractMetadata(row.Description, row.Type);

				return {
					id: crypto.randomUUID(),
					accountId: "default",
					amount,
					date,
					name: row.Description.trim(),
					paymentChannel: row.Type.toLowerCase(),
					pending: false,
					category: row.Type,
					userId,
					bankId,
					metadata,
				};
			} catch (error) {
				console.error("Error processing CSV row:", error);
				return null;
			}
		},
		[userId, extractMetadata, banksData?.data.bankId]
	);

	const handleFileUpload = useCallback(
		async (file: File) => {
			setFile(file);
			setUploadStatus({ status: "", message: "" });

			Papa.parse<BankCSVRow>(file, {
				header: true,
				skipEmptyLines: true,
				transformHeader: (header: string) => header.trim(),
				complete: (results: ParseResult<BankCSVRow>) => {
					setOriginalData(results.data);

					const validData: ImportedTransaction[] = results.data
						.map(processCSVRow)
						.filter((transaction): transaction is ImportedTransaction => transaction !== null);

					if (validData.length === 0) {
						setUploadStatus({
							status: "error",
							message: "No valid transactions found in the CSV file",
						});
						return;
					}

					setParsedData(validData);
					setPreviewData(validData.slice(0, 5));
				},
				error: (error: Error, file: any) => {
					setUploadStatus({
						status: "error",
						message: "Error parsing CSV file: " + error.message,
					});
				},
			});
		},
		[processCSVRow]
	);

	const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
		const selectedFile = event.target.files?.[0];
		if (selectedFile) {
			handleFileUpload(selectedFile);
		}
	};

	const handleDragOver = (event: React.DragEvent) => {
		event.preventDefault();
		setIsDragging(true);
	};

	const handleDragLeave = (event: React.DragEvent) => {
		event.preventDefault();
		setIsDragging(false);
	};

	const handleDrop = (event: React.DragEvent) => {
		event.preventDefault();
		setIsDragging(false);

		const droppedFile = event.dataTransfer.files[0];
		if (droppedFile?.type === "text/csv") {
			handleFileUpload(droppedFile);
		} else {
			setUploadStatus({
				status: "error",
				message: "Please upload a CSV file",
			});
		}
	};

	const handleImport = async () => {
		try {
			setUploadStatus({ status: "loading", message: "Importing transactions..." });

			const response = await axios.post("/api/transactions/import", {
				transactions: parsedData,
				userId,
			});

			setUploadStatus({
				status: "success",
				message: `Successfully imported ${response.data.count} transactions`,
			});

			// Reset the form
			setFile(null);
			setParsedData([]);
			setPreviewData([]);
			setOriginalData([]);
			setExpandedRows(new Set());

			// Call the success callback if provided
			if (onImportSuccess) {
				onImportSuccess();
			}
		} catch (error) {
			console.error("Import error:", error);
			const errorMessage = axios.isAxiosError(error)
				? error.response?.data?.error || error.response?.data?.details || error.message
				: "Unknown error occurred";

			setUploadStatus({
				status: "error",
				message: "Error importing transactions: " + errorMessage,
			});
		}
	};

	const syncMutation = useMutation({
		mutationFn: async () => {
			// Add your Plaid sync API call here
			const response = await axios.post("/api/transactions/sync");
			return response;
		},
	});

	return (
		<div className="flex flex-col gap-6">
			<Card>
				<CardHeader>
					<CardTitle className="flex justify-between items-center">
						<span>Import Transactions</span>
						<Button onClick={() => syncMutation.mutate()} disabled={syncMutation.isPending} className="plaidlink-primary">
							{syncMutation.isPending ? "Syncing..." : "Sync with Plaid"}
						</Button>
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div
						className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg transition-colors
              ${isDragging ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-gray-300 dark:border-gray-700"}
              ${uploadStatus.status === "error" ? "border-red-300 dark:border-red-700" : ""}`}
						onDragOver={handleDragOver}
						onDragLeave={handleDragLeave}
						onDrop={handleDrop}>
						<input type="file" accept=".csv" onChange={handleFileSelect} className="hidden" id="file-upload" />
						<label htmlFor="file-upload" className="flex flex-col items-center cursor-pointer">
							<UploadCloud className="w-12 h-12 mb-4 text-gray-400" />
							<span className="text-sm text-gray-600 dark:text-gray-400">{file ? file.name : "Drop CSV file here or click to upload"}</span>
						</label>
					</div>
					{previewData.length > 0 && (
						<div className="mt-6">
							<h3 className="text-lg font-semibold mb-4">Preview (First 5 Rows)</h3>
							<div className="overflow-x-auto">
								<table className="w-full">
									<thead>
										<tr className="border-b dark:border-gray-700">
											<th className="w-8"></th>
											<th className="px-4 py-2 text-left">Date</th>
											<th className="px-4 py-2 text-left">Type</th>
											<th className="px-4 py-2 text-left">Description</th>
											<th className="px-4 py-2 text-right">Amount</th>
											<th className="px-4 py-2 text-right">Balance</th>
										</tr>
									</thead>
									<tbody>
										{previewData.map((transaction, index) => {
											const originalRow = originalData[index];
											const isExpanded = expandedRows.has(index);

											return (
												<React.Fragment key={index}>
													<tr className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
														<td className="px-4 py-2">
															<button
																onClick={() => {
																	const newExpandedRows = new Set(expandedRows);
																	if (expandedRows.has(index)) {
																		newExpandedRows.delete(index);
																	} else {
																		newExpandedRows.add(index);
																	}
																	setExpandedRows(newExpandedRows);
																}}
																className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
																{isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
															</button>
														</td>
														<td className="px-4 py-2">{transaction.date.toLocaleDateString()}</td>
														<td className="px-4 py-2">
															<span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-700">
																{transaction.category}
															</span>
														</td>
														<td className="px-4 py-2 max-w-md truncate">{originalRow.Description}</td>
														<td className={`px-4 py-2 text-right ${transaction.amount < 0 ? "text-red-600" : "text-green-600"}`}>
															${Math.abs(transaction.amount).toFixed(2)}
														</td>
														<td className="px-4 py-2 text-right">${parseFloat(originalRow.Balance).toFixed(2)}</td>
													</tr>
													{isExpanded && (
														<tr>
															<td colSpan={6} className="border-b dark:border-gray-700">
																<div className="px-4 py-2 bg-gray-50 dark:bg-gray-800">
																	<div className="grid grid-cols-2 gap-4">
																		{Object.entries(transaction.metadata).map(
																			([key, value]) =>
																				value && (
																					<div key={key} className="text-sm">
																						<span className="font-medium text-gray-500 dark:text-gray-400">
																							{key.replace(/([A-Z])/g, " $1").trim()}:
																						</span>
																						<span className="ml-2 text-gray-900 dark:text-gray-100">{value}</span>
																					</div>
																				)
																		)}
																	</div>
																</div>
															</td>
														</tr>
													)}
												</React.Fragment>
											);
										})}
									</tbody>
								</table>
							</div>
						</div>
					)}
					{parsedData.length > 0 && (
						<div className="mt-6 flex justify-end">
							<Button onClick={handleImport} disabled={uploadStatus.status === "loading"} className="plaidlink-primary">
								{uploadStatus.status === "loading" ? (
									"Importing..."
								) : (
									<>
										<FileText className="w-4 h-4 mr-2" />
										Import {parsedData.length} Transactions
									</>
								)}
							</Button>
						</div>
					)}
					{uploadStatus.status && (
						<Alert
							className={`mt-4 ${
								uploadStatus.status === "success"
									? "bg-green-50 dark:bg-green-900/20"
									: uploadStatus.status === "error"
									? "bg-red-50 dark:bg-red-900/20"
									: ""
							}`}>
							<AlertDescription className="flex items-center">
								{uploadStatus.status === "success" ? (
									<Check className="w-4 h-4 mr-2 text-green-500" />
								) : uploadStatus.status === "error" ? (
									<AlertTriangle className="w-4 h-4 mr-2 text-red-500" />
								) : null}
								{uploadStatus.message}
							</AlertDescription>
						</Alert>
					)}
				</CardContent>
			</Card>
		</div>
	);
};

export default TransactionImporter;
