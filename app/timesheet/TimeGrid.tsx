"use client";
import React, { useEffect, useMemo, useRef } from "react";
import TimeEntryComponent from "./TimeEntry";
import TimeGridHeader from "./TimeGridHeader";
import { AlertDialog, Button, Flex, Skeleton } from "@radix-ui/themes";
import { useGetTimeEntries } from "../hooks/useGetTimeEntries";
import { TimeEntry, TimeEntryData, TimeGridProps } from "@/types";
import { parseISO, format, differenceInMinutes, startOfDay, addMinutes, isValid, isSameDay, add, addDays } from "date-fns";

const TimeGrid = ({ filters }: TimeGridProps) => {
	const container = useRef<HTMLDivElement>(null);
	const { startDate, endDate, customerId } = filters;

	const queryParams = useMemo(
		() => ({
			pageSize: 50,
			page: 1,
			startDate,
			endDate,
			customerId: customerId !== null && customerId !== undefined ? customerId : undefined,
			sortBy: "date",
			sortOrder: "desc" as const,
		}),
		[startDate, endDate, customerId]
	);

	const { data, error, isLoading } = useGetTimeEntries(queryParams);
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

	const transformToTimeEntry = (entry: TimeEntryData): TimeEntry => {
		return {
			...entry,
			date: safeParseDate(entry.date),
			name: entry.Customer?.name || "Unknown Customer",
			Customer: {
				id: entry.customerId,
				shortName: entry.Customer?.shortName || "",
				name: entry.Customer?.name || "Unknown Customer",
				email: entry.Customer?.email || "",
				dateCreated: entry.Customer?.dateCreated || "",
				defaultRate: entry.Customer?.defaultRate || 0,
				color: entry.Customer?.color || "#000000",
				paymentTerms: entry.Customer?.paymentTerms || "",
			},
			Project: {
				id: entry.projectId,
				name: entry.Project?.name || "Unknown Project",
				customerId: entry.customerId,
				dateCreated: entry.Project?.dateCreated || "",
				rate: entry.Project?.rate || null,
				description: entry.Project?.description || "",
			},
			Task: {
				id: entry.taskId,
				name: entry.Task?.name || "Unknown Task",
				projectId: entry.projectId,
				dateCreated: entry.Task?.dateCreated || "",
				description: entry.Task?.description || "",
				rate: entry.Task?.rate || null,
			},
			startTime: entry.startTime || undefined,
			endTime: entry.endTime || undefined,
		};
	};

	const safeParseDate = (dateInput: string | Date | undefined | null): Date => {
		if (!dateInput) {
			return new Date();
		}
		if (dateInput instanceof Date) {
			return dateInput;
		}
		const parsed = parseISO(dateInput);
		if (isValid(parsed)) {
			return parsed;
		}
		return new Date();
	};

	const processOverlappingEntries = (entries: TimeEntryData[], day: Date) => {
		const sortedEntries = entries.sort((a, b) => {
			const aTime = parseISO(a.startTime || a.date);
			const bTime = parseISO(b.startTime || b.date);
			return aTime.getTime() - bTime.getTime();
		});

		const processedEntries = sortedEntries.map((entry, index) => {
			const entryStart = parseISO(entry.startTime || entry.date);
			const entryEnd = entry.endTime ? parseISO(entry.endTime) : new Date(entryStart.getTime() + (entry.duration || 0) * 60000);

			console.log("Entry:", entry.id);
			console.log("  Raw start:", entry.startTime || entry.date);
			console.log("  Parsed start:", entryStart);
			console.log("  Raw end:", entry.endTime || "calculated from duration");
			console.log("  Parsed end:", entryEnd);

			// Use getUTCHours() and getUTCMinutes() to get the correct time components
			const startMinutes = entryStart.getUTCHours() * 60 + entryStart.getUTCMinutes();
			const endMinutes = entryEnd.getUTCHours() * 60 + entryEnd.getUTCMinutes();

			console.log("  Start minutes:", startMinutes);
			console.log("  End minutes:", endMinutes);

			// Calculate overlapping entries
			const overlappingEntries = sortedEntries.slice(0, index).filter((otherEntry) => {
				const otherStart = parseISO(otherEntry.startTime || otherEntry.date);
				const otherEnd = otherEntry.endTime ? parseISO(otherEntry.endTime) : new Date(otherStart.getTime() + (otherEntry.duration || 0) * 60000);
				return (
					(otherStart <= entryStart && otherEnd > entryStart) ||
					(otherStart < entryEnd && otherEnd >= entryEnd) ||
					(otherStart >= entryStart && otherEnd <= entryEnd)
				);
			});

			const width = 1 / (overlappingEntries.length + 1);
			const left = overlappingEntries.length * width;

			return {
				...entry,
				width,
				left,
				startSlot: startMinutes,
				endSlot: endMinutes,
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
				<div className="grid grid-cols-8 h-[1440px]">
					{/* Time column */}
					<div className="col-span-1">
						{[...Array(24)].map((_, hour) => (
							<div key={hour} className="h-[60px] border-t border-gray-200 dark:border-gray-700">
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
								<div key={hour} className="h-[60px] border-t border-gray-200 dark:border-gray-700"></div>
							))}
							{/* Render time entries */}
							{data?.entries &&
								processOverlappingEntries(
									data.entries.filter((entry: TimeEntryData) => {
										const entryDate = safeParseDate(entry.date);
										return format(entryDate, "yyyy-MM-dd") === format(day, "yyyy-MM-dd");
									}),
									day
								).map((entry) => (
									<TimeEntryComponent
										key={entry.id}
										entry={transformToTimeEntry(entry)}
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
