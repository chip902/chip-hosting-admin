"use client";
import { useState, useEffect } from "react";
import { Flex, Table, Button, Skeleton, AlertDialog, DropdownMenu } from "@radix-ui/themes";
import { TimeEntryData, useGetTimeEntries } from "../hooks/useGetTimeEntries";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useRouter } from "next/navigation";
import FilterComponent from "./FilterComponent";
import PaginationComponent from "./PaginationComponent";
import { toZonedTime, format } from "date-fns-tz";

const InvoiceGenerator = () => {
	const router = useRouter();
	const queryClient = useQueryClient();
	const [filters, setFilters] = useState<{ startDate?: string; endDate?: string; customerId?: number; isInvoiced?: boolean }>({});
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(10); // Define page size
	const parsedCustomerId = filters.customerId ? parseInt(filters.customerId as any, 10) : undefined;
	const { data, error, isLoading } = useGetTimeEntries(filters.startDate, filters.endDate, parsedCustomerId, filters.isInvoiced ?? false, page, pageSize);
	const { entries: timeEntries, totalEntries } = data || { entries: [], totalEntries: 0 };
	const [selectedEntries, setSelectedEntries] = useState<number[]>([]);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [isSelectAll, setIsSelectAll] = useState(false);

	useEffect(() => {
		const newSelectedEntries = isSelectAll ? timeEntries?.map((entry: { id: number }) => entry.id) || [] : [];
		if (selectedEntries.length !== newSelectedEntries.length) {
			setSelectedEntries(newSelectedEntries);
		}
	}, [isSelectAll, timeEntries]);

	const handleSelectEntry = (entryId: number) => {
		setSelectedEntries((prev) => (prev.includes(entryId) ? prev.filter((id) => id !== entryId) : [...prev, entryId]));
	};

	const handleSelectAll = () => {
		setIsSelectAll(!isSelectAll);
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
		<Flex direction="column" gap="4">
			<FilterComponent onApplyFilters={setFilters} />

			{isLoading ? (
				<Skeleton>
					<div className="relative w-full h-fit" />
				</Skeleton>
			) : error ? (
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
			) : (
				<>
					<Table.Root variant="surface">
						<Table.Header>
							<Table.Row>
								<Table.ColumnHeaderCell>
									<input type="checkbox" checked={isSelectAll} onChange={handleSelectAll} />
								</Table.ColumnHeaderCell>
								<Table.ColumnHeaderCell>Date</Table.ColumnHeaderCell>
								<Table.ColumnHeaderCell>Description</Table.ColumnHeaderCell>
								<Table.ColumnHeaderCell>Customer</Table.ColumnHeaderCell>
								<Table.ColumnHeaderCell>Duration</Table.ColumnHeaderCell>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{timeEntries?.map((entry: TimeEntryData) => {
								const localDate = toZonedTime(new Date(entry.date), timeZone);
								const formattedDate = format(localDate, "MM/dd/yyyy");

								return (
									<Table.Row key={entry.id}>
										<Table.Cell>
											<input type="checkbox" checked={selectedEntries.includes(entry.id)} onChange={() => handleSelectEntry(entry.id)} />
										</Table.Cell>
										<Table.Cell>{formattedDate}</Table.Cell>
										<Table.Cell>{entry.description}</Table.Cell>
										<Table.Cell>{entry.Customer.name}</Table.Cell>
										<Table.Cell>{entry.duration} minutes</Table.Cell>
									</Table.Row>
								);
							})}
						</Table.Body>
					</Table.Root>
					<div className="flex justify-between pl-5">
						<PaginationComponent totalItems={totalEntries} pageSize={pageSize} currentPage={page} onPageChange={setPage} />
						<DropdownMenu.Root>
							<DropdownMenu.Trigger>
								<Button variant="soft" size="2">
									{pageSize}
									<DropdownMenu.TriggerIcon />
								</Button>
							</DropdownMenu.Trigger>
							<DropdownMenu.Content size="2">
								<DropdownMenu.Item onSelect={() => setPageSize(10)}>10</DropdownMenu.Item>
								<DropdownMenu.Item onSelect={() => setPageSize(20)}>20</DropdownMenu.Item>
								<DropdownMenu.Item onSelect={() => setPageSize(30)}>30</DropdownMenu.Item>
								<DropdownMenu.Item onSelect={() => setPageSize(40)}>40</DropdownMenu.Item>
							</DropdownMenu.Content>
						</DropdownMenu.Root>
					</div>
				</>
			)}

			<Button onClick={handleGenerateInvoice} disabled={mutation.status === "pending" || selectedEntries.length === 0}>
				{mutation.status === "pending" ? "Generating Invoice..." : "Generate Invoice"}
			</Button>

			{errorMessage && <div className="text-red-500">{errorMessage}</div>}
		</Flex>
	);
};

export default InvoiceGenerator;
