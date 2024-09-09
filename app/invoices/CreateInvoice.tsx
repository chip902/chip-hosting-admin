"use client";
import { useState } from "react";
import { Flex, Table, Button, Skeleton, AlertDialog } from "@radix-ui/themes";
import { TimeEntryData, useGetTimeEntries } from "../hooks/useGetTimeEntries";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useRouter } from "next/navigation";
import PaginationComponent from "./PaginationComponent";

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
	const timeEntries = data?.entries || [];
	const totalEntries = data?.length || 0;
	const [selectedEntries, setSelectedEntries] = useState<number[]>([]);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
			<AlertDialog.Root defaultOpen={true}>
				<AlertDialog.Content maxWidth="450px">
					<AlertDialog.Title>Database Error</AlertDialog.Title>
					<AlertDialog.Description size="2">
						The Database connection cannot be established. Check your connection and try again.
					</AlertDialog.Description>
					<Flex gap="3" mt="4" justify="end">
						<AlertDialog.Cancel>
							<Button color="red">Dismiss</Button>
						</AlertDialog.Cancel>
					</Flex>
				</AlertDialog.Content>
			</AlertDialog.Root>
		);
	}

	return (
		<Flex direction="column" gap="4">
			<Table.Root variant="surface">
				<Table.Header>
					<Table.Row>
						<Table.ColumnHeaderCell>Select</Table.ColumnHeaderCell>
						<Table.ColumnHeaderCell>Description</Table.ColumnHeaderCell>
						<Table.ColumnHeaderCell>Duration</Table.ColumnHeaderCell>
						<Table.ColumnHeaderCell>Date</Table.ColumnHeaderCell>
					</Table.Row>
				</Table.Header>

				<Table.Body>
					{timeEntries.map((entry: TimeEntryData) => (
						<Table.Row key={entry.id}>
							<Table.Cell>
								<input type="checkbox" checked={selectedEntries.includes(entry.id)} onChange={() => handleSelectEntry(entry.id)} />
							</Table.Cell>
							<Table.Cell>{entry.description}</Table.Cell>
							<Table.Cell>{entry.duration} minutes</Table.Cell>
							<Table.Cell>{new Date(entry.date).toLocaleDateString()}</Table.Cell>
						</Table.Row>
					))}
				</Table.Body>
			</Table.Root>

			<PaginationComponent currentPage={page} totalItems={totalEntries} onPageChange={setPage} pageSize={10} />

			<Button onClick={handleGenerateInvoice} disabled={mutation.status === "pending" || selectedEntries.length === 0}>
				{mutation.status === "pending" ? "Generating Invoice..." : "Generate Invoice"}
			</Button>

			{errorMessage && <div className="text-red-500 mt-2">{errorMessage}</div>}
		</Flex>
	);
};

export default CreateInvoice;
