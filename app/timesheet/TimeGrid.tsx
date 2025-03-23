"use client";
import React, { useEffect, useRef, useState } from "react";
import TimeEntryComponent from "./TimeEntry";
import TimeGridHeader from "./TimeGridHeader";
import { AlertDialog, Button, Flex } from "@radix-ui/themes";
import { useGetTimeEntries } from "../hooks/useGetTimeEntries";
import { areIntervalsOverlapping, parseISO, startOfDay, endOfDay, format, addMinutes, differenceInMinutes } from "date-fns";
import { ProcessedTimeEntry, TimeEntry } from "@/types";
import { calculateDuration, calculateLeftPosition, calculateWidth } from "@/lib/utils";

interface TimeGridProps {
	filters: {
		startDate?: Date;
		endDate?: Date;
		customerId?: number;
	};
	onTimeSlotSelect: (
		timeSlot: {
			date?: Date;
			startTime?: string;
			endTime?: string;
			duration?: number;
		} | null
	) => void;
}

// Helper function to safely parse ISO dates while handling timezone issues
const parseISOWithOffset = (dateStr: string): Date => {
	if (!dateStr) return new Date();

	try {
		// Parse the ISO string
		// We'll explicitly create a date that maintains the hours as specified in the ISO
		// rather than converting to local time

		// For dates like: "2025-03-14T09:00:00Z"
		// We want to make sure we use 09:00 as the hour, not have it shifted by timezone

		// Parse the hour and minute directly from the string
		const matches = dateStr.match(/T(\d{2}):(\d{2})/);
		if (!matches) return new Date(dateStr);

		const hour = parseInt(matches[1], 10);
		const minute = parseInt(matches[2], 10);

		// Get the date part and create a new date at midnight local time
		const datePart = dateStr.split("T")[0];
		const dateAtMidnight = new Date(`${datePart}T00:00:00`);

		// Then set the specific hour and minute that was in the ISO string
		dateAtMidnight.setHours(hour, minute, 0, 0);

		return dateAtMidnight;
	} catch (error) {
		console.error("Error parsing ISO date:", error);
		return new Date();
	}
};

const transformToTimeEntry = (entry: any): ProcessedTimeEntry => {
	// Parse date and time correctly, preserving the original hours from ISO
	const startDate = parseISOWithOffset(entry.startTime);
	let endDate: Date;

	if (entry.endTime) {
		endDate = parseISOWithOffset(entry.endTime);
	} else if (entry.duration) {
		// If no end time but duration exists, calculate end time
		const durationMs = entry.duration * 60 * 1000;
		endDate = new Date(startDate.getTime() + durationMs);
	} else {
		// Default to 1 hour if neither is available
		endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
	}

	return {
		id: entry.id,
		userId: entry.userId || (entry.user?.id ?? 1),
		date: entry.date,
		startTime: entry.startTime,
		endTime: entry.endTime || endDate.toISOString(),
		customer: entry.customer || {},
		project: entry.project || {},
		task: entry.task || {},
		isInvoiced: entry.isInvoiced ?? false,
		isBillable: entry.isBillable ?? true,
		color: entry.color || "#4893FF",
		name: entry.name || entry.task?.name || "Task",
		customerName: entry.customerName || entry.customer?.name || "Unknown Client",
		projectName: entry.projectName || entry.project?.name || "Unknown Project",
		taskName: entry.taskName || entry.task?.name || "Unknown Task",
		width: entry.width || calculateWidth(entry),
		left: entry.left || calculateLeftPosition(entry),
		startSlot: 0, // Will be calculated in processOverlappingEntries
		endSlot: 0, // Will be calculated in processOverlappingEntries
		duration: entry.duration || 60, // Default to 1 hour if missing
		description: entry.description || "",
	};
};

interface OverlappingEntry extends ProcessedTimeEntry {
	width: number;
	left: number;
	startSlot: number;
	endSlot: number;
	date: Date;
}

const processOverlappingEntries = (entries: ProcessedTimeEntry[], day: Date): OverlappingEntry[] => {
	const dayStart = startOfDay(day);
	const dayEnd = endOfDay(day);

	// Filter entries for this specific day based on date
	const dailyEntries = entries.filter((entry) => {
		// Parse the date from entry.date
		const entryDate = new Date(entry.date);
		const entryDay = startOfDay(entryDate);
		const currentDay = startOfDay(day);

		// Compare by date string to avoid time zone issues
		return entryDay.toDateString() === currentDay.toDateString();
	});

	// Sort entries by start time
	const sortedEntries = [...dailyEntries].sort((a, b) => {
		const aStart = parseISOWithOffset(a.startTime).getTime();
		const bStart = parseISOWithOffset(b.startTime).getTime();
		return aStart - bStart;
	});

	// Process for overlaps
	return sortedEntries.map((entry, index) => {
		// Create dates from the ISO strings
		const entryStart = parseISOWithOffset(entry.startTime);
		let entryEnd: Date;

		if (entry.endTime) {
			entryEnd = parseISOWithOffset(entry.endTime);
		} else {
			// Calculate end time from duration
			entryEnd = new Date(entryStart.getTime() + entry.duration * 60 * 1000);
		}

		// Find overlapping entries that started before this one
		const overlappingEntries = sortedEntries.slice(0, index).filter((otherEntry) => {
			const otherStart = parseISOWithOffset(otherEntry.startTime);
			let otherEnd: Date;

			if (otherEntry.endTime) {
				otherEnd = parseISOWithOffset(otherEntry.endTime);
			} else {
				otherEnd = new Date(otherStart.getTime() + otherEntry.duration * 60 * 1000);
			}

			return areIntervalsOverlapping({ start: entryStart, end: entryEnd }, { start: otherStart, end: otherEnd });
		});

		// Calculate width and position based on overlaps
		const width = 1 / (overlappingEntries.length + 1);
		const left = overlappingEntries.length * width;

		// Calculate minutes from day start for positioning
		// Here we don't use a timezone offset, we use direct hour/minute from parsed date
		const startMinutes = entryStart.getHours() * 60 + entryStart.getMinutes();
		const endMinutes = entryEnd.getHours() * 60 + entryEnd.getMinutes();

		// Ensure end slot is after start slot with a minimum duration
		const finalEndSlot = endMinutes > startMinutes ? endMinutes : startMinutes + 60; // At least 1 hour

		return {
			...entry,
			width,
			left,
			startSlot: startMinutes,
			endSlot: finalEndSlot,
			date: entryStart,
		};
	});
};

const throttle = (fn: Function, wait: number) => {
	let timeout: ReturnType<typeof setTimeout> | null = null;
	return (args: any) => {
		if (!timeout) {
			fn(args);
			timeout = setTimeout(() => {
				timeout = null;
			}, wait);
		}
	};
};

const TimeGrid = ({ filters, onTimeSlotSelect }: TimeGridProps) => {
	const container = useRef<HTMLDivElement>(null);
	const { startDate, endDate, customerId } = filters;
	const [isDragging, setIsDragging] = useState(false);
	const [dragStart, setDragStart] = useState<{ dayIndex: number; minutes: number } | null>(null);
	const [dragEnd, setDragEnd] = useState({ dayIndex: -1, minutes: -1 });

	const { data, error, isLoading } = useGetTimeEntries({
		pageSize: 100, // Increased to ensure we get all entries
		page: 1,
		startDate: startDate ? new Date(startDate) : undefined,
		endDate: endDate ? new Date(endDate) : undefined,
		customerId: customerId !== null && customerId !== undefined ? customerId : undefined,
	});

	useEffect(() => {
		if (data && data?.entries?.length > 0) {
			console.log(`Fetched ${data.entries.length} entries`);
		}
	}, [data]);

	// Scroll to current time when component loads
	useEffect(() => {
		if (!isLoading && container.current) {
			const currentHour = new Date().getHours();
			const scrollPosition = currentHour * 64; // 64px is the height of each hour slot (h-16)
			container.current.scrollTop = scrollPosition;
		}
	}, [isLoading]);

	const handleGridMouseDown = (dayIndex: number, event: React.MouseEvent<HTMLDivElement>) => {
		// Don't start drag if we clicked on a time entry or any of its controls
		if (
			(event.target as HTMLElement).closest(".time-entry") ||
			(event.target as HTMLElement).closest('[role="dialog"]') ||
			(event.target as HTMLElement).closest("button") ||
			(event.target as HTMLElement).closest("form")
		) {
			return;
		}

		// Only start drag if we clicked directly on the grid cell
		const target = event.target as HTMLElement;
		if (!target.classList.contains("grid-cell")) {
			return;
		}

		const rect = event.currentTarget.getBoundingClientRect();
		const relativeY = event.clientY - rect.top;
		let minutes = Math.floor((relativeY / rect.height) * 24 * 60);
		minutes = Math.round(minutes / 15) * 15; // Round to nearest 15 minutes

		setIsDragging(true);
		setDragStart({ dayIndex, minutes });
		setDragEnd({ dayIndex, minutes });
	};

	// Adjust delay if needed
	const throttledSetDragEnd = throttle(setDragEnd, 50);

	const handleGridMouseMove = (dayIndex: number, event: React.MouseEvent<HTMLDivElement>) => {
		if (!isDragging) return;

		const rect = event.currentTarget.getBoundingClientRect();
		const relativeY = event.clientY - rect.top;
		let minutes = Math.floor((relativeY / rect.height) * 24 * 60);
		minutes = Math.round(minutes / 15) * 15; // Round to nearest 15 minutes
		throttledSetDragEnd({ dayIndex, minutes });
	};

	const handleGridMouseUp = () => {
		if (!isDragging || !dragStart) return;

		const startDay = days[dragStart.dayIndex];
		const endDay = days[dragEnd.dayIndex];

		// If drag ends on the same day it started
		if (dragStart.dayIndex === dragEnd.dayIndex) {
			const startDateTime = addMinutes(startOfDay(startDay), dragStart.minutes);
			const endDateTime = addMinutes(startOfDay(startDay), dragEnd.minutes);

			// Make sure start time is before end time
			const [finalStartTime, finalEndTime] = startDateTime > endDateTime ? [endDateTime, startDateTime] : [startDateTime, endDateTime];

			onTimeSlotSelect({
				date: finalStartTime,
				startTime: format(finalStartTime, "HH:mm"),
				endTime: format(finalEndTime, "HH:mm"),
				duration: differenceInMinutes(finalEndTime, finalStartTime),
			});
		}

		setIsDragging(false);
		setDragStart(null);
	};

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

	const start = startDate ? new Date(startDate) : new Date();
	const days = Array.from({ length: 7 }, (_, i) => {
		const date = new Date(start);
		date.setDate(date.getDate() + i);
		return date;
	});

	const allEntries = data?.entries ? data.entries.map(transformToTimeEntry) : [];

	const DragSelection = () => {
		if (!isDragging || !dragStart || !dragEnd) return null;

		const top = (Math.min(dragStart.minutes, dragEnd.minutes) / (24 * 60)) * 100;
		const height = (Math.abs(dragEnd.minutes - dragStart.minutes) / (24 * 60)) * 100;

		return (
			<div
				className="absolute bg-blue-200 opacity-50 w-full"
				style={{
					top: `${top}%`,
					height: `${height}%`,
					zIndex: 5,
				}}
			/>
		);
	};

	return (
		<div className="relative flex flex-col h-screen bg-white dark:bg-gray-900 border rounded-lg">
			<TimeGridHeader days={days} />
			<div className="flex-1 overflow-y-auto" ref={container}>
				<div className="grid grid-cols-8">
					{/* Time labels column */}
					<div className="col-span-1">
						{[...Array(24)].map((_, hour) => (
							<div key={hour} className="h-16 border-t border-gray-200 dark:border-gray-700 flex items-center">
								<div className="sticky left-0 w-14 pr-2 text-right text-xs leading-5 text-gray-400">
									{hour % 12 === 0 ? 12 : hour % 12}
									{hour < 12 ? "AM" : "PM"}
								</div>
							</div>
						))}
					</div>

					{/* Day columns */}
					{days.map((day, dayIndex) => {
						const processedEntries = processOverlappingEntries(allEntries, day);

						return (
							<div
								key={dayIndex}
								className="col-span-1 relative border-l border-gray-200 dark:border-gray-700"
								onMouseDown={(e) => handleGridMouseDown(dayIndex, e)}
								onMouseMove={(e) => handleGridMouseMove(dayIndex, e)}
								onMouseUp={handleGridMouseUp}
								onMouseLeave={handleGridMouseUp}>
								{/* Hour grid cells */}
								{[...Array(24)].map((_, hour) => (
									<div key={hour} className="h-16 border-t border-gray-200 dark:border-gray-700 grid-cell" data-hour={hour} />
								))}

								{/* Show drag selection */}
								{isDragging && dragStart?.dayIndex === dayIndex && <DragSelection />}

								{/* Render time entries */}
								{processedEntries.map((entry) => (
									<TimeEntryComponent
										key={entry.id}
										entry={entry as unknown as TimeEntry}
										startSlot={entry.startSlot}
										endSlot={entry.endSlot}
										color={entry.color || "#4893FF"}
										width={entry.width}
										left={entry.left}
										onTimeSlotSelect={onTimeSlotSelect}
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
