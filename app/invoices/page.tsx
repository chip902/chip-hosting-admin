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
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

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

	// Call useGetTimeEntries with undefined filters initially to fetch all entries
	const { data, error, isLoading } = useGetTimeEntries({
		startDate: parsedStartDate,
		endDate: parsedEndDate,
		customerId: parsedCustomerId,
		invoiceStatus: filters.invoiceStatus ?? undefined, // No filter by default for invoiced status
		pageSize: pageSize,
		page: page,
		sortBy: "date",
		sortOrder: "desc",
	});

	const timeEntries = data?.entries || [];
	const transformedEntries: TimeEntryData[] = timeEntries.map((entry) => {
		const startDate = new Date(entry.date);
		const endDate = new Date(startDate.getTime() + entry.duration * 60000);
		const customerName = entry.customer.name;
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
			project: entry.project?.name || "Unknown Project",
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

	const mutation = useMutation({
		mutationFn: async () => {
			const response = await axios.post("/api/invoices", { timeEntryIds: selectedEntries });
			return response.data;
		},
		onSuccess: () => {
			setSelectedEntries([]);
			queryClient.invalidateQueries({ queryKey: ["invoices"] });
			router.push("/invoices");
			router.refresh();
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
		<div className="flex-col gap-4">
			<FilterComponent onApplyFilters={setFilters} />

			{isLoading ? (
				<Skeleton>
					<div className="relative w-full h-fit" />
				</Skeleton>
			) : error ? (
				<AlertDialog defaultOpen={true}>
					<div className="max-w-[450px]">
						<AlertDialogContent>
							<AlertDialogTitle>Database Error</AlertDialogTitle>
							<AlertDialogDescription>The Database connection cannot be established. Check your connection and try again.</AlertDialogDescription>
							<div className="gap-3 mt-4 justify-end">
								<AlertDialogCancel>
									<Button color="red">Dismiss</Button>
								</AlertDialogCancel>
							</div>
						</AlertDialogContent>
					</div>
				</AlertDialog>
			) : (
				<>
					<Table>
						<TableHeader>
							<TableRow>
								<TableCell>
									<input type="checkbox" checked={isSelectAll} onChange={handleSelectAll} />
								</TableCell>
								<TableCell>Date</TableCell>
								<TableCell>Description</TableCell>
								<TableCell>Customer</TableCell>
								<TableCell>Duration</TableCell>
							</TableRow>
						</TableHeader>
						<TableBody>
							{transformedEntries?.map((entry: TimeEntryData) => (
								<TableRow key={entry.id}>
									<TableCell>
										<input type="checkbox" checked={selectedEntries.includes(entry.id)} onChange={() => handleSelectEntry(entry.id)} />
									</TableCell>
									<TableCell>{format(new Date(entry.date), "MM/dd/yyyy")}</TableCell>
									<TableCell>{entry.description}</TableCell>
									<TableCell>{entry.customerName}</TableCell>
									<TableCell>{entry.duration} minutes</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
					<div className="flex justify-between pl-5">
						<PaginationComponent totalItems={data?.totalEntries ?? 0} pageSize={pageSize} currentPage={page} onPageChange={setPage} />
						<DropdownMenu>
							<DropdownMenuTrigger>
								<Button>
									{pageSize}
									<DropdownMenuTrigger />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent>
								<DropdownMenuItem onSelect={() => setPageSize(10)}>10</DropdownMenuItem>
								<DropdownMenuItem onSelect={() => setPageSize(20)}>20</DropdownMenuItem>
								<DropdownMenuItem onSelect={() => setPageSize(30)}>30</DropdownMenuItem>
								<DropdownMenuItem onSelect={() => setPageSize(40)}>40</DropdownMenuItem>
								<DropdownMenuItem onSelect={() => setPageSize(50)}>50</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</>
			)}

			<Button onClick={handleGenerateInvoice} disabled={mutation.status === "pending" || selectedEntries.length === 0}>
				{mutation.status === "pending" ? "Generating Invoice..." : "Generate Invoice"}
			</Button>

			{errorMessage && <div className="text-red-500">{errorMessage}</div>}
		</div>
	);
};

export default InvoiceGenerator;
