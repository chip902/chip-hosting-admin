"use client";
import React, { useState, useRef, useEffect } from "react";
import * as Popover from "@radix-ui/react-popover";
import { Spinner, Text } from "@radix-ui/themes";
import useDeleteTimeEntry from "../hooks/useDeleteTimeEntry";
import useUpdateTimeEntry from "../hooks/useUpdateTimeEntry";
import { TimeEntry, TimeEntryProps } from "@/types";
import { format } from "date-fns";
import axios from "axios";

// Helper function to safely parse time from ISO string
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

/**
 * Direct position update function that bypasses the problematic PATCH method
 */
const updateEntryPosition = async (
	id: number,
	data: {
		date?: string;
		startTime?: string;
		endTime?: string;
		duration?: number;
	}
) => {
	try {
		const response = await axios.post(`/api/timelog/position/${id}`, data);
		return response.data;
	} catch (error) {
		console.error("Failed to update position:", error);
		throw error;
	}
};

const TimeEntryComponent = ({ entry, startSlot, endSlot, color, left, width, onTimeSlotSelect }: TimeEntryProps) => {
	const [isOpen, setIsOpen] = useState(false);
	const [isLoading, setLoading] = useState(false);
	const [isDragging, setIsDragging] = useState(false);
	const [isResizing, setIsResizing] = useState(false);
	const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
	const [dragStartTime, setDragStartTime] = useState<number>(0);
	const entryRef = useRef<HTMLDivElement>(null);

	// Track if the entry was actually moved during drag
	const wasMoved = useRef(false);

	// Store the original entry state to revert to if update fails
	const originalEntryRef = useRef(entry);

	// Set initial form state
	const [formState, setFormState] = useState({
		duration: entry.duration?.toString() || "",
		description: entry.description || "",
		entryDate: new Date(entry.date).toISOString().split("T")[0],
		startTime: entry.startTime?.match(/T(\d{2}:\d{2})/) ? entry.startTime.match(/T(\d{2}:\d{2})/)![1] : "09:00",
	});

	const { mutate: updateTimeEntry } = useUpdateTimeEntry();
	const { mutate: deleteTimeEntry } = useDeleteTimeEntry();

	// Calculate position and height as percentages of a 24-hour day (1440 minutes)
	const calculatePosition = () => {
		const top = (startSlot / 1440) * 100; // Convert to percentage
		const height = ((endSlot - startSlot) / 1440) * 100; // Height as percentage

		return {
			top: `${top}%`,
			height: `${Math.max(height, 2)}%`, // Ensure at least 2% height for visibility
		};
	};

	const { top, height } = calculatePosition();

	// Handle drag start - capture a timestamp to distinguish between clicks and drags
	const handleDragStart = (e: React.MouseEvent<HTMLDivElement>) => {
		e.stopPropagation();
		e.preventDefault(); // Prevent default to avoid triggering new entry creation

		// Store the start time for later comparison
		setDragStartTime(Date.now());

		// Only initiate drag on the main part, not controls or resize handle
		if ((e.target as HTMLElement).classList.contains("resize-handle") || (e.target as HTMLElement).tagName === "BUTTON") {
			return;
		}

		setIsDragging(true);
		wasMoved.current = false;

		if (entryRef.current) {
			const rect = entryRef.current.getBoundingClientRect();
			setDragOffset({
				x: e.clientX - rect.left,
				y: e.clientY - rect.top,
			});
		}

		// Add global event listeners for move and end
		document.addEventListener("mousemove", handleDragMove);
		document.addEventListener("mouseup", handleDragEnd);
	};

	// Handle drag move
	const handleDragMove = (e: MouseEvent) => {
		if (!isDragging || !entryRef.current) return;

		wasMoved.current = true; // Mark that actual movement occurred

		// Get parent grid dimensions
		const gridElement = entryRef.current.closest(".col-span-1");
		if (!gridElement) return;

		const gridRect = gridElement.getBoundingClientRect();

		// Calculate new position
		let newY = e.clientY - gridRect.top - dragOffset.y;

		// Constrain to parent bounds
		newY = Math.max(0, Math.min(newY, gridRect.height - entryRef.current.offsetHeight));

		// Set new position
		entryRef.current.style.top = `${newY}px`;
		entryRef.current.style.position = "absolute";
		entryRef.current.style.zIndex = "100";
	};

	// Handle drag end
	const handleDragEnd = async (e: MouseEvent) => {
		if (!isDragging || !entryRef.current) return;

		// Check if this was just a click (no actual dragging)
		const dragEndTime = Date.now();
		const isDragOrClick = dragEndTime - dragStartTime < 200 && !wasMoved.current;

		setIsDragging(false);

		// Remove global event listeners
		document.removeEventListener("mousemove", handleDragMove);
		document.removeEventListener("mouseup", handleDragEnd);

		// If it was just a click, open the popover and reset position
		if (isDragOrClick) {
			setIsOpen(true);
			entryRef.current.style.position = "";
			entryRef.current.style.top = "";
			entryRef.current.style.zIndex = "";
			return;
		}

		// Otherwise, it was a drag - update the position
		// Get parent grid and calculate new time
		const gridElement = entryRef.current.closest(".col-span-1");
		if (!gridElement) {
			// Reset if we can't find the grid
			entryRef.current.style.position = "";
			entryRef.current.style.top = "";
			entryRef.current.style.zIndex = "";
			return;
		}

		const gridRect = gridElement.getBoundingClientRect();
		const entryRect = entryRef.current.getBoundingClientRect();

		// Calculate time from position
		const relativeY = entryRect.top - gridRect.top;
		const totalMinutes = 24 * 60; // Minutes in a day
		const minutesFromTop = Math.round(((relativeY / gridRect.height) * totalMinutes) / 15) * 15;

		// Make sure minutesFromTop is within valid range (0-1440)
		const constrainedMinutes = Math.max(0, Math.min(minutesFromTop, 1440));

		// Get original duration
		const duration = entry.duration || 60;

		// Reset to percentage-based positioning
		entryRef.current.style.position = "";
		entryRef.current.style.top = "";
		entryRef.current.style.zIndex = "";

		// Create new date based on the day and minutes
		const entryDate = new Date(entry.date);
		const startDateTime = new Date(entryDate);
		startDateTime.setHours(0, constrainedMinutes, 0, 0);

		const endDateTime = new Date(startDateTime);
		endDateTime.setMinutes(endDateTime.getMinutes() + duration);

		// Update via direct position API
		try {
			await updateEntryPosition(entry.id, {
				date: startDateTime.toISOString(),
				startTime: startDateTime.toISOString(),
				endTime: endDateTime.toISOString(),
				duration: duration,
			});

			// Success! Refresh the grid
			if (onTimeSlotSelect) {
				onTimeSlotSelect({});
			}
		} catch (error) {
			console.error("Failed to update time entry position:", error);
			// On error, refresh the grid anyway to reset positions
			if (onTimeSlotSelect) {
				onTimeSlotSelect({});
			}
		}
	};

	// Handle resize start
	const handleResizeStart = (e: React.MouseEvent<HTMLDivElement>) => {
		e.stopPropagation();
		e.preventDefault();
		setIsResizing(true);

		// Add global event listeners for move and end
		document.addEventListener("mousemove", handleResizeMove);
		document.addEventListener("mouseup", handleResizeEnd);
	};

	// Handle resize move
	const handleResizeMove = (e: MouseEvent) => {
		if (!isResizing || !entryRef.current) return;

		// Get parent grid dimensions
		const gridElement = entryRef.current.closest(".col-span-1");
		if (!gridElement) return;

		const gridRect = gridElement.getBoundingClientRect();
		const entryRect = entryRef.current.getBoundingClientRect();

		// Calculate new height
		let newHeight = e.clientY - entryRect.top;

		// Constrain to grid bounds and minimum height
		newHeight = Math.max(16, Math.min(newHeight, gridRect.height - (entryRect.top - gridRect.top)));

		// Set new height
		entryRef.current.style.height = `${newHeight}px`;
		entryRef.current.style.zIndex = "100";
	};

	// Handle resize end
	const handleResizeEnd = async (e: MouseEvent) => {
		if (!isResizing || !entryRef.current) return;

		setIsResizing(false);

		// Remove global event listeners
		document.removeEventListener("mousemove", handleResizeMove);
		document.removeEventListener("mouseup", handleResizeEnd);

		// Get parent grid and calculate new time
		const gridElement = entryRef.current.closest(".col-span-1");
		if (!gridElement) {
			entryRef.current.style.height = "";
			entryRef.current.style.zIndex = "";
			return;
		}

		const gridRect = gridElement.getBoundingClientRect();
		const entryRect = entryRef.current.getBoundingClientRect();

		// Calculate time from position
		const startRelativeY = entryRect.top - gridRect.top;
		const endRelativeY = entryRect.bottom - gridRect.top;

		const totalMinutes = 24 * 60; // Minutes in a day
		const startMinutesFromTop = Math.round(((startRelativeY / gridRect.height) * totalMinutes) / 15) * 15;
		const endMinutesFromTop = Math.round(((endRelativeY / gridRect.height) * totalMinutes) / 15) * 15;

		// Reset styles
		entryRef.current.style.height = "";
		entryRef.current.style.zIndex = "";

		// Create new dates based on the day and minutes
		const entryDate = new Date(entry.date);
		const startDateTime = new Date(entryDate);
		startDateTime.setHours(0, startMinutesFromTop, 0, 0);

		const endDateTime = new Date(entryDate);
		endDateTime.setHours(0, endMinutesFromTop, 0, 0);

		// Calculate new duration (minimum 15 minutes)
		const newDuration = Math.max(15, endMinutesFromTop - startMinutesFromTop);

		// Update via direct position API
		try {
			await updateEntryPosition(entry.id, {
				duration: newDuration,
				startTime: startDateTime.toISOString(),
				endTime: endDateTime.toISOString(),
			});

			if (onTimeSlotSelect) {
				onTimeSlotSelect({});
			}
		} catch (error) {
			console.error("Failed to update time entry size:", error);
			if (onTimeSlotSelect) {
				onTimeSlotSelect({});
			}
		}
	};

	// Cleanup event listeners on unmount
	useEffect(() => {
		return () => {
			document.removeEventListener("mousemove", handleDragMove);
			document.removeEventListener("mouseup", handleDragEnd);
			document.removeEventListener("mousemove", handleResizeMove);
			document.removeEventListener("mouseup", handleResizeEnd);
		};
	}, []);

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

						// Refresh the grid
						if (onTimeSlotSelect) {
							onTimeSlotSelect({});
						}
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

					// Refresh the grid
					if (onTimeSlotSelect) {
						onTimeSlotSelect({});
					}
				},
				onError: (error) => {
					console.error("Error deleting time entry:", error);
					setLoading(false);
				},
			}
		);
	};

	// Format time for display
	const startTimeFormatted = parseISOForDisplay(entry.startTime);

	// Format duration
	const hours = Math.floor(entry.duration / 60);
	const mins = entry.duration % 60;
	const durationFormatted = `${hours}:${mins.toString().padStart(2, "0")}`;

	// Extract data from the entry
	const projectName = entry.project?.name || "";
	const taskName = entry.task?.name || "";
	const customerName = entry.customer?.name || "";
	const description = entry.description || "";

	return (
		<Popover.Root
			open={isOpen}
			onOpenChange={(open) => {
				// Don't open popover during drag or resize
				if (!isDragging && !isResizing) {
					setIsOpen(open);
				}
			}}>
			<Popover.Trigger asChild>
				<div
					ref={entryRef}
					className={`absolute time-entry bg-opacity-90 text-white p-1 rounded-lg cursor-pointer overflow-hidden shadow-md ${
						isDragging || isResizing ? "dragging" : ""
					}`}
					style={{
						top,
						height,
						left: `${left * 100}%`,
						width: `${width * 100}%`,
						backgroundColor: color || "#4893FF",
						zIndex: isDragging || isResizing ? 100 : 10,
						cursor: isDragging ? "grabbing" : "grab",
					}}
					onMouseDown={handleDragStart}>
					<div className="flex flex-col h-full justify-between text-left">
						<div>
							<Text className="text-xs font-bold text-white truncate">{startTimeFormatted}</Text>
							{customerName && <Text className="text-xs text-white truncate">{customerName}</Text>}
							{projectName && <Text className="text-xs text-white truncate">{projectName}</Text>}
							{taskName && <Text className="text-xs text-white truncate">{taskName}</Text>}
							{description && <Text className="text-xs text-white truncate">{description}</Text>}
						</div>
						{entry.duration >= 60 && <Text className="text-xs font-semibold text-white">{durationFormatted}</Text>}
					</div>

					{/* Resize handle at the bottom */}
					<div
						className="resize-handle absolute bottom-0 w-full h-2 cursor-ns-resize bg-opacity-50 hover:bg-opacity-80 bg-white"
						onMouseDown={handleResizeStart}
					/>
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
						{taskName && (
							<span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-800 dark:text-gray-200">{taskName}</span>
						)}
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
