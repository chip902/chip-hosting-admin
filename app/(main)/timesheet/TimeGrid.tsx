"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import TimeEntryComponent from "./TimeEntrySimple";
import TimeGridHeader from "./TimeGridHeader";
import { useGetTimeEntries } from "@/app/hooks/useGetTimeEntries";

// Helper function to debounce function calls
const debounce = <F extends (...args: any[]) => any>(fn: F, delay: number) => {
	let timeoutId: ReturnType<typeof setTimeout> | null = null;

	return function (this: any, ...args: Parameters<F>) {
		if (timeoutId) {
			clearTimeout(timeoutId);
		}
		timeoutId = setTimeout(() => fn.apply(this, args), delay);
	};
};
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
		if (!entry.date) return false;
		const entryDate = new Date(entry.date);
		const entryDay = startOfDay(entryDate);
		const currentDay = startOfDay(day);
		return entryDay.toDateString() === currentDay.toDateString();
	});

	if (dailyEntries.length === 0) return [];

	// Process each entry to calculate time slots and initial metadata
	const processedEntries = dailyEntries.map((entry, index) => {
		const entryStart = entry.startTime ? parseISOWithOffset(entry.startTime) : new Date();
		const entryEnd = entry.endTime ? parseISOWithOffset(entry.endTime) : new Date(entryStart.getTime() + (entry.duration || 60) * 60 * 1000);

		const startMinutes = entryStart.getHours() * 60 + entryStart.getMinutes();
		const endMinutes = Math.min(entryEnd.getHours() * 60 + entryEnd.getMinutes(), 24 * 60);
		const durationMinutes = Math.max(0, Math.min(endMinutes - startMinutes, 24 * 60 - startMinutes));

		return {
			...entry,
			startMinutes,
			endMinutes,
			startSlot: startMinutes,
			endSlot: endMinutes,
			durationMinutes,
			originalStart: entryStart,
			left: 0,
			width: 1,
			overlapping: false,
			zIndex: 10,
			column: 0,
			columns: 1,
			originalIndex: index,
			basePriority: 0, // Will be set based on duration
		};
	});

	// Sort entries by start time, then by duration (longer first for initial processing)
	processedEntries.sort((a, b) => {
		const startDiff = a.startMinutes - b.startMinutes;
		if (startDiff !== 0) return startDiff;
		// Sort by duration descending (longer entries first)
		return (b.durationMinutes) - (a.durationMinutes);
	});

	// Find all overlapping groups
	const overlapGroups: Array<typeof processedEntries> = [];
	const processed = new Set<number>();

	for (let i = 0; i < processedEntries.length; i++) {
		if (processed.has(i)) continue;
		
		const group = [processedEntries[i]];
		processed.add(i);
		
		// Find all entries that overlap with this one
		for (let j = i + 1; j < processedEntries.length; j++) {
			if (processed.has(j)) continue;
			
			const entryA = processedEntries[i];
			const entryB = processedEntries[j];
			
			// Check if entries overlap
			const overlaps = (entryA.startMinutes < entryB.endMinutes && entryA.endMinutes > entryB.startMinutes);
			
			if (overlaps) {
				group.push(processedEntries[j]);
				processed.add(j);
			}
		}
		
		if (group.length > 1) {
			// Sort group by duration (shortest first for z-index priority)
			group.sort((a, b) => a.durationMinutes - b.durationMinutes);
			overlapGroups.push(group);
		}
	}

	// Process each overlap group
	for (const group of overlapGroups) {
		const numEntries = group.length;
		
		// Mark all as overlapping
		group.forEach(entry => {
			entry.overlapping = true;
			entry.columns = numEntries;
		});
		
		// Assign columns based on duration (shortest gets highest column for visibility)
		group.forEach((entry, idx) => {
			entry.column = idx;
		});
	}

	// Sort back to original order
	const result = [...processedEntries].sort((a, b) => a.originalIndex - b.originalIndex);

	// Calculate base priority for z-index (shorter duration = higher priority)
	const durations = result.map(e => e.durationMinutes);
	const maxDuration = Math.max(...durations);
	const minDuration = Math.min(...durations);
	const durationRange = maxDuration - minDuration || 1;

	// Calculate final positions and dimensions with improved overlap handling
	for (const entry of result) {
		// Calculate z-index based on duration (shorter entries get higher z-index)
		const durationNormalized = (entry.durationMinutes - minDuration) / durationRange;
		entry.basePriority = Math.floor((1 - durationNormalized) * 20) + 20; // Range: 20-40

		if (entry.overlapping && entry.columns && entry.columns > 1) {
			const numColumns = entry.columns;
			const columnIndex = entry.column || 0;
			
			// For all overlapping entries, use a cascading card layout
			// Shorter duration entries (lower column index) appear on top
			if (numColumns <= 2) {
				// 2 entries: side by side
				entry.width = 0.48;
				entry.left = columnIndex * 0.52;
				entry.zIndex = entry.basePriority + (numColumns - columnIndex) * 5;
			} else if (numColumns <= 3) {
				// 3 entries: distribute with slight overlap
				entry.width = 0.4;
				entry.left = columnIndex * 0.3;
				entry.zIndex = entry.basePriority + (numColumns - columnIndex) * 5;
			} else {
				// 4+ entries: cascading cards with clear visibility
				const baseWidth = 0.6;  // Make cards narrower to see more
				const cascadeOffset = 0.08; // Smaller offset for tighter stacking
				const widthReduction = 0.02;
				
				// Shortest duration (column 0) should be on top and most to the right
				// Longest duration should be on bottom and most to the left
				const reverseIndex = numColumns - 1 - columnIndex;
				
				entry.width = baseWidth - (reverseIndex * widthReduction);
				entry.left = (numColumns - 1 - reverseIndex) * cascadeOffset; // Reverse the cascade direction
				entry.isStackedEntry = true;
				entry.stackIndex = columnIndex;
				
				// Higher z-index for shorter duration entries (column 0 = shortest)
				entry.zIndex = 50 + (numColumns - columnIndex) * 20; // Much higher z-index differences
				
				// Debug logging
				console.log(`Entry ${entry.id}: duration=${entry.durationMinutes}, column=${columnIndex}, z-index=${entry.zIndex}, left=${entry.left}`);
			}
		} else {
			// Full width for non-overlapping entries
			entry.width = 1;
			entry.left = 0;
			entry.column = 0;
			entry.columns = 1;
			entry.isMainEntry = true;
			entry.zIndex = entry.basePriority;
		}

		// Ensure values are within bounds with better constraints
		entry.width = Math.max(0.25, Math.min(1, entry.width));
		entry.left = Math.max(0, Math.min(0.98 - entry.width, entry.left));
	}

	return result;
};

const TimeGrid = ({ filters, onTimeSlotSelect, isDialogOpen }: TimeGridProps) => {
	const container = useRef<HTMLDivElement>(null);
	const dragTimerRef = useRef<NodeJS.Timeout | null>(null);
	const { startDate, endDate, customerId } = filters;
	const [isDragging, setIsDragging] = useState(false);
	const [isMouseDown, setIsMouseDown] = useState(false);
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
		onTimeSlotSelect?.(timeSlot);
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

		const throttledSetDragEnd = debounce(setDragEnd, 50);
		throttledSetDragEnd({ dayIndex, minutes });
	};
	const handleGridMouseUp = (event: React.MouseEvent<HTMLDivElement>, dayIndex: number) => {
		// Check if the click was on a time entry or its children
		const target = event.target as HTMLElement;
		if (target.closest(".time-entry") || target.closest(".time-entry-actions")) {
			setIsMouseDown(false);
			setIsDragging(false);
			setDragStart(null);
			setDragEnd({ dayIndex: -1, minutes: -1 });
			return;
		}

		// Clear any pending drag start
		if (dragTimerRef.current) {
			clearTimeout(dragTimerRef.current);
			dragTimerRef.current = null;
		}

		if (!isDragging || !dragStart) {
			setIsMouseDown(false);
			setIsDragging(false);
			setDragStart(null);
			setDragEnd({ dayIndex: -1, minutes: -1 });
			return;
		}

		event.stopPropagation();
		event.preventDefault();
		setIsMouseDown(false);
		setIsDragging(false);

		// Only proceed if we have a valid drag
		if (dragEnd.dayIndex !== -1 && dragEnd.minutes !== -1) {
			const startMinutes = Math.min(dragStart.minutes, dragEnd.minutes);
			const endMinutes = Math.max(dragStart.minutes, dragEnd.minutes);

			// Require at least a 15-minute selection
			if (endMinutes - startMinutes < 15) {
				setDragStart(null);
				setDragEnd({ dayIndex: -1, minutes: -1 });
				return;
			}

			// Calculate the date for the selected day
			if (!startDate) {
				setDragStart(null);
				setDragEnd({ dayIndex: -1, minutes: -1 });
				return;
			}

			const selectedDate = new Date(startDate);
			selectedDate.setDate(selectedDate.getDate() + dayIndex);

			// Only proceed if we actually dragged a meaningful distance
			const dragDistance = Math.abs(dragEnd.minutes - dragStart.minutes);
			if (dragDistance > 5) {
				// Minimum 5 minutes drag to count as a selection
				// Format the time slot
				const timeSlot = {
					date: selectedDate,
					startTime: `${Math.floor(startMinutes / 60)
						.toString()
						.padStart(2, "0")}:${(startMinutes % 60).toString().padStart(2, "0")}`,
					endTime: `${Math.floor(endMinutes / 60)
						.toString()
						.padStart(2, "0")}:${(endMinutes % 60).toString().padStart(2, "0")}`,
					duration: endMinutes - startMinutes,
				};

				onTimeSlotSelect?.(timeSlot);
			}
		}

		setDragStart(null);
		setDragEnd({ dayIndex: -1, minutes: -1 });
	};

	// Clean up timeouts on unmount
	useEffect(() => {
		return () => {
			if (dragTimerRef.current) {
				clearTimeout(dragTimerRef.current);
			}
		};
	}, []);

	if (error) {
		return (
			<AlertDialog open={!!error}>
				<AlertDialogContent>
					<AlertDialogTitle>Database Error</AlertDialogTitle>
					<AlertDialogDescription>The Database connection cannot be established. Check your connection and try again.</AlertDialogDescription>
					<div className="flex gap-3 mt-4 justify-end">
						<AlertDialogCancel>
							<Button color="red">Dismiss</Button>
						</AlertDialogCancel>
					</div>
				</AlertDialogContent>
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
				className="absolute bg-primary/20 w-full"
				style={{
					top: `${top}%`,
					height: `${height}%`,
					zIndex: 5,
				}}
			/>
		);
	};

	return (
		<div className="relative flex flex-col h-screen bg-card border border-border rounded-lg">
			<TimeGridHeader days={days} />
			<div className="flex-1 overflow-y-auto" ref={container}>
				<div className="grid grid-cols-8">
					{/* Time labels column */}
					<div className="col-span-1">
						{[...Array(24)].map((_, hour) => (
							<div key={hour} className="h-16 border-t border-border flex items-center">
								<div className="sticky left-0 w-14 pr-2 text-right text-12 leading-5 text-muted-foreground">
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
								className="col-span-1 relative border-l border-border"
								onMouseDown={(e) => handleGridMouseDown(dayIndex, e)}
								onMouseMove={(e) => handleGridMouseMove(dayIndex, e)}
								onMouseUp={(e) => handleGridMouseUp(e, dayIndex)}
								onMouseLeave={(e) => handleGridMouseUp(e, dayIndex)}>
								{/* Hour grid cells */}
								{[...Array(24)].map((_, hour) => (
									<div key={hour} className="h-16 border-t border-border grid-cell" data-hour={hour} />
								))}

								{/* Show drag selection */}
								{isDragging && dragStart?.dayIndex === dayIndex && <DragSelection />}

								{/* Render time entries */}
								{processedEntries.map((entry) => {
									// Skip entries with invalid time slots
									if (entry.startSlot === null || entry.endSlot === null) {
										return null;
									}

									// Calculate top and height from slots (assuming 15-minute slots)
									const top = entry.startSlot * 15; // 15px per slot
									const height = (entry.endSlot - entry.startSlot) * 15;

									return (
										<TimeEntryComponent
											key={entry.id}
											entry={entry as unknown as TimeEntry}
											top={top}
											height={height}
											startSlot={entry.startSlot}
											endSlot={entry.endSlot}
											color={entry.color}
											width={entry.width}
											left={entry.left}
											onTimeSlotSelect={handleTimeSlotSelect}
											isDialogOpen={!!isDialogOpen}
											isMainEntry={entry.isMainEntry}
											isStackedEntry={entry.isStackedEntry}
											stackIndex={entry.stackIndex}
											totalStacked={entry.columns}
											calculatedZIndex={entry.zIndex || 100}
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
