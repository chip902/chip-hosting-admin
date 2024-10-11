"use client";
import React, { useEffect, useRef } from "react";
import TimeEntryComponent from "./TimeEntry";
import TimeGridHeader from "./TimeGridHeader";
import { AlertDialog, Button, Flex, Skeleton } from "@radix-ui/themes";
import { useGetTimeEntries } from "../hooks/useGetTimeEntries";
import { TimeEntryData, TimeGridProps } from "@/types";
import { areIntervalsOverlapping, differenceInMinutes, endOfDay, format, isSameDay, parseISO, startOfDay } from "date-fns";

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
		return <Skeleton />;
	}

	const processOverlappingEntries = (entries: TimeEntryData[], day: Date) => {
		const dayStart = startOfDay(day);
		const dayEnd = endOfDay(day);

		// Sort entries by start time
		const sortedEntries = entries.sort((a, b) => parseISO(a.startTime || a.date).getTime() - parseISO(b.startTime || b.date).getTime());

		const processedEntries = sortedEntries.map((entry, index) => {
			const entryStart = parseISO(entry.startTime || entry.date);
			const entryEnd = entry.endTime ? parseISO(entry.endTime) : new Date(entryStart.getTime() + (entry.duration || 0) * 60000);

			const overlappingEntries = sortedEntries.slice(0, index).filter((otherEntry) => {
				const otherStart = parseISO(otherEntry.startTime || otherEntry.date);
				const otherEnd = otherEntry.endTime ? parseISO(otherEntry.endTime) : new Date(otherStart.getTime() + (otherEntry.duration || 0) * 60000);
				return areIntervalsOverlapping({ start: entryStart, end: entryEnd }, { start: otherStart, end: otherEnd });
			});

			const width = 1 / (overlappingEntries.length + 1);
			const left = overlappingEntries.length * width;

			return {
				...entry,
				width,
				left,
				startSlot: differenceInMinutes(entryStart, dayStart),
				endSlot: differenceInMinutes(entryEnd, dayStart),
			};
		});

		return processedEntries;
	};

	const start = startDate ? new Date(startDate) : new Date();
	const days = Array.from({ length: 7 }, (_, i) => {
		const date = new Date(start);
		date.setDate(date.getDate() + i);
		return date;
	});

	return (
		<div className="relative flex flex-col h-screen bg-white dark:bg-gray-900">
			<TimeGridHeader days={days} />
			<div className="flex-1 overflow-y-auto" ref={container}>
				<div className="grid grid-cols-8">
					{/* Time column */}
					<div className="col-span-1">
						{[...Array(24)].map((_, hour) => (
							<div key={hour} className="h-16 border-t border-gray-200 dark:border-gray-700">
								<div className="sticky left-0 w-14 pr-2 text-right text-xs leading-5 text-gray-400">
									{hour % 12 === 0 ? 12 : hour % 12}
									{hour < 12 ? "AM" : "PM"}
								</div>
							</div>
						))}
					</div>

					{/* Day columns */}
					{days.map((day, dayIndex) => (
						<div key={dayIndex} className="col-span-1 relative border-l border-gray-200 dark:border-gray-700">
							{/* Render hour grid lines */}
							{[...Array(24)].map((_, hour) => (
								<div key={hour} className="h-16 border-t border-gray-200 dark:border-gray-700"></div>
							))}

							{/* Render time entries */}
							{data?.entries &&
								processOverlappingEntries(
									data.entries.filter((entry: TimeEntryData) => format(parseISO(entry.date), "yyyy-MM-dd") === format(day, "yyyy-MM-dd")),
									day
								).map((entry) => (
									<TimeEntryComponent
										key={entry.id}
										entry={{
											...entry,
											name: entry.Customer?.name || "Unknown Customer",
											date: parseISO(entry.date),
										}}
										startSlot={entry.startSlot}
										endSlot={entry.endSlot}
										dayIndex={dayIndex}
										color={entry.Customer?.color || "#000000"}
										width={entry.width}
										left={entry.left}
									/>
								))}
						</div>
					))}
				</div>
			</div>
		</div>
	);
};

export default TimeGrid;
