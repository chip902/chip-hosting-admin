"use client";
import React, { useEffect, useRef } from "react";
import TimeEntryComponent from "./TimeEntry";
import TimeGridHeader from "./TimeGridHeader";
import { AlertDialog, Button, Flex } from "@radix-ui/themes";
import { TimeEntryData, useGetTimeEntries } from "../hooks/useGetTimeEntries";

interface TimeGridProps {
	filters: {
		startDate?: Date;
		endDate?: Date;
		customerId?: number;
	};
}

const TimeGrid = ({ filters }: TimeGridProps) => {
	const container = useRef<HTMLDivElement>(null);
	const { startDate, endDate, customerId } = filters;
	const { data, error, isLoading } = useGetTimeEntries(startDate, endDate, customerId);

	useEffect(() => {
		// Scroll to current hour on load
		const currentMinute = new Date().getHours() * 60;
		if (container.current) {
			container.current.scrollTop = (container.current.scrollHeight * currentMinute) / 1440;
		}
	}, [isLoading]);

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

	if (isLoading) {
		return <div>Loading...</div>;
	}

	const start = startDate ? new Date(startDate) : new Date();
	const days = Array.from({ length: 7 }, (_, i) => {
		const date = new Date(start);
		date.setDate(date.getDate() + i);
		return date;
	});

	return (
		<div className="relative flex flex-col bg-white dark:bg-gray-900">
			<div className="relative">
				<div ref={container} className="flex-auto overflow-y-auto">
					<TimeGridHeader days={days} />
					<div className="grid grid-cols-8">
						<div className="col-start-1 col-end-2">
							<div className="grid grid-rows-24">
								{[...Array(24)].map((_, hour) => (
									<div key={hour} className="relative h-16 border-t border-gray-100 dark:border-gray-700">
										<div className="sticky left-0 w-14 pr-2 text-right text-xs leading-5 text-gray-400 dark:text-gray-500">
											{hour % 12 === 0 ? 12 : hour % 12}
											{hour < 12 ? "AM" : "PM"}
										</div>
									</div>
								))}
							</div>
						</div>

						{days.map((day, dayIndex) => (
							<div key={dayIndex} className="relative col-span-1 border-l border-gray-100 dark:border-gray-700 grid grid-rows-24">
								{[...Array(24)].map((_, hour) => (
									<div key={hour} className="relative h-16 border-t border-gray-100 dark:border-gray-700"></div>
								))}
								{data?.entries
									?.filter((entry: TimeEntryData) => {
										const entryDate = new Date(entry.date); // entry.date is UTC
										const dayDate = new Date(day);
										return entryDate.toDateString() === dayDate.toDateString();
									})
									.map((entry: TimeEntryData) => {
										const startDateTime = new Date(entry.date); // Assuming entry.date is UTC
										const startHour = startDateTime.getUTCHours();
										const startMinute = startDateTime.getUTCMinutes();

										const endDateTime = new Date(startDateTime.getTime() + (entry.duration ?? 0) * 60000);
										const endHour = endDateTime.getUTCHours();
										const endMinute = endDateTime.getUTCMinutes();

										// Check if Customer exists
										const customerName = entry.Customer?.name || "Unknown Customer";
										const color = entry.Customer?.color || "#000000";

										return (
											<TimeEntryComponent
												key={entry.id}
												entry={{
													...entry,
													name: customerName,
													date: new Date(entry.date),
													description: entry.description ?? "",
												}}
												startSlot={startHour * 60 + startMinute}
												endSlot={endHour * 60 + endMinute}
												dayIndex={days.findIndex((d) => d.toDateString() === startDateTime.toDateString())}
												color={color}
											/>
										);
									})}
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
};

export default TimeGrid;
