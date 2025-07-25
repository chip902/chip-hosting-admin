"use client";
import React, { useState, useRef, useEffect } from "react";
import useDeleteTimeEntry from "@/app/hooks/useDeleteTimeEntry";
import useUpdateTimeEntry from "@/app/hooks/useUpdateTimeEntry";
import useDuplicateTimeEntry from "@/app/hooks/useDuplicateTimeEntry";
import { TimeEntryProps } from "@/types";
import { addMinutes, format, startOfDay } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Spinner } from "@/components/ui/spinner";
import { Typography } from "@/components/ui/typography";
import { Textarea } from "@/components/ui/textarea";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger } from "@/components/ui/context-menu";
import { Copy, Edit, Trash2 } from "lucide-react";
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

const TimeEntryComponent = ({
	entry,
	startSlot,
	endSlot,
	color = "#4893FF",
	left = 0,
	width = 1,
	onTimeSlotSelect,
	isDialogOpen = false,
	isMainEntry = true,
	isStackedEntry = false,
	stackIndex = 0,
	totalStacked = 1,
}: TimeEntryProps) => {
	const [isOpen, setIsOpen] = useState(false);
	const [isLoading, setLoading] = useState(false);
	const [isDragging, setIsDragging] = useState(false);
	const [isResizing, setIsResizing] = useState(false);
	const [isResizingTop, setIsResizingTop] = useState(false);
	const [dragStartPosition, setDragStartPosition] = useState<{ x: number; y: number } | null>(null);
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
	const { mutate: duplicateTimeEntry, status: duplicateStatus } = useDuplicateTimeEntry();

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
		// Completely disable drag functionality when any dialog is open
		if (isDialogOpen) {
			return;
		}

		// Only start dragging on left mouse button
		if (e.button !== 0) return;

		const target = e.target as HTMLElement;

		// Don't start dragging if clicking on interactive elements
		if (
			target.closest("button") ||
			target.closest("input") ||
			target.closest("textarea") ||
			target.closest("select") ||
			target.closest("[role='combobox']") ||
			target.closest("[role='option']") ||
			target.closest(".resize-handle") ||
			target.closest(".top-resize-handle") ||
			target.closest("[role='dialog']") ||
			target.closest("[data-radix-popper-content-wrapper]")
		) {
			return;
		}

		e.stopPropagation();
		e.preventDefault();

		// Record the initial position for drag threshold
		setDragStartPosition({ x: e.clientX, y: e.clientY });
		mouseDownTime.current = Date.now();

		// Set up drag tracking but don't activate dragging immediately
		dragStartY.current = e.clientY;
		// Get the current position from the element's actual position
		if (entryRef.current) {
			const rect = entryRef.current.getBoundingClientRect();
			const parentRect = entryRef.current.closest(".col-span-1")?.getBoundingClientRect();
			if (parentRect) {
				dragStartTop.current = rect.top - parentRect.top;
			} else {
				dragStartTop.current = 0;
			}
		}

		// Add temporary listeners to detect actual drag intent
		document.addEventListener("mousemove", handleInitialMouseMove);
		document.addEventListener("mouseup", handleInitialMouseUp);
	};

	// Handle initial mouse move to detect drag intent
	const handleInitialMouseMove = (e: MouseEvent) => {
		if (!dragStartPosition) return;

		const threshold = 5; // pixels
		const deltaX = Math.abs(e.clientX - dragStartPosition.x);
		const deltaY = Math.abs(e.clientY - dragStartPosition.y);

		// If mouse moved beyond threshold, start dragging
		if (deltaX > threshold || deltaY > threshold) {
			document.removeEventListener("mousemove", handleInitialMouseMove);
			document.removeEventListener("mouseup", handleInitialMouseUp);

			setIsDragging(true);
			document.body.style.userSelect = "none";
			document.body.style.cursor = "grabbing";
			setDragStartPosition(null);

			// Add drag event listeners immediately
			document.addEventListener("mousemove", handleMouseMove);
			document.addEventListener("mouseup", handleMouseUp);
		}
	};

	// Handle initial mouse up (click without drag)
	const handleInitialMouseUp = (e: MouseEvent) => {
		document.removeEventListener("mousemove", handleInitialMouseMove);
		document.removeEventListener("mouseup", handleInitialMouseUp);
		setDragStartPosition(null);

		// This was just a click, not a drag - could open popover
		const clickDuration = Date.now() - mouseDownTime.current;
		if (clickDuration < 200) {
			// Short click - maybe trigger popover
		}
	};

	// Handle mouse move for dragging
	const handleMouseMove = async (e: MouseEvent) => {
		if (!isDragging || !entryRef.current) return;

		e.preventDefault();

		try {
			// Find all day columns for cross-day dragging
			const dayColumns = document.querySelectorAll(".col-span-1:not(:first-child)");
			let targetColumn = null;
			let targetDayIndex = -1;

			// Determine which day column the mouse is over
			for (let i = 0; i < dayColumns.length; i++) {
				const columnRect = dayColumns[i].getBoundingClientRect();
				if (e.clientX >= columnRect.left && e.clientX <= columnRect.right) {
					targetColumn = dayColumns[i] as HTMLElement;
					targetDayIndex = i;
					break;
				}
			}

			// If not over any day column, use the original column
			if (!targetColumn) {
				targetColumn = entryRef.current.closest(".col-span-1") as HTMLElement;
				if (!targetColumn) return;
			}

			const gridRect = targetColumn.getBoundingClientRect();
			const deltaY = e.clientY - dragStartY.current;
			const newTop = dragStartTop.current + deltaY;

			// Calculate new position in minutes
			const totalMinutes = 24 * 60;
			const newMinutes = Math.round(((newTop / gridRect.height) * totalMinutes) / 15) * 15;

			// Constrain to grid bounds
			const constrainedMinutes = Math.max(0, Math.min(totalMinutes - entry.duration, newMinutes));

			// Update position and store target day
			if (entryRef.current) {
				entryRef.current.style.position = "relative";
				entryRef.current.style.top = `${(constrainedMinutes / totalMinutes) * 100}%`;
				entryRef.current.style.zIndex = "100";
				entryRef.current.setAttribute("data-target-day", targetDayIndex.toString());

				// Add visual feedback for cross-day dragging
				if (targetDayIndex !== -1) {
					entryRef.current.style.opacity = "0.8";
					entryRef.current.style.transform = "translateZ(0) scale(1.05)";
					entryRef.current.style.boxShadow = "0 8px 25px rgba(0, 0, 0, 0.3)";
				}
			}

			// Highlight target day column
			document.querySelectorAll(".col-span-1:not(:first-child)").forEach((col, index) => {
				if (index === targetDayIndex) {
					(col as HTMLElement).style.backgroundColor = "rgba(59, 130, 246, 0.1)";
					(col as HTMLElement).style.borderColor = "rgba(59, 130, 246, 0.3)";
				} else {
					(col as HTMLElement).style.backgroundColor = "";
					(col as HTMLElement).style.borderColor = "";
				}
			});

			wasMoved.current = true;
		} catch (error) {
			console.error("Error during drag move:", error);
			// Clean up and reset on error
			setIsDragging(false);
			document.body.style.cursor = "";
			document.body.style.userSelect = "";
			if (entryRef.current) {
				entryRef.current.style.position = "";
				entryRef.current.style.top = "";
				entryRef.current.style.zIndex = "";
				entryRef.current.style.opacity = "";
				entryRef.current.style.transform = "";
				entryRef.current.style.boxShadow = "";
				entryRef.current.removeAttribute("data-target-day");
			}

			// Clear day column highlighting
			document.querySelectorAll(".col-span-1:not(:first-child)").forEach((col) => {
				(col as HTMLElement).style.backgroundColor = "";
				(col as HTMLElement).style.borderColor = "";
			});
		}
	};

	// Handle mouse up to end dragging
	const handleMouseUp = async (e: MouseEvent) => {
		if (!isDragging) return;

		e.preventDefault();

		// Remove drag event listeners
		document.removeEventListener("mousemove", handleMouseMove);
		document.removeEventListener("mouseup", handleMouseUp);

		// Reset dragging state immediately
		setIsDragging(false);
		wasMoved.current = false;
		document.body.style.userSelect = "";
		document.body.style.cursor = "";

		// Only process if the entry was actually moved
		if (entryRef.current) {
			try {
				const targetDayIndex = entryRef.current.getAttribute("data-target-day");
				const dayColumns = document.querySelectorAll(".col-span-1:not(:first-child)");

				let gridElement: HTMLElement;
				let newDate = new Date(entry.date);

				// If dropped on a different day, calculate the new date
				if (targetDayIndex && targetDayIndex !== "-1" && parseInt(targetDayIndex) < dayColumns.length) {
					gridElement = dayColumns[parseInt(targetDayIndex)] as HTMLElement;

					// Calculate the new date based on the target day index
					const currentEntryDate = new Date(entry.date);
					const startOfWeek = startOfDay(currentEntryDate);
					startOfWeek.setDate(startOfWeek.getDate() - currentEntryDate.getDay()); // Go to start of week
					newDate = new Date(startOfWeek);
					newDate.setDate(newDate.getDate() + parseInt(targetDayIndex));
				} else {
					gridElement = entryRef.current.closest(".col-span-1") as HTMLElement;
				}

				if (!gridElement) return;

				const gridRect = gridElement.getBoundingClientRect();
				const entryRect = entryRef.current.getBoundingClientRect();

				// Calculate new position in minutes
				const totalMinutes = 24 * 60;
				const relativeTop = entryRect.top - gridRect.top;
				const minutes = Math.round(((relativeTop / gridRect.height) * totalMinutes) / 15) * 15;

				// Ensure we don't go out of bounds
				const constrainedMinutes = Math.max(0, Math.min(totalMinutes - entry.duration, minutes));

				// Calculate new start and end times
				const newStartTime = addMinutes(startOfDay(newDate), constrainedMinutes);
				const newEndTime = addMinutes(newStartTime, entry.duration);

				// Update the entry with new date and time
				await updateTimeEntry({
					id: entry.id,
					data: {
						date: newDate.toISOString(),
						startTime: format(newStartTime, "yyyy-MM-dd'T'HH:mm:ss"),
						endTime: format(newEndTime, "yyyy-MM-dd'T'HH:mm:ss"),
						duration: entry.duration,
					},
				});

				if (onTimeSlotSelect) {
					onTimeSlotSelect({});
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
					entryRef.current.style.opacity = "";
					entryRef.current.style.transform = "";
					entryRef.current.style.boxShadow = "";
					entryRef.current.removeAttribute("data-target-day");
				}

				// Clear day column highlighting
				document.querySelectorAll(".col-span-1:not(:first-child)").forEach((col) => {
					(col as HTMLElement).style.backgroundColor = "";
					(col as HTMLElement).style.borderColor = "";
				});
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

	// Handle entry duplication
	const handleDuplicate = () => {
		duplicateTimeEntry(entry.id, {
			onSuccess: () => {
				toast.success("Entry duplicated");
				if (onTimeSlotSelect) {
					onTimeSlotSelect({});
				}
			},
			onError: (error) => {
				console.error("Failed to duplicate entry:", error);
				toast.error("Failed to duplicate entry");
			},
		});
	};

	// Handle context menu actions
	const handleContextMenuAction = (action: string, event: React.MouseEvent<HTMLDivElement>) => {
		event.preventDefault();
		event.stopPropagation();

		switch (action) {
			case "edit":
				setIsOpen(true);
				break;
			case "duplicate":
				handleDuplicate();
				break;
			case "delete":
				handleDelete();
				break;
		}
	};

	// Bottom resize functionality
	const handleResizeStart = (e: React.MouseEvent<HTMLDivElement>) => {
		if (isDialogOpen) return;
		e.stopPropagation();
		e.preventDefault();

		setIsResizing(true);
		document.addEventListener("mousemove", handleResizeMove);
		document.addEventListener("mouseup", handleResizeEnd);
	};

	// Top resize functionality
	const handleTopResizeStart = (e: React.MouseEvent<HTMLDivElement>) => {
		if (isDialogOpen) return;
		e.stopPropagation();
		e.preventDefault();

		setIsResizingTop(true);
		document.addEventListener("mousemove", handleTopResizeMove);
		document.addEventListener("mouseup", handleTopResizeEnd);
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

		const gridElement = entryRef.current.closest(".col-span-1");
		if (!gridElement) {
			setIsResizing(false);
			return;
		}

		try {
			const gridRect = gridElement.getBoundingClientRect();
			const entryRect = entryRef.current.getBoundingClientRect();
			const totalMinutes = 24 * 60;

			const startY = entryRect.top - gridRect.top;
			const height = entryRect.height;

			const startMinutes = Math.round(((startY / gridRect.height) * totalMinutes) / 15) * 15;
			const durationMinutes = Math.round(((height / gridRect.height) * totalMinutes) / 15) * 15;

			const constrainedStartMinutes = Math.max(0, startMinutes);
			const constrainedDuration = Math.max(15, Math.min(durationMinutes, totalMinutes - constrainedStartMinutes));

			const newStartTime = addMinutes(startOfDay(new Date(entry.date)), constrainedStartMinutes);
			const newEndTime = addMinutes(newStartTime, constrainedDuration);

			await updateTimeEntry({
				id: entry.id,
				data: {
					startTime: format(newStartTime, "yyyy-MM-dd'T'HH:mm:ss"),
					endTime: format(newEndTime, "yyyy-MM-dd'T'HH:mm:ss"),
					duration: constrainedDuration,
				},
			});

			if (onTimeSlotSelect) {
				onTimeSlotSelect({});
			}
		} catch (error) {
			console.error("Failed to resize entry:", error);
		}

		setIsResizing(false);
		// Reset only temporary resize styles, let component re-render with new data
		if (entryRef.current) {
			entryRef.current.style.height = "";
			entryRef.current.style.zIndex = "";
		}
	};

	const handleTopResizeMove = (e: MouseEvent) => {
		if (!isResizingTop || !entryRef.current) return;
		const gridElement = entryRef.current.closest(".col-span-1");
		if (!gridElement) return;

		const gridRect = gridElement.getBoundingClientRect();
		const entryRect = entryRef.current.getBoundingClientRect();
		const endY = entryRect.bottom - gridRect.top;
		const newStartY = Math.max(0, e.clientY - gridRect.top);
		const newHeight = Math.max(40, endY - newStartY);
		const totalMinutes = 24 * 60;
		const minutesHeight = (newHeight / gridRect.height) * totalMinutes;
		const roundedMinutes = Math.round(minutesHeight / 15) * 15;
		const startMinutes = Math.round(((newStartY / gridRect.height) * totalMinutes) / 15) * 15;

		entryRef.current.style.top = `${(startMinutes / totalMinutes) * 100}%`;
		entryRef.current.style.height = `${(roundedMinutes / totalMinutes) * 100}%`;
		entryRef.current.style.zIndex = "100";
	};

	const handleTopResizeEnd = async (e: MouseEvent) => {
		if (!isResizingTop || !entryRef.current) return;
		document.removeEventListener("mousemove", handleTopResizeMove);
		document.removeEventListener("mouseup", handleTopResizeEnd);

		const gridElement = entryRef.current.closest(".col-span-1");
		if (!gridElement) {
			setIsResizingTop(false);
			return;
		}

		try {
			const gridRect = gridElement.getBoundingClientRect();
			const entryRect = entryRef.current.getBoundingClientRect();
			const totalMinutes = 24 * 60;

			const startY = entryRect.top - gridRect.top;
			const height = entryRect.height;

			const startMinutes = Math.round(((startY / gridRect.height) * totalMinutes) / 15) * 15;
			const durationMinutes = Math.round(((height / gridRect.height) * totalMinutes) / 15) * 15;

			const constrainedStartMinutes = Math.max(0, startMinutes);
			const constrainedDuration = Math.max(15, Math.min(durationMinutes, totalMinutes - constrainedStartMinutes));

			const newStartTime = addMinutes(startOfDay(new Date(entry.date)), constrainedStartMinutes);
			const newEndTime = addMinutes(newStartTime, constrainedDuration);

			await updateTimeEntry({
				id: entry.id,
				data: {
					startTime: format(newStartTime, "yyyy-MM-dd'T'HH:mm:ss"),
					endTime: format(newEndTime, "yyyy-MM-dd'T'HH:mm:ss"),
					duration: constrainedDuration,
				},
			});

			if (onTimeSlotSelect) {
				onTimeSlotSelect({});
			}
		} catch (error) {
			console.error("Failed to resize entry:", error);
		}

		setIsResizingTop(false);
		// Reset only temporary resize styles, let component re-render with new data
		if (entryRef.current) {
			entryRef.current.style.top = "";
			entryRef.current.style.height = "";
			entryRef.current.style.zIndex = "";
		}
	};

	return (
		<ContextMenu>
			<ContextMenuTrigger asChild>
				<Popover open={isOpen} onOpenChange={setIsOpen}>
					<PopoverTrigger asChild>
						<div
							ref={entryRef}
							className={`
	            time-entry
	            absolute
	            text-white
	            rounded-md
	            shadow-sm
	            overflow-hidden
	            hover:shadow-lg
	            border-l-2 border-white/20
	            ${isDragging || isResizing || isResizingTop ? "dragging" : ""}
	            ${width < 1 ? "overlapping" : ""}
	            ${endSlot - startSlot < 60 ? "short" : ""}
	            ${isMainEntry ? "main-entry" : ""}
	            ${isStackedEntry ? "stacked-entry" : ""}
	            ${totalStacked > 3 ? "dense-stacked" : ""}
	          `}
							style={{
								top,
								height,
								left: `${left * 100}%`,
								width: `${width * 100}%`,
								backgroundColor: color,
								zIndex: isDragging || isResizing || isResizingTop ? 90 : isMainEntry ? 15 : isStackedEntry ? 12 + stackIndex : 10,
								transform: "translateZ(0)",
								boxSizing: "border-box",
								pointerEvents: "auto",
								minWidth: "60px",
								display: "flex",
								flexDirection: "column",
								borderRadius: "0.375rem",
								transformOrigin: "center",
								transition: "box-shadow 0.15s ease-out",
								backfaceVisibility: "hidden",
								boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.1)",
								cursor: isDragging ? "grabbing" : "grab",
							}}
							onMouseDown={handleMouseDown}>
							<div className="absolute top-0 left-0 right-0 h-2 cursor-ns-resize top-resize-handle" onMouseDown={handleTopResizeStart} />
							<div className={`flex flex-col h-full justify-between text-left max-w-full ${isStackedEntry ? "p-1" : "p-1.5"}`}>
								<div className="w-full overflow-hidden">
									<Typography className={`text-xs font-bold text-white/90 truncate block ${isStackedEntry ? "text-[10px]" : ""}`}>
										{isStackedEntry ? `${startTimeFormatted}` : startTimeFormatted}
									</Typography>
									{customerName && !isStackedEntry && (
										<Typography className="text-xs text-white/90 truncate block">{customerName}</Typography>
									)}
									{projectName && (
										<Typography className={`text-xs text-white/90 truncate block ${isStackedEntry ? "text-[9px]" : ""}`}>
											{isStackedEntry ? projectName.substring(0, 8) + (projectName.length > 8 ? "..." : "") : projectName}
										</Typography>
									)}
									{taskName && !isStackedEntry && <Typography className="text-xs text-white/90 truncate block">{taskName}</Typography>}
									{isStackedEntry && totalStacked > 3 && (
										<Typography className="text-[8px] text-white/70 truncate block">+{totalStacked - 1} more</Typography>
									)}
								</div>
								{duration >= 60 && !isStackedEntry && (
									<Typography className="text-xs font-semibold text-white/90 truncate block mt-auto">{durationFormatted} Hours</Typography>
								)}
								{isStackedEntry && (
									<Typography className="text-[8px] font-semibold text-white/80 truncate block mt-auto">
										{Math.round(duration / 60)}h
									</Typography>
								)}
							</div>
							<div className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize resize-handle" onMouseDown={handleResizeStart} />
						</div>
					</PopoverTrigger>
					<PopoverContent className="p-6 z-[100] w-auto min-w-[24rem] max-w-[32rem] bg-popover" align="start" sideOffset={8} style={{ zIndex: 1000 }}>
						<form
							className="flex flex-col space-y-4 w-full"
							onSubmit={(e) => {
								e.preventDefault();
								handleUpdate();
							}}>
							<div className="flex justify-between items-center mb-2">
								<h3 className="text-16 font-bold">{customerName || "Unknown Client"}</h3>
								<span className="text-14 text-muted-foreground">{durationFormatted}</span>
							</div>

							<div className="flex flex-wrap gap-2 mb-2">
								{projectName && <span className="px-2 py-1 bg-secondary rounded text-12">{projectName}</span>}
								{taskName && <span className="px-2 py-1 bg-secondary rounded text-12">{taskName}</span>}
							</div>

							<label className="flex flex-col">
								<span className="text-14 font-medium text-muted-foreground mb-1">Description:</span>
								<Textarea
									name="description"
									value={formState.description}
									onChange={handleFormChange}
									className="w-full h-24 px-3 py-2 mb-2"
									placeholder="Add description..."
								/>
							</label>

							<label className="flex flex-col">
								<span className="text-sm font-medium text-muted-foreground mb-1">Date:</span>
								<input
									type="date"
									name="entryDate"
									value={formState.entryDate}
									onChange={handleFormChange}
									className="w-full px-3 py-2 mb-2 border rounded-md"
								/>
							</label>

							<label className="flex flex-col">
								<span className="text-sm font-medium text-muted-foreground mb-1">Start Time:</span>
								<input
									type="time"
									name="startTime"
									value={formState.startTime}
									onChange={handleFormChange}
									className="w-full px-3 py-2 mb-2 border rounded-md"
								/>
							</label>

							<label className="flex flex-col">
								<span className="text-sm font-medium text-muted-foreground mb-1">Duration (minutes):</span>
								<input
									type="number"
									name="duration"
									value={formState.duration}
									onChange={handleFormChange}
									className="w-full px-3 py-2 mb-2 border rounded-md"
								/>
							</label>

							<div className="flex justify-end space-x-2 pt-2">
								<button
									type="button"
									onClick={handleDelete}
									className="px-4 py-2 text-14 font-medium bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/80 focus:outline-none focus:ring-2 focus:ring-ring">
									Delete
								</button>
								<button
									type="submit"
									className="px-4 py-2 text-14 font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/80 focus:outline-none focus:ring-2 focus:ring-ring"
									disabled={isLoading}>
									{isLoading ? <Spinner /> : "Save Changes"}
								</button>
							</div>
						</form>
					</PopoverContent>
				</Popover>
			</ContextMenuTrigger>
			<ContextMenuContent className="w-56">
				<ContextMenuItem onClick={(e: React.MouseEvent<HTMLDivElement>) => handleContextMenuAction("edit", e)} className="cursor-pointer">
					<Edit className="w-4 h-4 mr-2" />
					Edit Entry
				</ContextMenuItem>
				<ContextMenuItem
					onClick={(e: React.MouseEvent<HTMLDivElement>) => handleContextMenuAction("duplicate", e)}
					className="cursor-pointer"
					disabled={duplicateStatus === "pending"}>
					<Copy className="w-4 h-4 mr-2" />
					{duplicateStatus === "pending" ? "Duplicating..." : "Duplicate Entry"}
				</ContextMenuItem>
				<ContextMenuSeparator />
				<ContextMenuItem
					onClick={(e: React.MouseEvent<HTMLDivElement>) => handleContextMenuAction("delete", e)}
					className="cursor-pointer text-destructive focus:text-destructive">
					<Trash2 className="w-4 h-4 mr-2" />
					Delete Entry
				</ContextMenuItem>
			</ContextMenuContent>
		</ContextMenu>
	);
};
export default TimeEntryComponent;
