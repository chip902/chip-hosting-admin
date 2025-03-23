"use client";
import React, { useEffect, useRef, useState } from "react";
import TimeEntryComponent from "./TimeEntry";
import TimeGridHeader from "./TimeGridHeader";
import { AlertDialog, Button, Flex } from "@radix-ui/themes";
import { useGetTimeEntries } from "../hooks/useGetTimeEntries";
import { areIntervalsOverlapping, differenceInMinutes, endOfDay, parseISO, startOfDay, format, addMinutes } from "date-fns";
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

const transformToTimeEntry = (entry: any): ProcessedTimeEntry => ({
	id: entry.id,
	userId: entry.id,
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

	const sortedEntries = [...entries].sort((a, b) => {
		const aStart = new Date(a.date).getTime();
		const bStart = new Date(b.date).getTime();
		return aStart - bStart;
	});

	return sortedEntries.map((entry, index) => {
		const entryStart = parseISO(entry.startTime);
		const entryEnd = parseISO(entry.endTime);

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
};

const throttle = (fn: Function, wait: number) => {
	let timeout: NodeJS.Timeout | null = null;
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
		pageSize: 50,
		page: 1,
		startDate: startDate ? new Date(startDate) : undefined,
		endDate: endDate ? new Date(endDate) : undefined,
		customerId: customerId !== null && customerId !== undefined ? customerId : undefined,
	});

	useEffect(() => {
		const currentMinute = new Date().getHours() * 60 + new Date().getMinutes();
		if (container.current) {
			container.current.scrollTop = (container.current.scrollHeight * currentMinute) / 1440;
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
		minutes = Math.round(minutes / 15) * 15;

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
		minutes = Math.round(minutes / 15) * 15;
		throttledSetDragEnd({ dayIndex, minutes });
	};

	const handleGridMouseUp = () => {
		if (!isDragging || !dragStart || !dragEnd) return;

		const startDay = days[dragStart.dayIndex];
		const startDateTime = addMinutes(startOfDay(startDay), dragStart.minutes);
		const endDateTime = addMinutes(startOfDay(startDay), dragEnd.minutes);

		const [finalStartTime, finalEndTime] = startDateTime > endDateTime ? [endDateTime, startDateTime] : [startDateTime, endDateTime];

		onTimeSlotSelect({
			date: finalStartTime,
			startTime: format(finalStartTime, "HH:mm"),
			endTime: format(finalEndTime, "HH:mm"),
			duration: differenceInMinutes(finalEndTime, finalStartTime),
		});

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

	const allEntries = data?.entries.map(transformToTimeEntry) || [];

	const DragSelection = () => {
		if (!isDragging || !dragStart || !dragEnd) return null;

		const top = (Math.min(dragStart.minutes, dragEnd.minutes) / 1440) * 100;
		const height = (Math.abs(dragEnd.minutes - dragStart.minutes) / 1440) * 100;

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
		<div className="relative flex flex-col h-screen bg-white dark:bg-gray-900">
			<TimeGridHeader days={days} />
			<div className="flex-1 overflow-y-auto" ref={container}>
				<div className="grid grid-cols-8">
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

					{days.map((day, dayIndex) => {
						const dayStart = startOfDay(day);
						const dayEnd = endOfDay(day);

						const dailyEntries = allEntries.filter((entry) => {
							const entryStart = parseISO(entry.startTime);
							return entryStart >= dayStart && entryStart < dayEnd;
						});

						const processedEntries = processOverlappingEntries(dailyEntries, day);

						return (
							<div
								key={dayIndex}
								className="col-span-1 relative border-l border-gray-200 dark:border-gray-700"
								onMouseDown={(e) => handleGridMouseDown(dayIndex, e)}
								onMouseMove={(e) => handleGridMouseMove(dayIndex, e)}
								onMouseUp={handleGridMouseUp}>
								{[...Array(24)].map((_, hour) => (
									<div key={hour} className="h-16 border-t border-gray-200 dark:border-gray-700 grid-cell" />
								))}

								{isDragging && dragStart?.dayIndex === dayIndex && <DragSelection />}

								{processedEntries.map((entry) => (
									<TimeEntryComponent
										key={entry.id}
										entry={entry as unknown as TimeEntry}
										startSlot={entry.startSlot}
										endSlot={entry.endSlot}
										color={entry.color || "#000000"}
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
