"use client";
import { useState } from "react";
import { endOfWeek, startOfWeek } from "date-fns";
import { Flex, Skeleton, AlertDialog, Dialog, Button } from "@radix-ui/themes";
import { useGetTimeEntries } from "../hooks/useGetTimeEntries";
import TimeToolBar from "./TimeToolBar";
import TimeGrid from "./TimeGrid";
import LogTimeForm from "./LogTime";
import React from "react";

interface Filters {
	startDate?: Date;
	endDate?: Date;
	customerId?: number;
}

const Page: React.FC = () => {
	const [filters, setFilters] = useState<Filters>({
		startDate: startOfWeek(new Date(), { weekStartsOn: 0 }),
		endDate: endOfWeek(new Date(), { weekStartsOn: 0 }),
		customerId: undefined,
	});

	const [logTimeOpen, setLogTimeOpen] = useState(false);
	const [selectedTimeSlot, setSelectedTimeSlot] = useState<{
		date?: Date;
		startTime?: string;
		endTime?: string;
		duration?: number;
	} | null>(null);

	const { data, error, isLoading } = useGetTimeEntries({
		pageSize: 20,
		page: 1,
		startDate: filters.startDate ? new Date(filters.startDate) : undefined,
		endDate: filters.endDate ? new Date(filters.endDate) : undefined,
		customerId: filters.customerId !== null && filters.customerId !== undefined ? filters.customerId : undefined,
	});

	const handleTimeSlotSelect = (timeSlot: typeof selectedTimeSlot) => {
		setSelectedTimeSlot(timeSlot);
		setLogTimeOpen(true);
	};

	return (
		<Dialog.Root open={logTimeOpen} onOpenChange={setLogTimeOpen}>
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
						</AlertDialog.Content>
					</AlertDialog.Root>
				) : (
					<>
						<TimeToolBar filters={filters} setFilters={setFilters}>
							<Dialog.Trigger>
								<Button variant="solid">Log Time</Button>
							</Dialog.Trigger>
						</TimeToolBar>
						<TimeGrid filters={filters} onTimeSlotSelect={handleTimeSlotSelect} />
						<Dialog.Content>
							<Dialog.Title>Log Time</Dialog.Title>
							<LogTimeForm onClose={() => setLogTimeOpen(false)} initialValues={selectedTimeSlot || undefined} />
						</Dialog.Content>
					</>
				)}
			</Flex>
		</Dialog.Root>
	);
};

export default Page;
