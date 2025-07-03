// app/invoices/page.tsx
"use client";
import { useState } from "react";
import { useGetTimeEntries } from "../hooks/useGetTimeEntries";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useRouter } from "next/navigation";
import FilterComponent from "./FilterComponent";
import PaginationComponent from "./PaginationComponent";
import { format } from "date-fns-tz";
import React from "react";
import { TimeEntryData } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { ChevronDown, Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import CompactFileUploader from "./CompactFileUploader";

const InvoiceGenerator = () => {
	const router = useRouter();
	const queryClient = useQueryClient();

	// Default filters are set to undefined to fetch all entries
	const [filters, setFilters] = useState<{ startDate?: string; endDate?: string; customerId?: number; invoiceStatus?: string }>({});
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(10); // Define page size
	const parsedCustomerId = filters.customerId;
	const parsedStartDate = filters.startDate ? new Date(filters.startDate) : undefined;
	const parsedEndDate = filters.endDate ? new Date(filters.endDate) : undefined;

	const { data, error, isLoading } = useGetTimeEntries({
		startDate: parsedStartDate,
		endDate: parsedEndDate,
		customerId: parsedCustomerId,
		invoiceStatus: filters.invoiceStatus,
		pageSize,
		page,
		sortBy: "date",
		sortOrder: "desc",
	});

	const timeEntries = data?.entries || [];
	const transformedEntries: TimeEntryData[] = timeEntries.map((entry) => {
		const startDate = new Date(entry.date);
		const endDate = new Date(startDate.getTime() + entry.duration * 60000);
		const customerName = entry.customer.name;
		const project = entry.project;
		const userName = entry.user ? [entry.user.firstName, entry.user.lastName].filter(Boolean).join(" ") : "No Name";
		return {
			duration: entry.duration,
			name: userName,
			start: startDate,
			end: endDate.toISOString(),
			id: entry.id,
			date: startDate.toISOString(),
			startTime: startDate.toISOString(),
			endTime: endDate.toISOString(),
			customerName,
			project: project || { name: "Unknown Project" },
			customer: { name: customerName, defaultRate: entry.customer.defaultRate },
			task: entry.task?.name || "Unknown Task",
			user: { name: userName, id: entry.user?.id || 0 },
			isClientInvoiced: entry.isInvoiced ?? false,
			description: entry.description ?? "",
		};
	});

	const [selectedEntries, setSelectedEntries] = useState<number[]>([]);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [isSelectAll, setIsSelectAll] = useState(false);
	const [isSelectAllPages, setIsSelectAllPages] = useState(false);

	const handleSelectEntry = (entryId: number) => {
		// If we're in select all pages mode, deselecting an item should exit that mode
		if (isSelectAllPages) {
			setIsSelectAllPages(false);
			// Keep all current page items selected except the one being deselected
			const currentPageIds = timeEntries.map(entry => entry.id).filter(id => id !== entryId);
			setSelectedEntries(currentPageIds);
		} else {
			setSelectedEntries((prev) => (prev.includes(entryId) ? prev.filter((id) => id !== entryId) : [...prev, entryId]));
		}
	};

	const handleSelectAll = () => {
		if (!isSelectAll && !isSelectAllPages) {
			// Nothing selected -> select current page
			const currentPageIds = timeEntries.map((entry) => entry.id);
			setSelectedEntries(currentPageIds);
			setIsSelectAll(true);
			setIsSelectAllPages(false);
		} else if (isSelectAll && !isSelectAllPages) {
			// Current page selected -> deselect all
			setSelectedEntries([]);
			setIsSelectAll(false);
			setIsSelectAllPages(false);
		} else if (isSelectAllPages) {
			// All pages selected -> deselect all
			setSelectedEntries([]);
			setIsSelectAll(false);
			setIsSelectAllPages(false);
		}
	};

	// Update isSelectAll when page changes or entries change
	React.useEffect(() => {
		if (!isSelectAllPages && selectedEntries.length > 0) {
			const currentPageIds = timeEntries.map(entry => entry.id);
			const allCurrentPageSelected = currentPageIds.every(id => selectedEntries.includes(id));
			setIsSelectAll(allCurrentPageSelected);
		}
	}, [selectedEntries, timeEntries, isSelectAllPages]);

	const handleApplyFilters = (newFilters: typeof filters) => {
		console.log("Received new filters:", newFilters); // Debug log
		console.log("Filter types:", {
			customerId: typeof newFilters.customerId,
			invoiceStatus: typeof newFilters.invoiceStatus,
			startDate: typeof newFilters.startDate,
			endDate: typeof newFilters.endDate
		});
		setFilters(newFilters);
	};

	const mutation = useMutation({
		mutationFn: async () => {
			// If all pages are selected, send filters instead of individual IDs
			const payload = isSelectAllPages
				? { 
					selectAll: true,
					filters: {
						startDate: parsedStartDate?.toISOString(),
						endDate: parsedEndDate?.toISOString(),
						customerId: parsedCustomerId,
						invoiceStatus: filters.invoiceStatus
					}
				}
				: { timeEntryIds: selectedEntries };
			
			const response = await axios.post("/api/invoices", payload);
			return response.data;
		},
		onSuccess: () => {
			setSelectedEntries([]);
			setIsSelectAll(false);
			setIsSelectAllPages(false);
			queryClient.invalidateQueries({ queryKey: ["invoices"] });
			router.push("/invoices");
		},
		onError: (error: Error) => {
			console.error("Error occurred during submission:", error);
			setErrorMessage("An unexpected error occurred");
		},
	});

	const handleGenerateInvoice = () => {
		mutation.mutate();
	};

	const timeZone = "America/New_York";

	return (
		<div className="flex flex-col space-y-6 p-6">
			{/* Header Section */}
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-semibold text-foreground">Invoice Generator</h1>
				<CompactFileUploader />
				<Button 
					onClick={handleGenerateInvoice} 
					disabled={mutation.status === "pending" || (!isSelectAllPages && selectedEntries.length === 0)} 
					className="w-[200px]"
				>
					{mutation.status === "pending" ? (
						<>
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							Generating...
						</>
					) : (
						<>
							Generate Invoice
							{isSelectAllPages && ` (${data?.totalEntries || 0})`}
							{!isSelectAllPages && selectedEntries.length > 0 && ` (${selectedEntries.length})`}
						</>
					)}
				</Button>
			</div>
			{/* Filters Section */}
			<div className="rounded-lg border bg-card">
				<FilterComponent onApplyFilters={handleApplyFilters} />
			</div>
			{/* Selection Info Banner */}
			{isSelectAllPages && (
				<div className="rounded-md bg-blue-50 p-4 text-sm text-blue-900 dark:bg-blue-900/20 dark:text-blue-100">
					<p className="font-medium">
						All {data?.totalEntries || 0} entries across all pages are selected.
						<button
							onClick={() => {
								setIsSelectAllPages(false);
								setIsSelectAll(false);
								setSelectedEntries([]);
							}}
							className="ml-2 underline hover:no-underline"
						>
							Clear selection
						</button>
					</p>
				</div>
			)}
			{!isSelectAllPages && isSelectAll && data && data.totalEntries > pageSize && (
				<div className="rounded-md bg-gray-50 p-4 text-sm text-gray-900 dark:bg-gray-900/20 dark:text-gray-100">
					<p>
						All {timeEntries.length} entries on this page are selected.
						<button
							onClick={() => setIsSelectAllPages(true)}
							className="ml-2 font-medium underline hover:no-underline"
						>
							Select all {data.totalEntries} entries across all pages
						</button>
					</p>
				</div>
			)}
			{/* Table Section */}
			{isLoading ? (
				<div className="space-y-3">
					<Skeleton className="h-[40px] w-full" />
					<Skeleton className="h-[400px] w-full" />
				</div>
			) : error ? (
				<AlertDialog defaultOpen={true}>
					<AlertDialogContent>
						<AlertDialogTitle>Database Error</AlertDialogTitle>
						<AlertDialogDescription>The Database connection cannot be established. Check your connection and try again.</AlertDialogDescription>
						<AlertDialogCancel asChild>
							<Button variant="destructive">Dismiss</Button>
						</AlertDialogCancel>
					</AlertDialogContent>
				</AlertDialog>
			) : (
				<div className="rounded-md border bg-card">
					<Table>
						<TableHeader>
							<TableRow className="hover:bg-muted/50">
								<TableCell className="w-[50px]">
									<Checkbox 
										checked={isSelectAll || isSelectAllPages} 
										onCheckedChange={handleSelectAll} 
										aria-label="Select all"
										ref={(element) => {
											if (element) {
												// Set indeterminate state when some but not all items are selected
												const currentPageIds = timeEntries.map(entry => entry.id);
												const selectedOnPage = currentPageIds.filter(id => selectedEntries.includes(id));
												element.dataset.state = isSelectAllPages ? 'checked' : 
													isSelectAll ? 'checked' : 
													selectedOnPage.length > 0 && selectedOnPage.length < currentPageIds.length ? 'indeterminate' : 
													'unchecked';
											}
										}}
									/>
								</TableCell>
								<TableCell className="font-medium">Date</TableCell>
								<TableCell className="font-medium">Description</TableCell>
								<TableCell className="font-medium">Customer</TableCell>
								<TableCell className="font-medium">Project</TableCell>
								<TableCell className="font-medium">Duration</TableCell>
							</TableRow>
						</TableHeader>
						<TableBody>
							{transformedEntries?.map((entry: TimeEntryData) => (
								<TableRow key={entry.id} className="hover:bg-muted/50">
									<TableCell>
										<Checkbox
											checked={isSelectAllPages || selectedEntries.includes(entry.id)}
											onCheckedChange={() => handleSelectEntry(entry.id)}
											aria-label={`Select entry ${entry.id}`}
										/>
									</TableCell>
									<TableCell>{format(new Date(entry.date), "MM/dd/yyyy")}</TableCell>
									<TableCell className="max-w-[300px] truncate">{entry.description}</TableCell>
									<TableCell>{entry.customerName}</TableCell>
									<TableCell>{entry.project.name}</TableCell>
									<TableCell>
										{Math.floor(entry.duration / 60)}h {entry.duration % 60}m
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
					{/* Pagination Section */}
					<div className="flex items-center justify-between border-t p-4">
						<PaginationComponent totalItems={data?.totalEntries ?? 0} pageSize={pageSize} currentPage={page} onPageChange={setPage} />
						<div className="flex items-center space-x-2">
							<span className="text-sm text-muted-foreground">Rows per page</span>
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button variant="outline" className="w-[80px]">
										{pageSize} <ChevronDown className="ml-2 h-4 w-4" />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end">
									{[10, 20, 30, 40, 50, 100].map((size) => (
										<DropdownMenuItem key={size} onClick={() => setPageSize(size)}>
											{size} rows
										</DropdownMenuItem>
									))}
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					</div>
				</div>
			)}
			{errorMessage && <div className="rounded-md bg-destructive/15 p-3 text-destructive">{errorMessage}</div>}
		</div>
	);
};

export default InvoiceGenerator;
