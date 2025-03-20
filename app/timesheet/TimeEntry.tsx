"use client";
import React, { useState, useEffect, useRef } from "react";
import * as Popover from "@radix-ui/react-popover";
import { Spinner, Text } from "@radix-ui/themes";
import useDeleteTimeEntry from "../hooks/useDeleteTimeEntry";
import useUpdateTimeEntry from "../hooks/useUpdateTimeEntry";
import { TimeEntry, TimeEntryProps } from "@/types";
import { addMinutes, differenceInMinutes, format, startOfDay } from "date-fns";

const TimeEntryComponent = ({ entry, startSlot, endSlot, color, left, width, onTimeSlotSelect }: TimeEntryProps) => {
	const initialPosition = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
	const [isOpen, setIsOpen] = useState(false);
	const [isLoading, setLoading] = useState(false);
	const [loader, setLoader] = useState(false);
	const [formState, setFormState] = useState({
		duration: entry.duration?.toString() || "",
		description: entry.description || "",
		entryDate: new Date(entry.date).toISOString().split("T")[0],
		startTime: entry.startTime.toString().split("T")[1].replace("Z", "") || "",
	});

	const { mutate: updateTimeEntry } = useUpdateTimeEntry();
	const { mutate: deleteTimeEntry } = useDeleteTimeEntry();

	// Drag state management
	const [isDragging, setIsDragging] = useState(false);
	const [dragStart, setDragStart] = useState<{ dayIndex: number; minutes: number } | null>(null);
	const [dragEnd, setDragEnd] = useState<{ dayIndex: number; minutes: number } | null>(null);

	// Initialize time entry data
	const [timeEntry, setTimeEntry] = useState({
		id: entry.id,
		date: new Date(entry.date),
		startTime: new Date(entry.startTime),
		endTime: new Date(entry.endTime),
	});

	const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
		if (event.target === event.currentTarget && !(event.target as Element).classList.contains("resize-handle")) {
			setIsDragging(true);
			setDragStart({ dayIndex: 0, minutes: getMinutesFromTime(timeEntry.startTime) });
		}
		initialPosition.current = { x: event.clientX, y: event.clientY };
	};

	const handleMouseMove = (dayIndex: number, event: React.MouseEvent<HTMLDivElement>) => {
		if (!isDragging) return;

		const rect = event.currentTarget.getBoundingClientRect();
		const relativeY = event.clientY - rect.top;
		const minutes = Math.floor((relativeY / rect.height) * 24 * 60);

		setDragEnd({ dayIndex, minutes });
	};

	const handleMouseUp = () => {
		if (!isDragging || !dragStart || !dragEnd) return;

		const newStartTime = addMinutes(startOfDay(timeEntry.date), dragEnd.minutes);
		const newEndTime = addMinutes(newStartTime, differenceInMinutes(timeEntry.endTime, timeEntry.startTime));

		onTimeSlotSelect({
			date: timeEntry.date,
			startTime: format(newStartTime, "HH:mm"),
			endTime: format(newEndTime, "HH:mm"),
		});

		setIsDragging(false);
		setDragStart(null);
		setDragEnd(null);
	};

	const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		const { name, value } = e.target;
		setFormState((prevState) => ({ ...prevState, [name]: value }));
	};

	const handleUpdate = () => {
		setLoading(true);

		try {
			const isoDate = new Date(`${formState.entryDate}T${formState.startTime}`);
			updateTimeEntry(
				{
					id: entry.id,
					data: {
						duration: Number(formState.duration),
						description: formState.description,
						date: isoDate.toISOString(),
					},
				},
				{
					onSuccess: () => {
						setIsOpen(false);
						setLoading(false);
					},
					onError: (error) => {
						console.error("Failed to update time entry:", error);
						setLoading(false);
					},
				}
			);
		} catch (error) {
			console.error("Invalid date/time format");
			setLoading(false);
		}
	};

	const handleDelete = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();

		setLoader(true);
		deleteTimeEntry(
			{ id: entry.id },
			{
				onSuccess: () => {
					setIsOpen(false);
					setLoading(false);
				},
				onError: (error) => {
					console.error("Error deleting time entry:", error);
					setLoading(false);
				},
			}
		);
	};

	const calculatePosition = (start: number, end: number) => {
		const offsetMinutes = 300;
		const adjustedStart = start + offsetMinutes;
		const adjustedEnd = end + offsetMinutes;

		return {
			top: `${(adjustedStart / 1440) * 100}%`,
			height: `${Math.max(((adjustedEnd - adjustedStart) / 1440) * 100, 1)}%`,
		};
	};

	const getMinutesFromTime = (date: Date) => {
		return date.getHours() * 60 + date.getMinutes();
	};

	const { top, height } = calculatePosition(startSlot, endSlot);

	return (
		<Popover.Root open={isOpen} onOpenChange={setIsOpen}>
			<Popover.Trigger asChild>
				<div
					className="absolute time-entry bg-opacity-80 text-black-1 p-1 rounded-lg cursor-pointer overflow-hidden"
					style={{
						top: `${top}%`,
						height: `${height}%`,
						left: `${left * 100}%`,
						width: `${width * 100}%`,
						backgroundColor: color,
						zIndex: 10,
					}}>
					<Text className="text-sm">{(entry.duration / 60).toFixed(1)} Hours</Text>
					<br />
					<Text className="text-sm">{entry.name}</Text>
				</div>
			</Popover.Trigger>
			<Popover.Content className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg z-20 w-80">
				<form className="flex flex-col space-y-4" onSubmit={(e) => e.preventDefault()}>
					<label className="flex flex-col">
						<span className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description:</span>
						<textarea
							name="description"
							value={formState.description}
							onChange={handleFormChange}
							className="w-full h-24 px-3 py-2 mb-2 text-gray-700 dark:text-gray-300 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
						/>
					</label>
					<label className="flex flex-col">
						<span className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date:</span>
						<input
							type="date"
							name="entryDate"
							value={formState.entryDate}
							onChange={handleFormChange}
							className="w-full px-3 py-2 mb-2 text-gray-700 dark:text-gray-300 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
						/>
					</label>
					<label className="flex flex-col">
						<span className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Time:</span>
						<input
							type="time"
							name="startTime"
							value={formState.startTime}
							onChange={handleFormChange}
							className="w-full px-3 py-2 mb-2 text-gray-700 dark:text-gray-300 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
						/>
					</label>
					<label className="flex flex-col">
						<span className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Duration (minutes):</span>
						<input
							type="number"
							name="duration"
							value={formState.duration}
							onChange={handleFormChange}
							className="w-full px-3 py-2 mb-2 text-gray-700 dark:text-gray-300 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
						/>
					</label>
					<div className="flex space-x-2">
						<button
							type="button"
							onClick={handleUpdate}
							disabled={isLoading}
							className="flex-1 px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
							{isLoading ? <Spinner /> : "Update"}
						</button>
						<button
							type="button"
							onClick={handleDelete}
							disabled={isLoading}
							className="flex-1 px-4 py-2 text-white bg-red-500 rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2">
							{isLoading ? <Spinner /> : "Delete"}
						</button>
					</div>
				</form>
			</Popover.Content>
		</Popover.Root>
	);
};

export default TimeEntryComponent;
