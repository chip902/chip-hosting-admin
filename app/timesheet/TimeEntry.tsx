"use client";
import React, { useState, useRef, useEffect } from "react";
import useDeleteTimeEntry from "../hooks/useDeleteTimeEntry";
import useUpdateTimeEntry from "../hooks/useUpdateTimeEntry";
import { TimeEntryProps } from "@/types";
import { addMinutes, format, startOfDay } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Spinner } from "@/components/ui/spinner";
import { Typography } from "@/components/ui/typography";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

// Helper function to safely parse time from ISO string
const parseISOForDisplay = (dateStr: string): string => {
	if (!dateStr) return "";
	try {
		const matches = dateStr.match(/T(\d{2}):(\d{2})/);
		if (!matches) return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

		const hour = parseInt(matches[1], 10);
		const minute = matches[2];
		const hourDisplay = hour % 12 || 12;
		const ampm = hour >= 12 ? "PM" : "AM";

		return `${hourDisplay}:${minute} ${ampm}`;
	} catch (error) {
		console.error("Error formatting time for display:", error);
		return "";
	}
};

const TimeEntryComponent = ({ entry, startSlot, endSlot, color = "#4893FF", left = 0, width = 1, onTimeSlotSelect, isDialogOpen = false }: TimeEntryProps) => {
	const [isOpen, setIsOpen] = useState(false);
	const [isLoading, setLoading] = useState(false);
	const [isDragging, setIsDragging] = useState(false);
	const [isResizing, setIsResizing] = useState(false);
	const entryRef = useRef<HTMLDivElement>(null);
	const wasMoved = useRef(false);
	const mouseDownTime = useRef(0);
	const moveCount = useRef(0);
	const dragStartY = useRef(0);
	const dragStartTop = useRef(0);

	// Set initial form state
	const [formState, setFormState] = useState({
		duration: entry.duration?.toString() || "60",
		description: entry.description || "",
		entryDate: new Date(entry.date).toISOString().split("T")[0],
		startTime: entry.startTime?.match(/T(\d{2}:\d{2})/) ? entry.startTime.match(/T(\d{2}:\d{2})/)![1] : "09:00",
	});

	const { mutate: deleteTimeEntry } = useDeleteTimeEntry();
	const { mutate: updateTimeEntry } = useUpdateTimeEntry();

	// Calculate position and height as percentages of a 24-hour day (1440 minutes)
	const calculatePosition = () => {
		const top = (startSlot / 1440) * 100;
		const height = ((endSlot - startSlot) / 1440) * 100;
		return { top: `${top}%`, height: `${Math.max(height, 2)}%` };
	};

	const { top, height } = calculatePosition();
	const startTimeFormatted = parseISOForDisplay(entry.startTime);
	const duration = entry.duration || 60;
	const hours = Math.floor(duration / 60);
	const mins = duration % 60;
	const durationFormatted = `${hours}:${mins.toString().padStart(2, "0")}`;

	// Extract data from the entry
	const projectName = entry.project?.name || "";
	const taskName = entry.task?.name || "";
	const customerName = entry.customer?.name || "";

	// Handle mouse down on the time entry
	const handleMouseDown = (e: React.MouseEvent) => {
		if (isDialogOpen) return;
		e.stopPropagation();
		e.preventDefault();

		// Only start dragging on left mouse button
		if (e.button !== 0) return;

		// Don't start dragging if clicking on a button, input, or the resize handle
		const target = e.target as HTMLElement;
		if (target.closest("button") || target.closest("input") || target.closest("textarea") || target.closest(".resize-handle")) {
			return;
		}

		setIsDragging(true);
		dragStartY.current = e.clientY;
		dragStartTop.current = parseInt(entryRef.current?.style.top || "0", 10);
		document.body.style.userSelect = "none";
	};

	// Handle mouse move for dragging
	const handleMouseMove = async (e: MouseEvent) => {
		if (!isDragging || !entryRef.current) return;

		e.preventDefault();

		try {
			const gridElement = entryRef.current.closest(".col-span-1");
			if (!gridElement) return;

			const gridRect = gridElement.getBoundingClientRect();
			const deltaY = e.clientY - dragStartY.current;
			const newTop = dragStartTop.current + deltaY;

			// Calculate new position in minutes
			const totalMinutes = 24 * 60;
			const newMinutes = Math.round(((newTop / gridRect.height) * totalMinutes) / 15) * 15;

			// Constrain to grid bounds
			const constrainedMinutes = Math.max(0, Math.min(totalMinutes - entry.duration, newMinutes));

			// Update position
			if (entryRef.current) {
				entryRef.current.style.position = "relative";
				entryRef.current.style.top = `${(constrainedMinutes / totalMinutes) * 100}%`;
				entryRef.current.style.zIndex = "100";
			}

			wasMoved.current = true;
		} catch (error) {
			console.error("Error during drag move:", error);
			// Clean up and reset on error
			setIsDragging(false);
			if (entryRef.current) {
				entryRef.current.style.position = "";
				entryRef.current.style.top = "";
				entryRef.current.style.zIndex = "";
			}
		}
	};

	// Handle mouse up to end dragging
	const handleMouseUp = async (e: MouseEvent) => {
		if (!isDragging) return;

		e.preventDefault();

		// Reset dragging state immediately
		setIsDragging(false);
		wasMoved.current = false;
		document.body.style.userSelect = "";

		// Only process if the entry was actually moved
		if (entryRef.current) {
			const gridElement = entryRef.current.closest(".col-span-1");
			if (!gridElement) return;

			try {
				const gridRect = gridElement.getBoundingClientRect();
				const entryRect = entryRef.current.getBoundingClientRect();

				// Calculate new position in minutes
				const totalMinutes = 24 * 60;
				const relativeTop = entryRect.top - gridRect.top;
				const minutes = Math.round(((relativeTop / gridRect.height) * totalMinutes) / 15) * 15;

				// Ensure we don't go out of bounds
				const constrainedMinutes = Math.max(0, Math.min(totalMinutes - entry.duration, minutes));

				// Only update if position actually changed
				const originalMinutes = (parseInt(entryRef.current.style.top || "0", 10) / 100) * totalMinutes;
				if (Math.abs(constrainedMinutes - originalMinutes) >= 1) {
					// Update the entry
					await updateTimeEntry({
						id: entry.id,
						data: {
							startTime: format(addMinutes(startOfDay(new Date(entry.date)), constrainedMinutes), "yyyy-MM-dd'T'HH:mm:ss"),
							endTime: format(addMinutes(startOfDay(new Date(entry.date)), constrainedMinutes + entry.duration), "yyyy-MM-dd'T'HH:mm:ss"),
							duration: entry.duration,
						},
					});

					if (onTimeSlotSelect) {
						onTimeSlotSelect({});
					}
				}
			} catch (error) {
				console.error("Failed to update position:", error);
				if (onTimeSlotSelect) {
					onTimeSlotSelect({});
				}
			} finally {
				// Always reset the styles
				if (entryRef.current) {
					entryRef.current.style.position = "";
					entryRef.current.style.top = "";
					entryRef.current.style.zIndex = "";
				}
			}
		}
	};

	// Handle form changes
	const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		const { name, value } = e.target;
		setFormState((prev) => ({ ...prev, [name]: value }));
	};

	// Handle entry update
	const handleUpdate = async () => {
		setLoading(true);

		try {
			// Convert form data to API format
			const startDate = new Date(`${formState.entryDate}T${formState.startTime}`);
			const durationMinutes = parseInt(formState.duration, 10);

			if (isNaN(durationMinutes) || durationMinutes <= 0) {
				toast.error("Duration must be a positive number");
				setLoading(false);
				return;
			}

			// Calculate end time
			const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);

			updateTimeEntry(
				{
					id: entry.id,
					data: {
						date: startDate.toISOString(),
						duration: durationMinutes,
						description: formState.description,
						startTime: startDate.toISOString(),
						endTime: endDate.toISOString(),
					},
				},
				{
					onSuccess: () => {
						toast.success("Entry updated");
						setIsOpen(false);
						if (onTimeSlotSelect) {
							onTimeSlotSelect({});
						}
					},
					onError: (error) => {
						console.error("Failed to update entry:", error);
						toast.error("Failed to update entry");
					},
					onSettled: () => {
						setLoading(false);
					},
				}
			);
		} catch (error) {
			console.error("Error processing form data:", error);
			toast.error("Invalid form data");
			setLoading(false);
		}
	};

	// Handle entry deletion
	const handleDelete = () => {
		if (window.confirm("Are you sure you want to delete this time entry?")) {
			setLoading(true);
			deleteTimeEntry(
				{ id: entry.id },
				{
					onSuccess: () => {
						toast.success("Entry deleted");
						setIsOpen(false);
						if (onTimeSlotSelect) {
							onTimeSlotSelect({});
						}
					},
					onError: (error) => {
						console.error("Failed to delete entry:", error);
						toast.error("Failed to delete entry");
					},
					onSettled: () => {
						setLoading(false);
					},
				}
			);
		}
	};

	// Resize functionality
	const handleResizeStart = (e: React.MouseEvent<HTMLDivElement>) => {
		if (isDialogOpen) return;
		e.stopPropagation();
		e.preventDefault();

		setIsResizing(true);
		document.addEventListener("mousemove", handleResizeMove);
		document.addEventListener("mouseup", handleResizeEnd);
	};

	const handleResizeMove = (e: MouseEvent) => {
		if (!isResizing || !entryRef.current) return;
		const gridElement = entryRef.current.closest(".col-span-1");
		if (!gridElement) return;

		const gridRect = gridElement.getBoundingClientRect();
		const entryRect = entryRef.current.getBoundingClientRect();
		const startY = entryRect.top - gridRect.top;
		const newHeight = Math.max(40, e.clientY - gridRect.top - startY);
		const totalMinutes = 24 * 60;
		const minutesHeight = (newHeight / gridRect.height) * totalMinutes;
		const roundedMinutes = Math.round(minutesHeight / 15) * 15;

		entryRef.current.style.height = `${(roundedMinutes / totalMinutes) * 100}%`;
		entryRef.current.style.zIndex = "100";
	};

	const handleResizeEnd = async (e: MouseEvent) => {
		if (!isResizing || !entryRef.current) return;
		document.removeEventListener("mousemove", handleResizeMove);
		document.removeEventListener("mouseup", handleResizeEnd);
		setIsResizing(false);
		entryRef.current.style.height = "";
		entryRef.current.style.zIndex = "";
	};

	// Add and cleanup event listeners
	useEffect(() => {
		// Only add event listeners if we're not in a dialog
		if (isDialogOpen) return;

		// Wrap the handlers to ensure they have the correct type
		const wrappedHandleMouseMove = (e: MouseEvent) => handleMouseMove(e);
		const wrappedHandleMouseUp = (e: MouseEvent) => handleMouseUp(e);
		const wrappedHandleResizeMove = (e: MouseEvent) => handleResizeMove(e);
		const wrappedHandleResizeEnd = (e: MouseEvent) => handleResizeEnd(e);

		// Add event listeners
		document.addEventListener("mousemove", wrappedHandleMouseMove);
		document.addEventListener("mouseup", wrappedHandleMouseUp);
		document.addEventListener("mousemove", wrappedHandleResizeMove);
		document.addEventListener("mouseup", wrappedHandleResizeEnd);

		return () => {
			// Remove all event listeners on cleanup
			document.removeEventListener("mousemove", wrappedHandleMouseMove);
			document.removeEventListener("mouseup", wrappedHandleMouseUp);
			document.removeEventListener("mousemove", wrappedHandleResizeMove);
			document.removeEventListener("mouseup", wrappedHandleResizeEnd);
		};
	}, [isDialogOpen, handleResizeMove, handleResizeEnd, handleMouseMove, handleMouseUp]);

	return (
		<Popover open={isOpen} onOpenChange={setIsOpen}>
			<PopoverTrigger asChild>
				<div
					ref={entryRef}
					className={`
            time-entry
            absolute
            text-white
            p-1.5
            rounded-md
            shadow-sm
            overflow-hidden
            transition-all duration-100
            hover:shadow-md
            border-l-2 border-white/20
            ${isDragging || isResizing ? "dragging" : ""}
          `}
					style={{
						top,
						height,
						left: `${left * 98}%`,
						width: `${width * 96}%`,
						marginLeft: `${left * 1}%`,
						backgroundColor: color,
						zIndex: isDragging || isResizing ? 100 : entry.zIndex || 10,
						transform: "translateZ(0)",
						boxSizing: "border-box",
						pointerEvents: "auto",
						minWidth: "30px",
						display: "flex",
						flexDirection: "column",
						borderRadius: "0.375rem",
						transformOrigin: "center",
						transition: "all 0.1s ease-out",
						willChange: "transform, width, left, top, height",
						backfaceVisibility: "hidden",
						boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.1)",
					}}
					onMouseDown={handleMouseDown}>
					<div className="flex flex-col h-full justify-between text-left max-w-full">
						<div className="w-full overflow-hidden">
							<Typography className="text-xs font-bold text-white/90 truncate block">{startTimeFormatted}</Typography>
							{customerName && <Typography className="text-xs text-white/90 truncate block">{customerName}</Typography>}
							{projectName && <Typography className="text-xs text-white/90 truncate block">{projectName}</Typography>}
							{taskName && <Typography className="text-xs text-white/90 truncate block">{taskName}</Typography>}
						</div>
						{duration >= 60 && (
							<Typography className="text-xs font-semibold text-white/90 truncate block mt-auto">{durationFormatted} Hours</Typography>
						)}
					</div>
					<div className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize resize-handle" onMouseDown={handleResizeStart} />
				</div>
			</PopoverTrigger>
			<PopoverContent className="p-6 bg-gray-900 rounded-lg shadow-lg z-[100] w-80">
				<form
					className="flex flex-col space-y-4"
					onSubmit={(e) => {
						e.preventDefault();
						handleUpdate();
					}}>
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

					<div className="flex justify-end space-x-2 pt-2">
						<button
							type="button"
							onClick={() => setIsOpen(false)}
							className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
							Cancel
						</button>
						<button
							type="submit"
							className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
							disabled={isLoading}>
							{isLoading ? <Spinner /> : "Save Changes"}
						</button>
					</div>
				</form>
			</PopoverContent>
		</Popover>
	);
};

export default TimeEntryComponent;
