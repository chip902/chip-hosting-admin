"use client";
import React, { useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { Spinner, Text } from "@radix-ui/themes";
import useDeleteTimeEntry from "../hooks/useDeleteTimeEntry";
import useUpdateTimeEntry from "../hooks/useUpdateTimeEntry";
import { TimeEntry, TimeEntryProps } from "@/types";

const parseISOForDisplay = (dateStr: string): string => {
	if (!dateStr) return "";

	try {
		// Extract time directly from the ISO string
		const matches = dateStr.match(/T(\d{2}):(\d{2})/);
		if (!matches) return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

		const hour = parseInt(matches[1], 10);
		const minute = matches[2];

		// Format for AM/PM display
		const hourDisplay = hour % 12 || 12; // Convert 0 to 12 for 12-hour format
		const ampm = hour >= 12 ? "PM" : "AM";

		return `${hourDisplay}:${minute} ${ampm}`;
	} catch (error) {
		console.error("Error formatting time for display:", error);
		return "";
	}
};

const TimeEntryComponent = ({ entry, startSlot, endSlot, color, left, width, onTimeSlotSelect }: TimeEntryProps) => {
	const [isOpen, setIsOpen] = useState(false);
	const [isLoading, setLoading] = useState(false);

	// Format times from entry
	const formatTime = (dateStr: string | Date) => {
		if (!dateStr) return "";
		const date = new Date(dateStr);
		return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
	};

	// Set initial form state with entry data
	const [formState, setFormState] = useState({
		duration: entry.duration?.toString() || "",
		description: entry.description || "",
		entryDate: new Date(entry.date).toISOString().split("T")[0],
		startTime: formatTime(entry.startTime).toLowerCase().replace(/\s/g, ""),
	});

	const { mutate: updateTimeEntry } = useUpdateTimeEntry();
	const { mutate: deleteTimeEntry } = useDeleteTimeEntry();

	const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		const { name, value } = e.target;
		setFormState((prevState) => ({ ...prevState, [name]: value }));
	};

	const handleUpdate = () => {
		setLoading(true);

		try {
			// Format the ISO date correctly
			const dateParts = formState.entryDate.split("-");
			const timeParts = formState.startTime.split(":");

			const isoDate = new Date(
				parseInt(dateParts[0]), // year
				parseInt(dateParts[1]) - 1, // month (0-indexed)
				parseInt(dateParts[2]), // day
				parseInt(timeParts[0]), // hour
				parseInt(timeParts[1]) // minute
			);

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
			console.error("Invalid date/time format:", error);
			setLoading(false);
		}
	};

	const handleDelete = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();

		setLoading(true);
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

	// Calculate position and height as percentages of a 24-hour day (1440 minutes)
	const calculatePosition = () => {
		// startSlot and endSlot are in minutes from start of day (0-1440)
		const top = (startSlot / 1440) * 100; // Convert to percentage
		const height = ((endSlot - startSlot) / 1440) * 100; // Height as percentage

		return {
			top: `${top}%`,
			height: `${Math.max(height, 2)}%`, // Ensure at least 2% height for visibility
		};
	};

	const { top, height } = calculatePosition();

	// Format time for display
	const startTimeFormatted = parseISOForDisplay(entry.startTime);

	// Format duration hours
	const hours = Math.floor(entry.duration / 60).toString();
	const mins = (entry.duration % 60).toString().padStart(2, "0");
	const durationFormatted = `${hours}:${mins}`;

	// Extract data from the entry
	const projectName = entry.project?.name || "";
	const taskName = entry.task?.name || "General Implementor";
	const customerName = entry.customer?.name || "";
	const description = entry.description || `${customerName} - ${taskName}`;

	return (
		<Popover.Root open={isOpen} onOpenChange={setIsOpen}>
			<Popover.Trigger asChild>
				<div
					className="absolute time-entry bg-opacity-90 text-white p-1 rounded-lg cursor-pointer overflow-hidden shadow-md"
					style={{
						top,
						height,
						left: `${left * 100}%`,
						width: `${width * 100}%`,
						backgroundColor: color,
						zIndex: 10,
					}}>
					<div className="flex flex-col h-full justify-between text-left">
						<div>
							<Text className="text-xs font-bold text-white truncate">{startTimeFormatted}</Text>
							{customerName && <Text className="text-xs text-white truncate">{customerName}</Text>}
							<Text className="text-xs text-white truncate">{projectName}</Text>
							<Text className="text-xs text-white truncate">{taskName}</Text>
						</div>
						{entry.duration > 30 && <Text className="text-xs font-semibold text-white">{durationFormatted}h</Text>}
					</div>
				</div>
			</Popover.Trigger>
			<Popover.Content className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg z-50 w-80">
				<form className="flex flex-col space-y-4" onSubmit={(e) => e.preventDefault()}>
					<div className="flex justify-between items-center mb-2">
						<h3 className="text-md font-bold text-gray-900 dark:text-gray-100">{customerName || "Unknown Client"}</h3>
						<span className="text-sm text-gray-700 dark:text-gray-300">{durationFormatted}</span>
					</div>

					<div className="flex flex-wrap gap-2 mb-2">
						{projectName && (
							<span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-800 dark:text-gray-200">{projectName}</span>
						)}
						<span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-800 dark:text-gray-200">{taskName}</span>
					</div>

					<label className="flex flex-col">
						<span className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description:</span>
						<textarea
							name="description"
							value={formState.description}
							onChange={handleFormChange}
							className="w-full h-24 px-3 py-2 mb-2 text-gray-700 dark:text-gray-300 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
							placeholder="Add description..."
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
