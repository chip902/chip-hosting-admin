"use client";
import React, { useState, useCallback, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Papa from "papaparse";
import axios from "axios";
import { Loader2, Upload, FileUp, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface TimeEntryImporterProps {
	onImportSuccess?: () => void;
}

interface TimeEntryRow {
	date: string; // YYYY-MM-DD
	startTime: string; // HH:MM
	endTime: string; // HH:MM
	description: string;
	customerId: string | number;
	projectId: string | number;
	taskId: string | number;
	userId: string | number;
}

type ImportStatus = "" | "parsing" | "validating" | "importing" | "success" | "error";

const TimeEntryImporter: React.FC<TimeEntryImporterProps> = ({ onImportSuccess }) => {
	const [file, setFile] = useState<File | null>(null);
	const [parsedData, setParsedData] = useState<TimeEntryRow[]>([]);
	const [previewData, setPreviewData] = useState<TimeEntryRow[]>([]);
	const [status, setStatus] = useState<ImportStatus>("");
	const [statusMessage, setStatusMessage] = useState("");
	const [isDragging, setIsDragging] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const queryClient = useQueryClient();

	const importMutation = useMutation({
		mutationFn: async (entries: TimeEntryRow[]) => {
			return await axios.post("/api/timelog/import", { entries });
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["timeEntries"] });
			setStatus("success");
			setStatusMessage(`Successfully imported ${parsedData.length} time entries`);
			if (onImportSuccess) onImportSuccess();
			toast.success(`Imported ${parsedData.length} time entries`);
		},
		onError: (error: any) => {
			console.error("Import error:", error);
			setStatus("error");
			setStatusMessage(`Error importing entries: ${error.message}`);
			toast.error("Import failed", {
				description: error.response?.data?.message || error.message,
			});
		},
	});

	const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
		const selectedFile = event.target.files?.[0];
		if (selectedFile) {
			processFile(selectedFile);
		}
	};

	const handleDragOver = useCallback((event: React.DragEvent) => {
		event.preventDefault();
		setIsDragging(true);
	}, []);

	const handleDragLeave = useCallback((event: React.DragEvent) => {
		event.preventDefault();
		setIsDragging(false);
	}, []);

	const handleDrop = useCallback((event: React.DragEvent) => {
		event.preventDefault();
		setIsDragging(false);

		const droppedFile = event.dataTransfer.files[0];
		if (droppedFile?.type === "text/csv" || droppedFile?.name.endsWith(".csv")) {
			processFile(droppedFile);
		} else {
			setStatus("error");
			setStatusMessage("Please upload a CSV file");
			toast.error("Invalid file format", {
				description: "Please upload a CSV file",
			});
		}
	}, []);

	const processFile = (file: File) => {
		setFile(file);
		setStatus("parsing");
		setStatusMessage("Parsing CSV file...");

		Papa.parse<TimeEntryRow>(file, {
			header: true,
			skipEmptyLines: true,
			dynamicTyping: true,
			transformHeader: (header: string) => header.trim().toLowerCase(),
			complete: (results) => {
				// Handle CSV parsing results
				if (results.errors.length > 0) {
					setStatus("error");
					setStatusMessage(`CSV parsing error: ${results.errors[0].message}`);
					toast.error("CSV parsing error", {
						description: results.errors[0].message,
					});
					return;
				}

				setStatus("validating");
				setStatusMessage("Validating time entries...");

				// Validate data
				const validRows: TimeEntryRow[] = [];
				const errors: string[] = [];

				results.data.forEach((row, index) => {
					// Check required fields
					const missingFields = ["date", "startTime", "endTime", "customerId", "projectId", "taskId", "userId"].filter(
						(field) => !row[field as keyof TimeEntryRow]
					);

					if (missingFields.length > 0) {
						errors.push(`Row ${index + 1}: Missing required fields: ${missingFields.join(", ")}`);
						return;
					}

					validRows.push(row);
				});

				if (errors.length > 0) {
					setStatus("error");
					setStatusMessage(`Validation failed: ${errors.length} rows have errors`);
					toast.error(`Validation failed: ${errors.length} rows have errors`, {
						description: errors[0],
					});
					return;
				}

				// Set data and preview
				setParsedData(validRows);
				setPreviewData(validRows.slice(0, 5));

				setStatus("");
				setStatusMessage(`${validRows.length} time entries ready for import`);
			},
			error: (error: Error) => {
				setStatus("error");
				setStatusMessage(`Error parsing CSV: ${error.message}`);
				toast.error("Error parsing CSV", {
					description: error.message,
				});
			},
		});
	};

	const handleImport = () => {
		if (parsedData.length === 0) {
			toast.error("No data to import");
			return;
		}

		setStatus("importing");
		setStatusMessage(`Importing ${parsedData.length} time entries...`);
		importMutation.mutate(parsedData);
	};

	const handleFileButtonClick = () => {
		fileInputRef.current?.click();
	};

	return (
		<Card className="mb-6">
			<CardHeader className="pb-3">
				<CardTitle className="text-xl font-semibold flex items-center">
					<FileUp className="mr-2 h-5 w-5" />
					Import Time Entries
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div
					className={`
            flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg transition-colors mb-4
            ${isDragging ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-gray-300 dark:border-gray-700"}
            ${status === "error" ? "border-red-300 dark:border-red-700" : ""}
          `}
					onDragOver={handleDragOver}
					onDragLeave={handleDragLeave}
					onDrop={handleDrop}>
					<input type="file" accept=".csv" onChange={handleFileSelect} className="hidden" ref={fileInputRef} id="csv-upload" />

					<Upload className="w-12 h-12 mb-4 text-gray-400" />
					<p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
						{file ? file.name : "Drop your time entries CSV file here or click to browse"}
					</p>
					<Button variant="outline" onClick={handleFileButtonClick} className="mt-2">
						Select CSV File
					</Button>
				</div>

				{status && (
					<Alert
						className={`mb-4 ${
							status === "success"
								? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
								: status === "error"
								? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
								: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
						}`}>
						<AlertDescription className="flex items-center text-sm">
							{status === "success" ? (
								<CheckCircle className="w-4 h-4 mr-2 text-green-500" />
							) : status === "error" ? (
								<AlertCircle className="w-4 h-4 mr-2 text-red-500" />
							) : (
								<Loader2 className="w-4 h-4 mr-2 text-blue-500 animate-spin" />
							)}
							{statusMessage}
						</AlertDescription>
					</Alert>
				)}

				{previewData.length > 0 && (
					<div className="mt-4">
						<h3 className="text-lg font-medium mb-2">Preview (First 5 Rows)</h3>
						<div className="overflow-x-auto">
							<table className="w-full border-collapse">
								<thead>
									<tr className="bg-gray-50 dark:bg-gray-800">
										<th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
											Date
										</th>
										<th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
											Time
										</th>
										<th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
											Description
										</th>
										<th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
											Customer
										</th>
										<th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
											Project
										</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-gray-200 dark:divide-gray-700">
									{previewData.map((entry, index) => (
										<tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
											<td className="px-4 py-2 text-sm">{entry.date}</td>
											<td className="px-4 py-2 text-sm">
												{entry.startTime} - {entry.endTime}
											</td>
											<td className="px-4 py-2 text-sm">{entry.description}</td>
											<td className="px-4 py-2 text-sm">{entry.customerId}</td>
											<td className="px-4 py-2 text-sm">{entry.projectId}</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
						<div className="mt-4 text-sm text-gray-500 dark:text-gray-400">{parsedData.length} time entries found in CSV</div>
					</div>
				)}

				<div className="mt-4 flex justify-end">
					<Button
						onClick={handleImport}
						disabled={parsedData.length === 0 || status === "importing" || status === "success"}
						className="plaidlink-primary">
						{status === "importing" ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Importing...
							</>
						) : (
							<>
								<FileUp className="mr-2 h-4 w-4" />
								Import {parsedData.length} Entries
							</>
						)}
					</Button>
				</div>
			</CardContent>
		</Card>
	);
};

export default TimeEntryImporter;
