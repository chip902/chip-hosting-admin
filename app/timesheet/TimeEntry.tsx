"use client";
import React, { useState, useRef, useEffect } from "react";
import useDeleteTimeEntry from "../hooks/useDeleteTimeEntry";
import useUpdateTimeEntry from "../hooks/useUpdateTimeEntry";
import { TimeEntryProps } from "@/types";
import { addMinutes, format, startOfDay } from "date-fns";
import axios from "axios";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Spinner } from "@/components/ui/spinner";
import { Typography } from "@/components/ui/typography";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

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
 * by using a dedicated position-update endpoint
 */
const updateEntryPosition = async (
	id: number,
	data: {
		date?: string | Date;
		startTime?: string;
		endTime?: string;
		duration?: number;
	}
) => {
	try {
		const updateData: any = {};

		if (data.date) updateData.date = data.date;
		if (data.duration) updateData.duration = data.duration;

		if (data.startTime && !data.date) {
			updateData.date = data.startTime;
		}

		if (data.endTime) {
			updateData.endDate = data.endTime;
		}

		const params = new URLSearchParams();

		if (updateData.date) params.append("date", updateData.date);
		if (updateData.endDate) params.append("endDate", updateData.endDate);
		if (updateData.duration) params.append("duration", updateData.duration.toString());

		const response = await axios.get(`/api/timelog/position/${id}?${params.toString()}`);
		return response.data;
	} catch (error) {
		console.error("Failed to update position:", error);
		throw error;
	}
};

const TimeEntryComponent = ({ entry, startSlot, endSlot, color, left, width, onTimeSlotSelect, isDialogOpen }: TimeEntryProps) => {
	const [isOpen, setIsOpen] = useState(false);
	const [isLoading, setLoading] = useState(false);
	const [isDragging, setIsDragging] = useState(false);
	const [isResizing, setIsResizing] = useState(false);
	const entryRef = useRef<HTMLDivElement>(null);
	const [mouseDownTime, setMouseDownTime] = useState<number>(0);
	const moveCount = useRef(0);

	// Track if the entry was actually moved during drag
	const wasMoved = useRef(false);

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

	const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
		if (isDialogOpen) return;
		e.stopPropagation();
		e.preventDefault();

		// Don't handle if clicking resize handle or buttons
		if ((e.target as HTMLElement).classList.contains("resize-handle") || (e.target as HTMLElement).tagName === "BUTTON") {
			return;
		}

		setMouseDownTime(Date.now());
		moveCount.current = 0;

		// Setup drag handling
		document.addEventListener("mousemove", handleMouseMove);
		document.addEventListener("mouseup", handleMouseUp);
	};

	const handleMouseMove = (e: MouseEvent) => {
		moveCount.current += 1;

		if (moveCount.current > 3 && !isDragging) {
			setIsDragging(true);
			wasMoved.current = true;
		}

		if (isDragging && entryRef.current) {
			const gridElement = entryRef.current.closest(".col-span-1");
			if (!gridElement) return;

			const gridRect = gridElement.getBoundingClientRect();
			const entryRect = entryRef.current.getBoundingClientRect();

			// Calculate new position
			let newY = e.clientY - gridRect.top - entryRect.height / 2;
			newY = Math.max(0, Math.min(newY, gridRect.height - entryRect.height));

			entryRef.current.style.position = "absolute";
			entryRef.current.style.top = `${newY}px`;
			entryRef.current.style.zIndex = "100";
		}
	};

	const handleMouseUp = async (e: MouseEvent) => {
		const mouseUpTime = Date.now();
		const isClick = mouseUpTime - mouseDownTime < 200 && moveCount.current < 3;

		document.removeEventListener("mousemove", handleMouseMove);
		document.removeEventListener("mouseup", handleMouseUp);

		if (isClick) {
			setIsOpen(true);
			if (entryRef.current) {
				entryRef.current.style.position = "";
				entryRef.current.style.top = "";
				entryRef.current.style.zIndex = "";
			}
			setIsDragging(false);
			return;
		}

		if (isDragging && entryRef.current) {
			const gridElement = entryRef.current.closest(".col-span-1");
			if (!gridElement) return;

			const gridRect = gridElement.getBoundingClientRect();
			const entryRect = entryRef.current.getBoundingClientRect();
			const relativeY = entryRect.top - gridRect.top;
			const totalMinutes = 24 * 60;
			const minutesFromTop = Math.round(((relativeY / gridRect.height) * totalMinutes) / 15) * 15;
			const constrainedMinutes = Math.max(0, Math.min(minutesFromTop, 1440));

			try {
				// Keep visual position during update
				await updateEntryPosition(entry.id, {
					date: entry.date,
					startTime: format(addMinutes(startOfDay(new Date(entry.date)), constrainedMinutes), "yyyy-MM-dd'T'HH:mm:ss"),
					endTime: format(addMinutes(startOfDay(new Date(entry.date)), constrainedMinutes + entry.duration), "yyyy-MM-dd'T'HH:mm:ss"),
					duration: entry.duration,
				});

				// Only reset after successful update
				if (onTimeSlotSelect) {
					onTimeSlotSelect({});
				}
			} catch (error) {
				console.error("Failed to update position:", error);
				if (onTimeSlotSelect) {
					onTimeSlotSelect({});
				}
			}

			// Reset drag state
			setIsDragging(false);
			if (entryRef.current) {
				entryRef.current.style.position = "";
				entryRef.current.style.top = "";
				entryRef.current.style.zIndex = "";
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

		const totalMinutes = 24 * 60;
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

	const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		const { name, value } = e.target;
		setFormState((prevState) => ({ ...prevState, [name]: value }));
	};

	const handleUpdate = async () => {
		setLoading(true);

		try {
			const dateParts = formState.entryDate.split("-");
			const timeParts = formState.startTime.split(":");
			const isoDate = new Date(
				parseInt(dateParts[0]),
				parseInt(dateParts[1]) - 1,
				parseInt(dateParts[2]),
				parseInt(timeParts[0]),
				parseInt(timeParts[1])
			);

			await toast.promise(
				async () => {
					return updateTimeEntry({
						id: entry.id,
						data: {
							duration: Number(formState.duration),
							description: formState.description,
							date: isoDate.toISOString(),
						},
					});
				},
				{
					loading: "Updating time entry...",
					success: "Time entry updated successfully",
					error: "Failed to update time entry",
				}
			);

			setIsOpen(false);
			if (onTimeSlotSelect) {
				onTimeSlotSelect({});
			}
		} catch (error) {
			console.error("Failed to update time entry:", error);
			toast.error("Failed to update", {
				description: error instanceof Error ? error.message : "Unknown error",
			});
		} finally {
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

	// Cleanup event listeners on unmount
	useEffect(() => {
		return () => {
			document.removeEventListener("mousemove", handleResizeMove);
			document.removeEventListener("mouseup", handleResizeEnd);
		};
	}, []);

	return (
		<Popover
			open={isOpen}
			onOpenChange={(open) => {
				// Don't open popover during drag or resize
				if (!isDragging && !isResizing) {
					setIsOpen(open);
				}
			}}>
			<PopoverTrigger asChild>
				<div
					ref={entryRef}
					className={`
						absolute time-entry
						bg-opacity-90
						text-white
						p-1
						rounded-lg
						shadow-md
						overflow-hidden
						${entry.className || ""} 
						${isDragging || isResizing ? "dragging" : ""}
					`}
					style={{
						top,
						height,
						left: `${left * 100}%`,
						width: `${width * 100}%`,
						backgroundColor: color || "#4893FF",
						zIndex: isDragging || isResizing ? 30 : entry.zIndex || 10,
					}}
					onMouseDown={handleMouseDown}>
					<div className="flex flex-col h-full justify-between text-left max-w-full">
						<div className="w-full overflow-hidden">
							<Typography className="text-xs font-bold text-white truncate block">{startTimeFormatted}</Typography>
							{customerName && <Typography className="text-sm text-white truncate block">{customerName}</Typography>}
							{projectName && <Typography className="text-sm text-white truncate block">{projectName}</Typography>}
							{taskName && <Typography className="text-sm text-white truncate block">{taskName}</Typography>}
						</div>
						{entry.duration >= 60 && (
							<Typography className="text-sm font-semibold text-white truncate block mt-auto">{durationFormatted} Hours</Typography>
						)}
					</div>
				</div>
			</PopoverTrigger>
			<PopoverContent className="p-6 bg-gray-900 rounded-lg shadow-lg z-50 w-80">
				<form className="flex flex-col space-y-4" onSubmit={(e) => e.preventDefault()}>
					<div className="flex justify-between items-center mb-2">
						<h3 className="text-md font-bold text-gray-100">{customerName || "Unknown Client"}</h3>
						<span className="text-sm text-gray-300">{durationFormatted}</span>
					</div>

					<div className="flex flex-wrap gap-2 mb-2">
						{projectName && <span className="px-2 py-1 bg-gray-800 rounded text-xs text-gray-200">{projectName}</span>}
						{taskName && <span className="px-2 py-1 bg-gray-800 rounded text-xs text-gray-200">{taskName}</span>}
					</div>

					<label className="flex flex-col">
						<span className="text-sm font-medium text-gray-400 mb-1">Description:</span>
						<Textarea
							name="description"
							value={formState.description}
							onChange={handleFormChange}
							className="w-full h-24 px-3 py-2 mb-2 text-gray-100 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							placeholder="Add description..."
						/>
					</label>

					<label className="flex flex-col">
						<span className="text-sm font-medium text-gray-400 mb-1">Date:</span>
						<input
							type="date"
							name="entryDate"
							value={formState.entryDate}
							onChange={handleFormChange}
							className="w-full px-3 py-2 mb-2 text-gray-100 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</label>

					<label className="flex flex-col">
						<span className="text-sm font-medium text-gray-400 mb-1">Start Time:</span>
						<input
							type="time"
							name="startTime"
							value={formState.startTime}
							onChange={handleFormChange}
							className="w-full px-3 py-2 mb-2 text-gray-100 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</label>

					<label className="flex flex-col">
						<span className="text-sm font-medium text-gray-400 mb-1">Duration (minutes):</span>
						<input
							type="number"
							name="duration"
							value={formState.duration}
							onChange={handleFormChange}
							className="w-full px-3 py-2 mb-2 text-gray-100 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</label>

					<div className="flex space-x-2">
						<button
							type="button"
							onClick={handleUpdate}
							disabled={isLoading}
							className="flex-1 px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50">
							{isLoading ? <Spinner /> : "Update"}
						</button>
						<button
							type="button"
							onClick={handleDelete}
							disabled={isLoading}
							className="flex-1 px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50">
							{isLoading ? <Spinner /> : "Delete"}
						</button>
					</div>
				</form>
			</PopoverContent>
		</Popover>
	);
};

export default TimeEntryComponent;
