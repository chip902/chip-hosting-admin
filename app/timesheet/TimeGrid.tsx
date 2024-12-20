"use client";
import React, { useEffect, useRef } from "react";
import TimeEntryComponent from "./TimeEntry";
import TimeGridHeader from "./TimeGridHeader";
import { AlertDialog, Button, Flex, Skeleton } from "@radix-ui/themes";
import { useGetTimeEntries } from "../hooks/useGetTimeEntries";
<<<<<<< HEAD
import { areIntervalsOverlapping, differenceInMinutes, endOfDay, parseISO, startOfDay, setHours, setMinutes, setSeconds } from "date-fns";
import { ProcessedTimeEntry, TimeGridProps } from "@/types";
import { calculateWidth, calculateLeftPosition, calculateDuration } from "@/lib/utils";

// Function to convert local time string to Date object in America/New_York timezone
const localStringToDate = (localTimeString: string): Date => {
	// Remove the 'Z' suffix if present and parse as a local date
	const localDateString = localTimeString.replace("Z", "");
	const options = { timeZone: "America/New_York" };
	const formatter = new Intl.DateTimeFormat("en-US", {
		...options,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		hour12: false,
	});
	const parts = formatter.formatToParts(new Date(localDateString));

	const parsedDate = new Date(
		parseInt(parts.find((p) => p.type === "year")?.value || "0", 10),
		parseInt(parts.find((p) => p.type === "month")?.value || "0", 10) - 1, // Months are 0-based
		parseInt(parts.find((p) => p.type === "day")?.value || "0", 10),
		parseInt(parts.find((p) => p.type === "hour")?.value || "0", 10),
		parseInt(parts.find((p) => p.type === "minute")?.value || "0", 10),
		parseInt(parts.find((p) => p.type === "second")?.value || "0", 10)
	);

	return parsedDate;
};

const transformToTimeEntry = (entry: any): ProcessedTimeEntry => {
	const localStartDate = localStringToDate(entry.startTime);
	const localEndDate = localStringToDate(entry.endTime);

	// Log for debugging
	console.log(`Local Start Date: ${localStartDate.toString()}`);
	console.log(`Local End Date: ${localEndDate.toString()}`);

	return {
		id: entry.id,
		date: new Date(localStartDate), // Ensure date is a Date object
		startTime: localStartDate.toISOString(),
		endTime: localEndDate.toISOString(),
		customer: entry.Customer || {},
		project: {
			...entry.Project,
			name: entry.Project?.name || "Unknown Project",
		},
		task: {
			...entry.Task,
			name: entry.Task?.name || "Unknown Task",
		},
		isInvoiced: entry.isInvoiced ?? false,
		isBillable: entry.isBillable ?? true,
		color: entry.color || "#000000",
		name: entry.name || `${entry.Project?.name} - ${entry.Task?.name}`,
		customerName: entry.Customer?.name,
		projectName: entry.Project?.name,
		taskName: entry.Task?.name,
		width: calculateWidth(entry),
		left: calculateLeftPosition(entry),
		startSlot: differenceInMinutes(localStartDate, setHours(setMinutes(setSeconds(new Date(localStartDate), 0), 0), 0)),
		endSlot: differenceInMinutes(localEndDate, setHours(setMinutes(setSeconds(new Date(localStartDate), 0), 0), 0)),
		duration: calculateDuration(localStartDate.toISOString(), localEndDate.toISOString()), // Convert to ISO string
		description: entry.description ?? "",
	};
};
=======
import { areIntervalsOverlapping, differenceInMinutes, endOfDay, parseISO, startOfDay } from "date-fns";
import { ProcessedTimeEntry, TimeGridProps } from "@/types";
import { calculateDuration, calculateLeftPosition, calculateWidth } from "@/lib/utils";

const transformToTimeEntry = (entry: any): ProcessedTimeEntry => ({
	id: entry.id,
	date: entry.date,
	startTime: entry.startTime,
	endTime: entry.endTime,
	customer: entry.Customer || {},
	project: {
		...entry.Project,
		name: entry.Project?.name || "Unknown Project",
	},
	task: {
		...entry.Task,
		name: entry.Task?.name || "Unknown Task",
	},
	isInvoiced: entry.isInvoiced ?? false,
	isBillable: entry.isBillable ?? true,
	color: entry.color || "#000000",
	name: entry.name || `${entry.Project?.name} - ${entry.Task?.name}`,
	customerName: entry.Customer?.name,
	projectName: entry.Project?.name,
	taskName: entry.Task?.name,
	width: calculateWidth(entry),
	left: calculateLeftPosition(entry),
	startSlot: entry.startSlot,
	endSlot: entry.endSlot,
	duration: calculateDuration(entry.startTime, entry.endTime),
	description: entry.description ?? "",
});
>>>>>>> 671938d (Banking-feature (#3))

interface OverlappingEntry extends ProcessedTimeEntry {
	width: number;
	left: number;
<<<<<<< HEAD
	startSlot: number; // Ensure startSlot is a number
	endSlot: number; // Ensure endSlot is a number
=======
	startSlot: number;
	endSlot: number;
>>>>>>> 671938d (Banking-feature (#3))
	date: Date; // Ensuring date is a Date object after processing
}

const processOverlappingEntries = (entries: ProcessedTimeEntry[], day: Date): OverlappingEntry[] => {
	const dayStart = startOfDay(day);
	const dayEnd = endOfDay(day);

	// Sort entries by start time
	const sortedEntries = [...entries].sort((a, b) => {
		const aStart = parseISO(a.startTime);
		const bStart = parseISO(b.startTime);
		return aStart.getTime() - bStart.getTime();
	});

	const processedEntries = sortedEntries.map((entry, index) => {
		const entryStart = parseISO(entry.startTime);
		const entryEnd = parseISO(entry.endTime);

		// Find overlapping entries that came before this one
		const overlappingEntries = sortedEntries.slice(0, index).filter((otherEntry) => {
			const otherStart = parseISO(otherEntry.startTime);
			const otherEnd = parseISO(otherEntry.endTime);
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
			date: entryStart,
		};
	});

	return processedEntries;
};

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
		const currentMinute = new Date().getHours() * 60 + new Date().getMinutes();
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
		return <Skeleton />;
	}

	const start = startDate ? new Date(startDate) : new Date();
	const days = Array.from({ length: 7 }, (_, i) => {
		const date = new Date(start);
		date.setDate(date.getDate() + i);
		return date;
	});

	// Transform all entries once
	const allEntries = data?.entries.map(transformToTimeEntry) || [];

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
					{days.map((day, dayIndex) => {
						const dayStart = startOfDay(day);
						const dayEnd = endOfDay(day);

						// Filter entries to those occurring on this day
						const dailyEntries = allEntries.filter((entry) => {
							const entryStart = parseISO(entry.startTime);
							return entryStart >= dayStart && entryStart < dayEnd;
						});

						const processedEntries = processOverlappingEntries(dailyEntries, day);

						return (
							<div key={dayIndex} className="col-span-1 relative border-l border-gray-200 dark:border-gray-700">
								{/* Render hour grid lines */}
								{[...Array(24)].map((_, hour) => (
									<div key={hour} className="h-16 border-t border-gray-200 dark:border-gray-700"></div>
								))}

								{/* Render time entries for this day */}
								{processedEntries.map((entry) => (
									<TimeEntryComponent
										key={entry.id}
										entry={entry}
										date={entry.date}
<<<<<<< HEAD
										startSlot={entry.startSlot} // Ensure startSlot is a number
										endSlot={entry.endSlot} // Ensure endSlot is a number
=======
										startSlot={entry.startSlot}
										endSlot={entry.endSlot}
>>>>>>> 671938d (Banking-feature (#3))
										dayIndex={dayIndex}
										color={entry.color || "#000000"}
										width={entry.width}
										left={entry.left}
									/>
								))}
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
};

export default TimeGrid;
