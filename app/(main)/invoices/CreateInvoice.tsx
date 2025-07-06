"use client";
import { useState } from "react";
import { useGetTimeEntries } from "@/app/hooks/useGetTimeEntries";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useRouter } from "next/navigation";
import PaginationComponent from "./PaginationComponent";
import { TimeEntryData } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogCancel, AlertDialogDescription, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";

interface InvoiceGeneratorProps {
	userId: number;
}
const CreateInvoice: React.FC<InvoiceGeneratorProps> = ({ userId }) => {
	const router = useRouter();
	const queryClient = useQueryClient();
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);
	const [filters, setFilters] = useState<{ customerId?: number; startDate?: string; endDate?: string; isInvoiced?: boolean }>({});
	const parsedCustomerId = filters.customerId ? parseInt(filters.customerId as any, 10) : undefined;
	const parsedStartDate = filters.startDate ? new Date(filters.startDate) : undefined;
	const parsedEndDate = filters.endDate ? new Date(filters.endDate) : undefined;
	const { data, error, isLoading } = useGetTimeEntries({
		startDate: parsedStartDate,
		endDate: parsedEndDate,
		customerId: parsedCustomerId,
		isInvoiced: filters.isInvoiced ?? false,
		pageSize: pageSize,
		page: page,
	});

	const totalEntries = data?.length || 0;
	const [selectedEntries, setSelectedEntries] = useState<number[]>([]);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const timeEntries = data?.entries || [];

	// Transform TimeEntry[] to TimeEntryData[]
	const transformedEntries: TimeEntryData[] = timeEntries.map((entry) => {
		// Adjust this transformation based on actual fields in `TimeEntry` vs `TimeEntryData`.
		// For example, if `entry` is a `TimeEntry` from Prisma:
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
			customerName,
			startTime: startDate.toISOString(),
			endTime: endDate.toISOString(),
			customer: { name: customerName, defaultRate: entry.customer.defaultRate },
			project: { name: entry.project?.name || "Unknown Project", rate: entry.project.rate },
			task: { name: entry.task?.name || "Unknown Task" },
			user: { name: userName, id: entry.user?.id || 0 },
			isClientInvoiced: entry.isInvoiced ?? false,
			description: entry.description ?? "",
		};
	});

	const handleSelectEntry = (entryId: number) => {
		setSelectedEntries((prev) => (prev.includes(entryId) ? prev.filter((id) => id !== entryId) : [...prev, entryId]));
	};

	const mutation = useMutation({
		mutationFn: async () => {
			const response = await axios.post("/api/invoices", { timeEntryIds: selectedEntries });
			return response.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["invoices"] });
			setSelectedEntries([]);
			router.push("/invoices");
			router.refresh();
		},
		onError: (error: Error) => {
			console.error("Error occurred during submission:", error);
			setErrorMessage("An unexpected error occurred");
		},
	});

	const handleGenerateInvoice = () => {
		if (selectedEntries.length === 0) {
			setErrorMessage("Please select at least one time entry to generate an invoice.");
			return;
		}
		mutation.mutate();
	};

	if (isLoading) {
		return (
			<Skeleton>
				<div className="relative w-full h-fit" />
			</Skeleton>
		);
	}

	if (error) {
		return (
			<AlertDialog defaultOpen={true}>
				<AlertDialog>
					<AlertDialogTitle>Database Error</AlertDialogTitle>
					<AlertDialogDescription>The Database connection cannot be established. Check your connection and try again.</AlertDialogDescription>
					<div className="flex gap-3 mt-4 justify-end">
						<AlertDialogCancel>
							<Button color="red">Dismiss</Button>
						</AlertDialogCancel>
					</div>
				</AlertDialog>
			</AlertDialog>
		);
	}

	return (
		<div className="flex flex-col gap-4">
			<Table>
				<TableHeader>
					<TableRow>
						<TableCell>Select</TableCell>
						<TableCell>Description</TableCell>
						<TableCell>Duration</TableCell>
						<TableCell>Date</TableCell>
					</TableRow>
				</TableHeader>

				<TableBody>
					{transformedEntries.map((entry: TimeEntryData) => (
						<TableRow key={entry.id}>
							<TableCell>
								<input type="checkbox" checked={selectedEntries.includes(entry.id)} onChange={() => handleSelectEntry(entry.id)} />
							</TableCell>
							<TableCell>{entry.description}</TableCell>
							<TableCell>{entry.duration} minutes</TableCell>
							<TableCell>{new Date(entry.date).toLocaleDateString()}</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>

			<PaginationComponent currentPage={page} totalItems={totalEntries} onPageChange={setPage} pageSize={10} />

			<Button onClick={handleGenerateInvoice} disabled={mutation.status === "pending" || selectedEntries.length === 0}>
				{mutation.status === "pending" ? "Generating Invoice..." : "Generate Invoice"}
			</Button>

			{errorMessage && <div className="text-red-500 mt-2">{errorMessage}</div>}
		</div>
	);
};

export default CreateInvoice;
