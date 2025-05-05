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
	const parsedCustomerId = filters.customerId ? parseInt(filters.customerId as any, 10) : undefined;
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

	const handleSelectEntry = (entryId: number) => {
		setSelectedEntries((prev) => (prev.includes(entryId) ? prev.filter((id) => id !== entryId) : [...prev, entryId]));
	};

	const handleSelectAll = () => {
		if (isSelectAll) {
			setSelectedEntries([]); // Deselect all items
		} else {
			const newSelectedEntries = timeEntries.map((entry) => entry.id);
			setSelectedEntries(newSelectedEntries); // Select all items
		}
		setIsSelectAll(!isSelectAll); // Toggle select all state
	};

	const handleApplyFilters = (newFilters: typeof filters) => {
		console.log("Received new filters:", newFilters); // Debug log
		setFilters(newFilters);
	};

	const mutation = useMutation({
		mutationFn: async () => {
			const response = await axios.post("/api/invoices", { timeEntryIds: selectedEntries });
			return response.data;
		},
		onSuccess: () => {
			setSelectedEntries([]);
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
				<Button onClick={handleGenerateInvoice} disabled={mutation.status === "pending" || selectedEntries.length === 0} className="w-[200px]">
					{mutation.status === "pending" ? (
						<>
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							Generating...
						</>
					) : (
						"Generate Invoice"
					)}
				</Button>
			</div>
			{/* Filters Section */}
			<div className="rounded-lg border bg-card">
				<FilterComponent onApplyFilters={handleApplyFilters} />
			</div>
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
									<Checkbox checked={isSelectAll} onCheckedChange={handleSelectAll} aria-label="Select all" />
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
											checked={selectedEntries.includes(entry.id)}
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
									{[10, 20, 30, 40, 50].map((size) => (
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
