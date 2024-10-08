"use client";
import React, { useEffect, useRef } from "react";
import TimeEntryComponent from "./TimeEntry";
import TimeGridHeader from "./TimeGridHeader";
import { AlertDialog, Button, Flex } from "@radix-ui/themes";
import { useGetTimeEntries } from "../hooks/useGetTimeEntries";
import { TimeGridProps } from "@/types";
import { format, startOfDay, differenceInMinutes, addDays, startOfWeek, isSameDay } from "date-fns";

const TimeGrid = ({ filters }: TimeGridProps) => {
	const container = useRef<HTMLDivElement>(null);
	const { startDate, endDate, customerId } = filters;

	const { data, error, isLoading } = useGetTimeEntries({
		pageSize: 50,
		page: 1,
		startDate: startDate ? new Date(startDate) : undefined,
		endDate: endDate ? new Date(endDate) : undefined,
		customerId: customerId !== null && customerId !== undefined ? customerId : undefined,
	});

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

	// Ensure we have a valid start date for the week
	const weekStart = startOfDay(startDate ? new Date(startDate) : startOfWeek(new Date()));
	// Generate an array of 7 days starting from weekStart
	const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

	console.log("Week start:", format(weekStart, "yyyy-MM-dd"));
	console.log(
		"Days in week:",
		days.map((d) => format(d, "yyyy-MM-dd"))
	);

	return (
		<div className="relative flex flex-col h-screen bg-white dark:bg-gray-900">
			<TimeGridHeader days={days} />
			<div className="flex-1 overflow-y-auto" ref={container}>
				<div className="grid grid-cols-8">
					{/* Hour Labels Column */}
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

					{/* Time Entries Columns */}
					{days.map((day, dayIndex) => {
						console.log(`Rendering column for day: ${format(day, "yyyy-MM-dd")}`);
						const dayEntries = data?.entries.filter((entry) => format(new Date(entry.date), "yyyy-MM-dd") === format(day, "yyyy-MM-dd"));
						console.log(`Entries for ${format(day, "EEE dd/MM")}: `, dayEntries);
						return (
							<div key={dayIndex} className="relative col-span-1 border-l border-gray-100 dark:border-gray-700 grid grid-rows-24">
								{[...Array(24)].map((_, hour) => (
									<div key={hour} className="relative h-16 border-t border-gray-100 dark:border-gray-700"></div>
								))}

								{/* Iterate over Time Entries */}
								{data?.entries
									.filter((entry) => {
										const entryDate = new Date(entry.date);
										const isSame = isSameDay(entryDate, day);
										console.log(
											`Entry: ${entry.description}, Date: ${format(entryDate, "yyyy-MM-dd HH:mm")}, Column Date: ${format(
												day,
												"yyyy-MM-dd"
											)}, Is Same Day: ${isSame}`
										);
										return isSame;
									})
									.map((entry) => {
										const entryDate = new Date(entry.date);
										const dayStart = startOfDay(entryDate);
										const startMinutes = differenceInMinutes(entryDate, dayStart);
										const endMinutes = startMinutes + (entry.duration ?? 0);
										console.log(
											`Rendering TimeEntryComponent for ${entry.description}, startSlot: ${startMinutes}, endSlot: ${endMinutes}`
										);
										return (
											<TimeEntryComponent
												key={entry.id}
												entry={{
													...entry,
													name: entry.Customer?.name || "Unknown Customer",
													customerId: entry.customerId,
													date: entryDate,
													description: entry.description ?? "",
												}}
												startSlot={startMinutes}
												endSlot={endMinutes}
												dayIndex={dayIndex}
												color={entry.Customer?.color || "#000000"}
											/>
										);
									})}
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
};

export default TimeGrid;
