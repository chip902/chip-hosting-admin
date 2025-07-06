// app/invoices/CompactFileUploader.tsx
"use client";
import React, { useState, ChangeEvent, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Upload, X, Check, AlertTriangle, FileText, MapPin } from "lucide-react";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import Papa from "papaparse";
import ExcelJS from "exceljs";
import { useToast } from "@/app/hooks/useToast";
import useCreateTimeEntry from "@/app/hooks/useCreateTimeEntry";
import axios from "axios";
import { Customer, Project, Task, User } from "@/prisma/app/generated/prisma/client";
import { timeLogSchema } from "@/app/validationSchemas";
import { z } from "zod";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

// Define the target fields we want to map to
interface TargetField {
	name: string;
	label: string;
	required: boolean;
	type: "string" | "number" | "date" | "select";
	options?: { label: string; value: string | number }[];
}

interface FieldMappingOption {
	type: "column" | "constant";
	value: string | number;
}

interface FieldMappingState {
	[key: string]: FieldMappingOption;
}

const CompactFileUploader = () => {
	const [file, setFile] = useState<File | null>(null);
	const [parsedData, setParsedData] = useState<any[]>([]);
	const [previewData, setPreviewData] = useState<any[]>([]);
	const [fileHeaders, setFileHeaders] = useState<string[]>([]);
	const [isUploading, setIsUploading] = useState(false);
	const [showPreview, setShowPreview] = useState(false);
	const [currentStep, setCurrentStep] = useState<"preview" | "mapping" | "validation">("preview");
	const [customers, setCustomers] = useState<Customer[]>([]);
	const [projects, setProjects] = useState<Project[]>([]);
	const [tasks, setTasks] = useState<Task[]>([]);
	const [users, setUsers] = useState<User[]>([]);
	const [error, setError] = useState("");
	const [uploadStatus, setUploadStatus] = useState<{ success: boolean; message: string } | null>(null);
	const [fieldMappings, setFieldMappings] = useState<FieldMappingState>({});
	const [validationErrors, setValidationErrors] = useState<{ index: number; errors: string[] }[]>([]);
	const [mappedData, setMappedData] = useState<any[]>([]);
	const [durationUnit, setDurationUnit] = useState<"hours" | "minutes">("minutes");
	const [newEntities, setNewEntities] = useState<{
		projects: { name: string; description?: string }[];
		customers: { name: string; email: string }[];
		tasks: { name: string; description?: string }[];
	}>({ projects: [], customers: [], tasks: [] });

	const [showNewEntitiesDialog, setShowNewEntitiesDialog] = useState(false);

	const { toast } = useToast();
	const createTimeEntryMutation = useCreateTimeEntry();

	// Define target fields for time entries
	const targetFields: TargetField[] = [
		{ name: "customerId", label: "Customer", required: true, type: "select", options: customers.map((c) => ({ label: c.name, value: c.id })) },
		{ name: "projectId", label: "Project", required: true, type: "select", options: projects.map((p) => ({ label: p.name, value: p.id })) },
		{ name: "taskId", label: "Task", required: true, type: "select", options: tasks.map((t) => ({ label: t.name, value: t.id })) },
		{ name: "userId", label: "User", required: true, type: "select", options: users.map((u) => ({ label: u.firstName + " " + u.lastName, value: u.id })) },
		{ name: "date", label: "Date", required: true, type: "date" },
		{
			name: "duration",
			label: "Duration",
			required: true,
			type: "number",
		},
		{ name: "description", label: "Description", required: false, type: "string" },
		{ name: "startTime", label: "Start Time", required: false, type: "string" },
		{ name: "endTime", label: "End Time", required: false, type: "string" },
	];

	const previewRows = (data: any[]) => {
		if (!Array.isArray(data) || data.length === 0) return [];
		return data.slice(0, 5); // Preview first 5 rows
	};

	useEffect(() => {
		const fetchData = async () => {
			try {
				const response = await axios.get("/api/data");
				setCustomers(response.data.customers);
				setProjects(response.data.projects);
				setTasks(response.data.tasks);
				setUsers(response.data.users);
			} catch (error) {
				console.error("Error fetching data:", error);
			}
		};
		fetchData();
	}, [error]);

	const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
		const selectedFile = event.target.files?.[0];
		if (!selectedFile) return;

		setFile(selectedFile);

		// Handle XLSX files
		if (selectedFile.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" || selectedFile.type === "application/vnd.ms-excel") {
			parseExcelFile(selectedFile);
		} else if (selectedFile.type === "text/csv") {
			parseCsvFile(selectedFile);
		} else {
			toast({
				title: "Upload File Error",
				description: "Please upload a CSV or Excel file.",
				variant: "destructive",
			});
		}
	};

	const parseCsvFile = (file: File) => {
		Papa.parse(file, {
			header: true,
			skipEmptyLines: true,
			complete: (results) => {
				if (results.data && Array.isArray(results.data) && results.data.length > 0) {
					const data = results.data as Record<string, any>[];
					setParsedData(data);
					setPreviewData(previewRows(data));

					// Extract headers from the first row
					if (data.length > 0) {
						setFileHeaders(Object.keys(data[0]));
						// Attempt auto-mapping based on header names
						performAutoMapping(Object.keys(data[0]));
					}

					setShowPreview(true);
					setCurrentStep("preview");
				} else {
					toast({
						title: "Error",
						description: "No valid data found in the CSV file",
						variant: "destructive",
					});
				}
			},
			error: (error) => {
				console.error("Error parsing CSV:", error);
				toast({
					title: "Error",
					description: "Failed to parse CSV file",
					variant: "destructive",
				});
			},
		});
	};

	const parseExcelFile = async (file: File) => {
		try {
			const workbook = new ExcelJS.Workbook();
			const arrayBuffer = await file.arrayBuffer();
			await workbook.xlsx.load(arrayBuffer);

			// Get the first worksheet
			const worksheet = workbook.getWorksheet(1);
			if (!worksheet) {
				toast({
					title: "Error",
					description: "No worksheet found in the Excel file",
					variant: "destructive",
				});
				return;
			}

			// Convert worksheet to JSON
			const jsonData: any[] = [];

			// Get headers from the first row
			const headers: string[] = [];
			worksheet.getRow(1).eachCell((cell, colNumber) => {
				headers[colNumber - 1] = cell.value?.toString() || `Column ${colNumber}`;
			});

			// Get data from rows
			worksheet.eachRow((row, rowNumber) => {
				if (rowNumber === 1) return;
				const rowData: Record<string, any> = {};
				row.eachCell((cell, colNumber) => {
					const header = headers[colNumber - 1];
					rowData[header] = cell.value;
				});
				jsonData.push(rowData);
			});

			setParsedData(jsonData);
			setPreviewData(previewRows(jsonData));
			setFileHeaders(headers);

			// Attempt auto-mapping based on header names
			performAutoMapping(headers);

			setShowPreview(true);
			setCurrentStep("preview");
		} catch (error) {
			console.error("Error parsing Excel file:", error);
			toast({
				title: "Error",
				description: "Failed to parse Excel file",
				variant: "destructive",
			});
		}
	};

	// Attempt to automatically map fields based on header similarity
	const performAutoMapping = (headers: string[]) => {
		const newMappings: FieldMappingState = {};

		targetFields.forEach((targetField) => {
			// Try to find an exact or close match
			const exactMatch = headers.find((h) => h.toLowerCase() === targetField.name.toLowerCase() || h.toLowerCase() === targetField.label.toLowerCase());

			if (exactMatch) {
				newMappings[targetField.name] = { type: "column", value: exactMatch };
			} else {
				// Try to find a partial match
				const partialMatch = headers.find(
					(h) =>
						h.toLowerCase().includes(targetField.name.toLowerCase()) ||
						targetField.name.toLowerCase().includes(h.toLowerCase()) ||
						h.toLowerCase().includes(targetField.label.toLowerCase()) ||
						targetField.label.toLowerCase().includes(h.toLowerCase())
				);

				if (partialMatch) {
					newMappings[targetField.name] = { type: "column", value: partialMatch };
				}
			}
		});

		setFieldMappings(newMappings);
	};

	const handleFieldMapping = (targetField: string, option: FieldMappingOption) => {
		setFieldMappings((prev) => ({
			...prev,
			[targetField]: option,
		}));
	};

	const proceedToMapping = () => {
		setCurrentStep("mapping");
	};

	const validateAndProceed = () => {
		// Check if required fields are mapped or have constant values
		const missingRequiredFields = targetFields.filter(
			(field) => field.required && (!fieldMappings[field.name] || (fieldMappings[field.name].type === "column" && !fieldMappings[field.name].value))
		);

		if (missingRequiredFields.length > 0) {
			toast({
				title: "Mapping Error",
				description: `Please map required fields: ${missingRequiredFields.map((f) => f.label).join(", ")}`,
				variant: "destructive",
			});
			return;
		}

		// Validate and transform the data
		const errors: { index: number; errors: string[] }[] = [];
		const transformedData = parsedData
			.map((row, index) => {
				try {
					const mappedRow: Record<string, any> = {};

					// Apply field mappings - handle both column mappings and constant values
					Object.entries(fieldMappings).forEach(([targetField, mappingOption]) => {
						if (mappingOption.type === "column") {
							// It's a column mapping
							const sourceField = mappingOption.value.toString();
							if (sourceField && row[sourceField] !== undefined) {
								// Special handling for duration if it's in hours
								if (targetField === "duration" && durationUnit === "hours") {
									const hourValue = parseFloat(row[sourceField]);
									// Convert hours to minutes (multiply by 60)
									mappedRow[targetField] = Math.round(hourValue * 60);
								} else {
									mappedRow[targetField] = row[sourceField];
								}
							}
						} else if (mappingOption.type === "constant") {
							// It's a constant value
							mappedRow[targetField] = mappingOption.value;
						}
					});

					// Derive date from startTime if available and date is not mapped
					if (!mappedRow.date && mappedRow.startTime) {
						const startDate = parseDateTime(mappedRow.startTime);
						if (startDate) {
							// Set the date field to midnight of the same day
							mappedRow.date = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()).toISOString();
						}
					}

					// If both startTime and endTime exist, calculate duration if not provided
					if (!mappedRow.duration && mappedRow.startTime && mappedRow.endTime) {
						const startTime = parseDateTime(mappedRow.startTime);
						const endTime = parseDateTime(mappedRow.endTime);

						if (startTime && endTime) {
							// Calculate duration in minutes
							const durationMs = endTime.getTime() - startTime.getTime();
							mappedRow.duration = Math.round(durationMs / (1000 * 60)); // Convert ms to minutes
						}
					}

					// Try to validate with zod schema
					const validatedRow = timeLogSchema.parse(mappedRow);
					return validatedRow;
				} catch (error) {
					if (error instanceof z.ZodError) {
						errors.push({
							index: index + 1,
							errors: error.errors.map((err) => err.message),
						});
					} else if (error instanceof Error) {
						errors.push({
							index: index + 1,
							errors: [error.message],
						});
					}
					return null;
				}
			})
			.filter(Boolean);

		setValidationErrors(errors);
		setMappedData(transformedData);

		if (errors.length > 0) {
			setCurrentStep("validation");
			toast({
				title: "Validation Errors",
				description: `Found ${errors.length} rows with validation errors`,
				variant: "destructive",
			});
		} else {
			// Check for new entities before proceeding
			const hasNewEntities = detectNewEntities();
			if (!hasNewEntities) {
				// If no new entities, proceed to upload
				handleUpload(transformedData);
			}
			// Otherwise, the createNewEntities function will be called from the dialog
		}
	};

	const detectNewEntities = () => {
		const newProjects: { name: string; description?: string }[] = [];
		const newCustomers: { name: string; email: string }[] = [];
		const newTasks: { name: string; description?: string }[] = [];

		// Go through the mappedData and check for new entities
		mappedData.forEach((entry) => {
			// Check for new projects
			if (entry.projectId && !projects.find((p) => p.id === entry.projectId)) {
				const projectName = entry.projectName || `Project ${entry.projectId}`;
				if (!newProjects.find((p) => p.name === projectName)) {
					newProjects.push({ name: projectName });
				}
			}

			if (entry.taskId && !tasks.find((t) => t.id === entry.taskId)) {
				const taskName = entry.taskName || `Task ${entry.taskId}`;
				if (!newTasks.find((t) => t.name === taskName)) {
					newTasks.push({ name: taskName });
				}
			}

			if (entry.customerId && !customers.find((c) => c.id === entry.customerId)) {
				const customerName = entry.customerName || `Customer ${entry.customerId}`;
				const customerEmail = entry.customerEmail || "NA";
				if (!newCustomers.find((c) => c.name === customerName)) {
					newCustomers.push({ name: customerName, email: customerEmail });
				}
			}

			// Similar checks for customers and tasks
			// ...
		});

		setNewEntities({ projects: newProjects, customers: newCustomers, tasks: newTasks });

		// If there are new entities, show dialog
		if (newProjects.length > 0 || newCustomers.length > 0 || newTasks.length > 0) {
			setShowNewEntitiesDialog(true);
			return true;
		}

		return false;
	};

	const createNewEntities = async () => {
		// Create new customers first
		for (const customer of newEntities.customers) {
			try {
				const response = await axios.post("/api/customers", customer);
				// Update local customers state with the new customer
				setCustomers((prev) => [...prev, response.data]);
			} catch (error) {
				console.error("Error creating customer:", error);
			}
		}

		// Create new projects next
		for (const project of newEntities.projects) {
			try {
				const response = await axios.post("/api/projects", project);
				// Update local projects state with the new project
				setProjects((prev) => [...prev, response.data]);
			} catch (error) {
				console.error("Error creating project:", error);
			}
		}

		// Create new tasks last
		for (const task of newEntities.tasks) {
			try {
				const response = await axios.post("/api/tasks", task);
				// Update local tasks state with the new task
				setTasks((prev) => [...prev, response.data]);
			} catch (error) {
				console.error("Error creating task:", error);
			}
		}

		setShowNewEntitiesDialog(false);
	};

	const handleUpload = async (dataToUpload = mappedData) => {
		if (!dataToUpload.length) {
			toast({
				title: "Error",
				description: "No valid data to upload",
				variant: "destructive",
			});
			return;
		}

		setIsUploading(true);
		try {
			// Upload each entry
			for (const entry of dataToUpload) {
				await createTimeEntryMutation.mutateAsync(entry);
			}

			setUploadStatus({
				success: true,
				message: `Successfully imported ${dataToUpload.length} time entries`,
			});

			// Reset form if successful
			setFile(null);
			setParsedData([]);
			setPreviewData([]);
			setShowPreview(false);
			setFieldMappings({});
			setValidationErrors([]);
			setMappedData([]);
			setCurrentStep("preview");
		} catch (error) {
			console.error("Upload error:", error);
			setUploadStatus({
				success: false,
				message: error instanceof Error ? error.message : "Failed to upload file",
			});
		} finally {
			setIsUploading(false);
		}
	};

	const closePreview = () => {
		setShowPreview(false);
		setFile(null);
		setParsedData([]);
		setPreviewData([]);
		setFieldMappings({});
		setValidationErrors([]);
		setMappedData([]);
		setCurrentStep("preview");
	};

	const getTabTitle = (step: "preview" | "mapping" | "validation") => {
		switch (step) {
			case "preview":
				return "1. Preview Data";
			case "mapping":
				return "2. Map Fields";
			case "validation":
				return "3. Validation";
			default:
				return "";
		}
	};

	const parseDateTime = (dateTimeStr: string): Date | null => {
		try {
			// Try standard date parsing first
			const date = new Date(dateTimeStr);
			if (!isNaN(date.getTime())) {
				return date;
			}

			// If that fails, try custom parsing for "2020-11-19 4:21 pm" format
			const match = /(\d{4}-\d{2}-\d{2})\s+(\d{1,2}):(\d{2})\s+(am|pm)/i.exec(dateTimeStr);
			if (match) {
				const [_, datePart, hours, minutes, ampm] = match;
				let hour = parseInt(hours);

				// Convert 12-hour to 24-hour format
				if (ampm.toLowerCase() === "pm" && hour < 12) hour += 12;
				if (ampm.toLowerCase() === "am" && hour === 12) hour = 0;

				// Create the date object
				const dateObj = new Date(`${datePart}T${hour.toString().padStart(2, "0")}:${minutes}:00`);
				return dateObj;
			}

			return null;
		} catch (error) {
			console.error("Error parsing date-time:", error);
			return null;
		}
	};

	const renderFieldMappingUI = () => {
		return (
			<div className="space-y-4">
				<div className="text-sm text-muted-foreground mb-2">Map each required field to a column from your file or select a database value</div>

				{targetFields.map((field) => (
					<div key={field.name} className="flex items-center gap-2">
						<div className="w-1/3">
							<div className="flex items-center">
								<span className="mr-1 text-sm font-medium">{field.label}</span>
								{field.required && (
									<Badge variant="outline" className="ml-1 text-xs">
										Required
									</Badge>
								)}
							</div>
						</div>
						<div className="w-2/3">
							<Tabs defaultValue="column" className="w-full">
								<TabsList className="grid w-full grid-cols-2">
									<TabsTrigger value="column">Map to Column</TabsTrigger>
									<TabsTrigger value="db">Use DB Value</TabsTrigger>
								</TabsList>

								<TabsContent value="column">
									<Select
										value={fieldMappings[field.name]?.type === "column" ? fieldMappings[field.name].value.toString() : undefined}
										onValueChange={(value) => handleFieldMapping(field.name, { type: "column", value })}>
										<SelectTrigger className="w-full">
											<SelectValue placeholder="Select a column" />
										</SelectTrigger>
										<SelectContent>
											{/* Change this empty string value to something else */}
											<SelectItem value="not_mapped">-- Not mapped --</SelectItem>
											{fileHeaders.map((header) => (
												<SelectItem key={header} value={header}>
													{header}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</TabsContent>

								<TabsContent value="db">
									{field.type === "select" && field.options ? (
										<Select
											value={fieldMappings[field.name]?.type === "constant" ? fieldMappings[field.name].value.toString() : undefined}
											onValueChange={(value) => handleFieldMapping(field.name, { type: "constant", value: parseInt(value) || value })}>
											<SelectTrigger className="w-full">
												<SelectValue placeholder="Select a value" />
											</SelectTrigger>
											<SelectContent>
												{field.options.map((option) => (
													<SelectItem key={option.value.toString()} value={option.value.toString()}>
														{option.label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									) : (
										<input
											type={field.type === "number" ? "number" : "text"}
											className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
											value={fieldMappings[field.name]?.type === "constant" ? fieldMappings[field.name].value.toString() : ""}
											onChange={(e) => {
												const value = field.type === "number" ? parseFloat(e.target.value) : e.target.value;
												handleFieldMapping(field.name, { type: "constant", value });
											}}
											placeholder={`Enter a ${field.type} value`}
										/>
									)}
								</TabsContent>
							</Tabs>
						</div>
					</div>
				))}
				<div className="mt-6 pt-4 border-t">
					<div className="font-medium mb-2">Duration Settings</div>
					<div className="flex items-center gap-2">
						<div className="w-1/3">
							<span className="text-sm font-medium">Duration Unit</span>
						</div>
						<div className="w-2/3">
							<Select value={durationUnit} onValueChange={(value: "hours" | "minutes") => setDurationUnit(value)}>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="Select duration unit" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="minutes">Minutes</SelectItem>
									<SelectItem value="hours">Hours</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>
				</div>
			</div>
		);
	};

	const renderValidationUI = () => {
		return (
			<div className="space-y-4">
				{validationErrors.length > 0 ? (
					<>
						<div className="text-sm text-red-500 mb-2">Found {validationErrors.length} rows with validation errors</div>
						<div className="max-h-80 overflow-y-auto border rounded-md p-4">
							{validationErrors.map((error, index) => (
								<div key={index} className="mb-4 pb-4 border-b last:border-0">
									<div className="font-medium">Row {error.index}</div>
									<ul className="list-disc pl-5 mt-2">
										{error.errors.map((err, i) => (
											<li key={i} className="text-sm text-red-500">
												{err}
											</li>
										))}
									</ul>
								</div>
							))}
						</div>
						<div className="text-sm text-muted-foreground">Fix the errors in your file and upload again, or proceed with only the valid rows.</div>
					</>
				) : (
					<div className="text-sm text-green-500 mb-2">All rows validated successfully!</div>
				)}
			</div>
		);
	};

	const renderNewEntitiesDialog = () => {
		return (
			<AlertDialog open={showNewEntitiesDialog} onOpenChange={setShowNewEntitiesDialog}>
				<AlertDialogContent>
					<AlertDialogTitle>New Entities Detected</AlertDialogTitle>
					<AlertDialogDescription>
						The following new entities were detected in your import file and will be created:
						{newEntities.projects.length > 0 && (
							<div className="mt-4">
								<h3 className="font-semibold">Projects ({newEntities.projects.length})</h3>
								<ul className="list-disc pl-5">
									{newEntities.projects.map((project, index) => (
										<li key={index}>{project.name}</li>
									))}
								</ul>
							</div>
						)}
						{/* Similar sections for customers and tasks */}
					</AlertDialogDescription>
					<div className="flex justify-end gap-2 mt-4">
						<Button variant="outline" onClick={() => setShowNewEntitiesDialog(false)}>
							Cancel
						</Button>
						<Button
							onClick={async () => {
								await createNewEntities();
								handleUpload(mappedData);
							}}>
							Create & Continue
						</Button>
					</div>
				</AlertDialogContent>
			</AlertDialog>
		);
	};

	return (
		<>
			<Popover open={showPreview} onOpenChange={setShowPreview}>
				<PopoverTrigger asChild>
					<Button size="sm" variant="outline" className="flex items-center gap-2">
						<Upload size={16} />
						Import Time Entries
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-auto p-0" align="center">
					<Card className="w-[700px] max-w-full">
						<CardHeader>
							<CardTitle className="flex justify-between items-center">
								<div className="flex items-center gap-2">
									<FileText className="h-5 w-5 text-muted-foreground" />
									<span>{file?.name || "Import Time Entries"}</span>
								</div>
								<Button variant="ghost" size="sm" onClick={closePreview} className="h-8 w-8 p-0">
									<X className="h-4 w-4" />
								</Button>
							</CardTitle>
						</CardHeader>

						<Tabs value={currentStep} className="w-full">
							<TabsList className="w-full">
								<TabsTrigger value="preview" className="flex-1" disabled={currentStep !== "preview"}>
									{getTabTitle("preview")}
								</TabsTrigger>
								<TabsTrigger value="mapping" className="flex-1" disabled={currentStep !== "mapping" && currentStep !== "validation"}>
									{getTabTitle("mapping")}
								</TabsTrigger>
								<TabsTrigger value="validation" className="flex-1" disabled={currentStep !== "validation"}>
									{getTabTitle("validation")}
								</TabsTrigger>
							</TabsList>

							<TabsContent value="preview" className="p-4">
								{!file ? (
									<div className="flex flex-col items-center justify-center py-10">
										<input type="file" accept=".csv,.xlsx,.xls" onChange={handleFileSelect} className="hidden" id="file-input" />
										<label
											htmlFor="file-input"
											className="flex flex-col items-center gap-2 p-8 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50">
											<Upload className="h-10 w-10 text-muted-foreground" />
											<p className="text-sm text-muted-foreground">Click to select a CSV or Excel file</p>
										</label>
									</div>
								) : (
									<div className="space-y-4">
										{previewData.length > 0 && Object.keys(previewData[0]).length > 0 ? (
											<div className="overflow-x-auto">
												<table className="w-full">
													<thead className="bg-muted/50">
														<tr>
															{Object.keys(previewData[0]).map((header, i) => (
																<th key={i} className="px-3 py-2 text-sm text-left font-medium">
																	{header}
																</th>
															))}
														</tr>
													</thead>
													<tbody>
														{previewData.map((row, rowIndex) => (
															<tr key={rowIndex} className="border-b hover:bg-muted/20">
																{Object.values(row).map((cell: any, cellIndex) => (
																	<td key={cellIndex} className="px-3 py-2 text-sm truncate max-w-[200px]">
																		{cell?.toString() || ""}
																	</td>
																))}
															</tr>
														))}
													</tbody>
												</table>
											</div>
										) : (
											<div className="py-4 text-center text-muted-foreground">No data found in file</div>
										)}
									</div>
								)}
							</TabsContent>

							<TabsContent value="mapping" className="p-4">
								{renderFieldMappingUI()}
							</TabsContent>

							<TabsContent value="validation" className="p-4">
								{renderValidationUI()}
							</TabsContent>
						</Tabs>

						<CardFooter className="flex justify-between border-t p-4">
							<div className="text-sm text-muted-foreground">{parsedData.length > 0 && `${parsedData.length} rows found`}</div>
							<div className="flex gap-2">
								<Button variant="outline" size="sm" onClick={closePreview}>
									Cancel
								</Button>

								{currentStep === "preview" && (
									<Button variant="default" size="sm" onClick={proceedToMapping} disabled={previewData.length === 0}>
										Next: Map Fields
									</Button>
								)}

								{currentStep === "mapping" && (
									<Button variant="default" size="sm" onClick={validateAndProceed} disabled={isUploading}>
										Validate & Import
									</Button>
								)}

								{currentStep === "validation" && (
									<Button variant="default" size="sm" onClick={() => handleUpload()} disabled={isUploading || mappedData.length === 0}>
										{isUploading ? "Importing..." : `Import ${mappedData.length} Entries`}
									</Button>
								)}
							</div>
						</CardFooter>
					</Card>
				</PopoverContent>
			</Popover>

			{uploadStatus && (
				<AlertDialog open={!!uploadStatus} onOpenChange={() => setUploadStatus(null)}>
					<AlertDialogContent>
						<AlertDialogTitle className="flex items-center gap-2">
							{uploadStatus.success ? (
								<>
									<Check className="h-5 w-5 text-green-500" /> Success
								</>
							) : (
								<>
									<AlertTriangle className="h-5 w-5 text-red-500" /> Error
								</>
							)}
						</AlertDialogTitle>
						<AlertDialogDescription>{uploadStatus.message}</AlertDialogDescription>
						<div className="flex justify-end mt-4">
							<Button onClick={() => setUploadStatus(null)}>Close</Button>
						</div>
					</AlertDialogContent>
				</AlertDialog>
			)}
			{renderNewEntitiesDialog()}
		</>
	);
};

export default CompactFileUploader;
