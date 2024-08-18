// app/timesheet/Page.tsx
"use client";
import { useState } from "react";
import { format, isToday, startOfWeek } from "date-fns";
import { Flex, Button, Skeleton, AlertDialog } from "@radix-ui/themes";
import { useGetTimeEntries } from "../hooks/useGetTimeEntries";
import TimeToolBar from "./TimeToolBar";
import TimeGrid from "./TimeGrid";

interface Filters {
	startDate?: Date;
	endDate?: Date;
	customerId?: number;
}

interface TimeEntry {
	id: number;
	day: Date;
	startTime: number; // For simplicity, using hours as integer (e.g., 9 for 9:00 AM)
	duration: number; // In hours
}

const Page: React.FC = () => {
	const [filters, setFilters] = useState<Filters>({
		startDate: startOfWeek(new Date(), { weekStartsOn: 0 }),
		endDate: undefined,
		customerId: undefined,
	});

	const days = Array.from({ length: 7 }, (_, i) => new Date(new Date().setDate(new Date().getDate() + i)));

	const { error, isLoading } = useGetTimeEntries(filters.startDate, filters.endDate, filters.customerId);

	return (
		<Flex direction="column" gap="4">
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
					<TimeToolBar filters={filters} setFilters={setFilters} />
					<TimeGrid filters={filters} />
				</>
			)}
		</Flex>
	);
};

export default Page;
