"use client";
import React, { useEffect, useRef, useState } from "react";
import TimeEntryComponent from "./TimeEntry";
import TimeGridHeader from "./TimeGridHeader";
import { useGetTimeEntries } from "../hooks/useGetTimeEntries";
import { areIntervalsOverlapping, parseISO, startOfDay, endOfDay, format, addMinutes, differenceInMinutes } from "date-fns";
import { ProcessedTimeEntry, TimeEntry } from "@/types";
import { calculateDuration, calculateLeftPosition, calculateWidth } from "@/lib/utils";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

export interface TimeGridProps {
	filters: {
		startDate?: Date;
		endDate?: Date;
		customerId?: number;
	};
	isDialogOpen?: boolean;
	onTimeSlotSelect: (
		timeSlot: {
			date?: Date;
			startTime?: string;
			endTime?: string;
			duration?: number;
		} | null
	) => void;
}

const TimeGrid = ({ filters, onTimeSlotSelect, isDialogOpen }: TimeGridProps) => {
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

	const handleTimeSlotSelect = (timeSlot: any) => {
		// Only open LogTime dialog if timeSlot has actual data
		if (timeSlot && Object.keys(timeSlot).length > 0) {
			onTimeSlotSelect(timeSlot);
		}
	};

	const handleGridMouseDown = (dayIndex: number, event: React.MouseEvent<HTMLDivElement>) => {
		if (isDialogOpen) return;
		event.stopPropagation();

		// Simplified check for time entry interaction
		if (event.target instanceof HTMLElement && (event.target.closest(".time-entry") || event.target.closest('[role="dialog"]'))) {
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
			<AlertDialog defaultOpen={true}>
				<div className="w-[450px]">
					<AlertDialogContent>
						<AlertDialogTitle>Database Error</AlertDialogTitle>
						<AlertDialogDescription>The Database connection cannot be established. Check your connection and try again.</AlertDialogDescription>
						<div className="flex gap-3 mt-4 justify-end">
							<AlertDialogCancel>
								<Button color="red">Dismiss</Button>
							</AlertDialogCancel>
						</div>
					</AlertDialogContent>
				</div>
			</AlertDialog>
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
										onTimeSlotSelect={handleTimeSlotSelect}
										isDialogOpen={isDialogOpen}
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

// Helper function to throttle high-frequency events
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

	// Filter entries for this specific day
	const dailyEntries = entries.filter((entry) => {
		const entryDate = new Date(entry.date);
		const entryDay = startOfDay(entryDate);
		const currentDay = startOfDay(day);
		return entryDay.toDateString() === currentDay.toDateString();
	});

	if (dailyEntries.length === 0) return [];

	// Sort entries by duration (longest first) and then by start time
	const sortedEntries = [...dailyEntries].sort((a, b) => {
		// Sort by duration first (longest first)
		const durationDiff = (b.duration || 0) - (a.duration || 0);
		if (durationDiff !== 0) return durationDiff;

		// If durations are equal, sort by start time
		const aStart = parseISOWithOffset(a.startTime).getTime();
		const bStart = parseISOWithOffset(b.startTime).getTime();
		return aStart - bStart;
	});

	// Process entries
	const result: OverlappingEntry[] = [];

	sortedEntries.forEach((entry, index) => {
		const entryStart = parseISOWithOffset(entry.startTime);
		const entryEnd = entry.endTime ? parseISOWithOffset(entry.endTime) : new Date(entryStart.getTime() + entry.duration * 60 * 1000);

		// Calculate duration in minutes
		const durationMinutes = entry.duration || 60;
		// Consider an entry "short" if it's less than 4 hours
		const isShort = durationMinutes < 240;

		result.push({
			...entry,
			width: 0.95, // Full width minus margins
			left: 0.025, // Center in column
			startSlot: entryStart.getHours() * 60 + entryStart.getMinutes(),
			endSlot: entryEnd.getHours() * 60 + entryEnd.getMinutes(),
			date: entryStart,
			// Add these properties to the entry
			zIndex: isShort ? 15 : 10, // Short entries appear above longer ones
			className: isShort ? "short" : "", // Add class for short entries
		});
	});

	return result;
};

export default TimeGrid;
