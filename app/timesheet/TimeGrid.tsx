"use client";
import React, { useEffect, useRef, useState } from "react";
import TimeEntryComponent from "./TimeEntry";
import TimeGridHeader from "./TimeGridHeader";
import { useGetTimeEntries } from "../hooks/useGetTimeEntries";
import { startOfDay, endOfDay, format, addMinutes, differenceInMinutes } from "date-fns";
import { ProcessedTimeEntry, TimeEntry } from "@/types";
import { calculateLeftPosition, calculateWidth } from "@/lib/utils";
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

// Helper function to safely parse ISO dates while handling timezone issues
const parseISOWithOffset = (dateStr: string): Date => {
	if (!dateStr) return new Date();

	try {
		// Parse the ISO string
		// We'll explicitly create a date that maintains the hours as specified in the ISO
		// rather than converting to local time
		const matches = dateStr.match(/T(\d{2}):(\d{2})/);
		if (!matches) return new Date(dateStr);

		const hour = parseInt(matches[1], 10);
		const minute = parseInt(matches[2], 10);
		const datePart = dateStr.split("T")[0];
		const dateAtMidnight = new Date(`${datePart}T00:00:00`);
		dateAtMidnight.setHours(hour, minute, 0, 0);
		return dateAtMidnight;
	} catch (error) {
		console.error("Error parsing ISO date:", error);
		return new Date();
	}
};

// Transform raw entry data to ProcessedTimeEntry format
const transformToTimeEntry = (entry: any): ProcessedTimeEntry => {
	const startDate = parseISOWithOffset(entry.startTime);
	let endDate: Date;

	if (entry.endTime) {
		endDate = parseISOWithOffset(entry.endTime);
	} else if (entry.duration) {
		const durationMs = entry.duration * 60 * 1000;
		endDate = new Date(startDate.getTime() + durationMs);
	} else {
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
		startSlot: 0,
		endSlot: 0,
		duration: entry.duration || 60,
		description: entry.description || "",
	};
};

const processOverlappingEntries = (entries: ProcessedTimeEntry[], day: Date): ProcessedTimeEntry[] => {
	// Filter entries for this specific day
	const dailyEntries = entries.filter((entry) => {
		const entryDate = new Date(entry.date);
		const entryDay = startOfDay(entryDate);
		const currentDay = startOfDay(day);
		return entryDay.toDateString() === currentDay.toDateString();
	});

	if (dailyEntries.length === 0) return [];

	// Convert entries to minutes since midnight
	const entriesWithSlots = dailyEntries.map((entry, index) => {
		const entryStart = parseISOWithOffset(entry.startTime);
		const entryEnd = entry.endTime ? parseISOWithOffset(entry.endTime) : new Date(entryStart.getTime() + (entry.duration || 60) * 60 * 1000);

		const startMinutes = entryStart.getHours() * 60 + entryStart.getMinutes();
		const endMinutes = Math.min(entryEnd.getHours() * 60 + entryEnd.getMinutes(), 24 * 60);
		const durationMinutes = endMinutes - startMinutes;

		return {
			...entry,
			startMinutes,
			endMinutes,
			durationMinutes,
			originalStart: entryStart,
			left: 0,
			width: 1,
			overlapping: false,
			zIndex: 10,
			column: 0,
			originalIndex: index,
		};
	});

	// Sort entries by start time, then by end time
	entriesWithSlots.sort((a, b) => {
		const startDiff = a.startMinutes - b.startMinutes;
		if (startDiff !== 0) return startDiff;
		return a.endMinutes - b.endMinutes;
	});

	// First pass: detect overlaps
	for (let i = 0; i < entriesWithSlots.length; i++) {
		const entryA = entriesWithSlots[i];
		const overlappingEntries = [];

		for (let j = 0; j < entriesWithSlots.length; j++) {
			if (i === j) continue;

			const entryB = entriesWithSlots[j];
			const identicalTimes = entryA.startMinutes === entryB.startMinutes && entryA.endMinutes === entryB.endMinutes;
			const timeOverlap = entryA.startMinutes < entryB.endMinutes && entryA.endMinutes > entryB.startMinutes;

			if (identicalTimes || timeOverlap) {
				entryA.overlapping = true;
				entryB.overlapping = true;
				overlappingEntries.push(entryB);
			}
		}

		// Assign columns for overlapping entries
		if (entryA.overlapping) {
			const occupiedColumns = new Set<number>();
			for (const overlapEntry of overlappingEntries) {
				if (overlapEntry.column !== undefined) {
					occupiedColumns.add(overlapEntry.column);
				}
			}

			let column = 0;
			while (occupiedColumns.has(column)) {
				column++;
			}
			entryA.column = column;
		}
	}

	// Group overlapping entries
	const overlapGroups: any[] = [];
	for (const entry of entriesWithSlots) {
		if (!entry.overlapping) continue;

		let found = false;
		for (const group of overlapGroups) {
			if (entry.startMinutes < group.endTime && entry.endMinutes > group.startTime) {
				group.entries.push(entry);
				group.startTime = Math.min(group.startTime, entry.startMinutes);
				group.endTime = Math.max(group.endTime, entry.endMinutes);
				found = true;
				break;
			}
		}

		if (!found) {
			overlapGroups.push({
				startTime: entry.startMinutes,
				endTime: entry.endMinutes,
				entries: [entry],
			});
		}
	}

	// Merge overlapping groups
	const mergedGroups = [...overlapGroups];
	let didMerge = true;

	while (didMerge) {
		didMerge = false;
		for (let i = 0; i < mergedGroups.length; i++) {
			for (let j = i + 1; j < mergedGroups.length; j++) {
				const groupA = mergedGroups[i];
				const groupB = mergedGroups[j];

				if (groupA.startTime < groupB.endTime && groupA.endTime > groupB.startTime) {
					groupA.startTime = Math.min(groupA.startTime, groupB.startTime);
					groupA.endTime = Math.max(groupA.endTime, groupB.endTime);

					for (const entry of groupB.entries) {
						if (!groupA.entries.includes(entry)) {
							groupA.entries.push(entry);
						}
					}

					mergedGroups.splice(j, 1);
					didMerge = true;
					break;
				}
			}
			if (didMerge) break;
		}
	}

	// Calculate column counts for each group
	for (const group of mergedGroups) {
		let maxColumn = 0;
		for (const entry of group.entries) {
			maxColumn = Math.max(maxColumn, entry.column || 0);
		}
		const columnCount = maxColumn + 1;
		group.columnCount = columnCount;

		for (const entry of group.entries) {
			(entry as any).columnCount = columnCount;
		}
	}

	// Create a map to assign explicit offsets to entries with identical times
	const timeSlotMap = new Map();
	for (const entry of entriesWithSlots) {
		const timeKey = `${entry.startMinutes}-${entry.endMinutes}`;
		if (!timeSlotMap.has(timeKey)) {
			timeSlotMap.set(timeKey, {
				count: 1,
			});
		} else {
			timeSlotMap.get(timeKey).count++;
		}
	}

	// Convert to the expected output format
	return entriesWithSlots.map((entry) => {
		const durationMinutes = entry.duration || entry.durationMinutes || 60;
		const isShort = durationMinutes < 240;
		const timeKey = `${entry.startMinutes}-${entry.endMinutes}`;
		const sameTimeSlot = timeSlotMap.get(timeKey);

		let width = 1;
		let left = 0;
		let zIndex = 10;

		if (entry.overlapping) {
			const columnCount = (entry as any).columnCount || 1;
			const column = entry.column || 0;

			if (sameTimeSlot && sameTimeSlot.count > 1) {
				// Multiple entries with identical times - position them side by side
				const gap = 0.02;
				const availableWidth = 1 - gap * (sameTimeSlot.count - 1);
				width = availableWidth / sameTimeSlot.count;
				left = column * (width + gap);
			} else if (columnCount > 1) {
				// Overlapping entries with different times
				const gap = 0.02;
				const availableWidth = 1 - gap * (columnCount - 1);
				width = availableWidth / columnCount;
				left = column * (width + gap);
			}

			// Shorter durations get higher z-index
			const durationFactor = Math.max(0, 10 - Math.floor(durationMinutes / 60));
			zIndex += durationFactor;
		}

		// Ensure minimum width for visibility
		const finalWidth = Math.max(width, 0.1);
		const finalLeft = Math.min(left, 1 - finalWidth);

		if (isShort) {
			zIndex = 20;
		}

		return {
			...entry,
			width: finalWidth,
			left: finalLeft,
			startSlot: entry.startMinutes,
			endSlot: entry.endMinutes,
			date: entry.originalStart,
			zIndex,
			className: `${isShort ? "short " : ""}${entry.overlapping ? "overlapping" : ""}`,
		};
	});
};

const TimeGrid = ({ filters, onTimeSlotSelect, isDialogOpen }: TimeGridProps) => {
	const container = useRef<HTMLDivElement>(null);
	const { startDate, endDate, customerId } = filters;
	const [isDragging, setIsDragging] = useState(false);
	const [dragStart, setDragStart] = useState<{ dayIndex: number; minutes: number } | null>(null);
	const [dragEnd, setDragEnd] = useState({ dayIndex: -1, minutes: -1 });

	const { data, error, isLoading } = useGetTimeEntries({
		pageSize: 100,
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
		if (timeSlot && Object.keys(timeSlot).length > 0) {
			onTimeSlotSelect(timeSlot);
		}
	};

	const handleGridMouseDown = (dayIndex: number, event: React.MouseEvent<HTMLDivElement>) => {
		if (isDialogOpen) return;
		event.stopPropagation();

		if (event.target instanceof HTMLElement && (event.target.closest(".time-entry") || event.target.closest('[role="dialog"]'))) {
			return;
		}

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
								{processedEntries.map((entry) => {
									// Skip entries with invalid time slots
									if (entry.startSlot === null || entry.endSlot === null) {
										return null;
									}

									return (
										<TimeEntryComponent
											key={entry.id}
											entry={entry as unknown as TimeEntry}
											startSlot={entry.startSlot}
											endSlot={entry.endSlot}
											color={entry.color}
											width={entry.width}
											left={entry.left}
											onTimeSlotSelect={handleTimeSlotSelect}
											isDialogOpen={!!isDialogOpen}
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
