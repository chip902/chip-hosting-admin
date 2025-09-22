import React, { useState, useRef, useCallback } from "react";
import useDeleteTimeEntry from "@/app/hooks/useDeleteTimeEntry";
import useUpdateTimeEntry from "@/app/hooks/useUpdateTimeEntry";
import useDuplicateTimeEntry from "@/app/hooks/useDuplicateTimeEntry";
import { type TimeEntry } from "@/types";
import { createPortal } from "react-dom";
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
		return matches ? `${matches[1]}:${matches[2]}` : "";
	} catch {
		return "";
	}
};

interface TimeEntryComponentProps {
	entry: TimeEntry;
	top: number;
	height: number;
	left: number;
	width: number;
	color: string;
	isDialogOpen?: boolean;
	calculatedZIndex: number;
	isStackedEntry?: boolean;
	stackIndex?: number;
	totalStacked?: number;
	isMainEntry?: boolean;
	endSlot: number;
	startSlot: number;
	onTimeSlotSelect?: (data: any) => void;
}

const TimeEntryComponent: React.FC<TimeEntryComponentProps> = ({
	entry,
	top,
	height,
	left,
	width,
	color,
	isDialogOpen = false,
	calculatedZIndex,
	isStackedEntry = false,
	stackIndex = 0,
	totalStacked = 1,
	isMainEntry = false,
	endSlot,
	startSlot,
	onTimeSlotSelect,
}) => {
	// Simple state management
	const [isOpen, setIsOpen] = useState(false);
	const [isHovered, setIsHovered] = useState(false);
	const [isDragging, setIsDragging] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	
	// Form state
	const [formState, setFormState] = useState({
		description: entry.description || "",
		entryDate: new Date(entry.startTime).toISOString().split("T")[0],
		duration: entry.duration?.toString() || "60",
		startTime: entry.startTime?.match(/T(\d{2}:\d{2})/) ? entry.startTime.match(/T(\d{2}:\d{2})/)![1] : "09:00",
	});

	// Refs
	const entryRef = useRef<HTMLDivElement>(null);
	const dragState = useRef({ 
		isDragging: false, 
		startX: 0, 
		startY: 0, 
		initialTop: 0 
	});

	// Mutations
	const { mutate: deleteTimeEntry } = useDeleteTimeEntry();
	const { mutate: updateTimeEntry } = useUpdateTimeEntry();
	const { mutate: duplicateTimeEntry, status: duplicateStatus } = useDuplicateTimeEntry();

	// Computed values
	const startTimeFormatted = parseISOForDisplay(entry.startTime);
	const duration = entry.duration || 60;
	const hours = Math.floor(duration / 60);
	const mins = duration % 60;
	const durationFormatted = `${hours}:${mins.toString().padStart(2, "0")}`;
	const projectName = entry.project?.name || "";
	const taskName = entry.task?.name || "";
	const customerName = entry.customer?.name || "";

	// Simple drag handling
	const handleMouseDown = useCallback((e: React.MouseEvent) => {
		// Skip if dialog is open or it's a right click
		if (isDialogOpen || e.button !== 0) return;
		
		// Skip if clicking on interactive elements
		const target = e.target as HTMLElement;
		if (target.closest("button") || target.closest("input") || target.closest("textarea")) {
			return;
		}

		console.log("Starting potential drag");
		
		dragState.current = {
			isDragging: false,
			startX: e.clientX,
			startY: e.clientY,
			initialTop: top
		};

		const handleMouseMove = (moveEvent: MouseEvent) => {
			const deltaX = Math.abs(moveEvent.clientX - dragState.current.startX);
			const deltaY = Math.abs(moveEvent.clientY - dragState.current.startY);
			
			// Start dragging if moved more than 5 pixels
			if (!dragState.current.isDragging && (deltaX > 5 || deltaY > 5)) {
				console.log("Drag started");
				dragState.current.isDragging = true;
				setIsDragging(true);
				document.body.style.cursor = "grabbing";
				document.body.style.userSelect = "none";
			}

			if (dragState.current.isDragging) {
				console.log("Dragging...");
				// Simple drag logic - just update position
				const deltaPixels = moveEvent.clientY - dragState.current.startY;
				const newTop = dragState.current.initialTop + deltaPixels;
				
				if (entryRef.current) {
					entryRef.current.style.top = `${newTop}px`;
					entryRef.current.style.zIndex = "999";
				}
			}
		};

		const handleMouseUp = () => {
			console.log("Mouse up, was dragging:", dragState.current.isDragging);
			
			if (dragState.current.isDragging) {
				// Handle drag end - update the entry
				console.log("Drag ended");
				
				// Reset styles
				if (entryRef.current) {
					entryRef.current.style.top = "";
					entryRef.current.style.zIndex = "";
				}
				
				// Reset state
				setIsDragging(false);
				document.body.style.cursor = "";
				document.body.style.userSelect = "";
				
				// Here you would normally update the entry position
				// For now, just refresh the data
				if (onTimeSlotSelect) {
					setTimeout(() => onTimeSlotSelect({}), 10);
				}
			}
			
			// Clean up event listeners
			document.removeEventListener("mousemove", handleMouseMove);
			document.removeEventListener("mouseup", handleMouseUp);
		};

		// Add event listeners
		document.addEventListener("mousemove", handleMouseMove);
		document.addEventListener("mouseup", handleMouseUp);
	}, [top, isDialogOpen, onTimeSlotSelect]);

	// Simple click handling for popover
	const handleClick = useCallback((e: React.MouseEvent) => {
		// Only open popover if we didn't drag
		if (!dragState.current.isDragging) {
			console.log("Opening popover");
			e.stopPropagation();
			setIsOpen(true);
		}
	}, []);

	// Form handlers
	const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		const { name, value } = e.target;
		setFormState(prev => ({ ...prev, [name]: value }));
	};

	const handleUpdate = async () => {
		try {
			setIsLoading(true);
			const updatedData = {
				description: formState.description,
				date: formState.entryDate,
				startTime: `${formState.entryDate}T${formState.startTime}:00`,
				duration: parseInt(formState.duration),
			};

			await updateTimeEntry({ id: entry.id, data: updatedData });
			setIsOpen(false);
			if (onTimeSlotSelect) onTimeSlotSelect({});
		} catch (error) {
			console.error("Failed to update entry:", error);
		} finally {
			setIsLoading(false);
		}
	};

	const handleDelete = async () => {
		if (window.confirm("Are you sure you want to delete this time entry?")) {
			try {
				setIsLoading(true);
				await deleteTimeEntry({ id: entry.id });
				setIsOpen(false);
				if (onTimeSlotSelect) onTimeSlotSelect({});
			} catch (error) {
				console.error("Failed to delete entry:", error);
			} finally {
				setIsLoading(false);
			}
		}
	};

	const handleContextMenuAction = (action: string, e: React.MouseEvent<HTMLDivElement>) => {
		e.preventDefault();
		switch (action) {
			case "edit":
				setIsOpen(true);
				break;
			case "duplicate":
				duplicateTimeEntry(entry.id);
				break;
			case "delete":
				handleDelete();
				break;
		}
	};

	return (
		<>
			<ContextMenu>
				<ContextMenuTrigger asChild>
					<div
						ref={entryRef}
						className={`
							time-entry absolute text-white rounded-md shadow-sm overflow-hidden
							hover:shadow-lg border-l-2 border-white/20 cursor-grab
							${isDragging ? "dragging cursor-grabbing" : ""}
							${isStackedEntry ? "stacked-entry" : ""}
						`}
						style={{
							top,
							height,
							left: `${left * 100}%`,
							width: `${width * 100}%`,
							backgroundColor: color,
							zIndex: isDragging ? 999 : isHovered ? calculatedZIndex + 50 : calculatedZIndex,
							transform: isHovered && !isDragging ? "scale(1.02)" : "scale(1)",
							transition: isDragging ? "none" : "all 0.15s ease-out",
							minWidth: "60px",
							display: "flex",
							flexDirection: "column",
							pointerEvents: "auto",
						}}
						onMouseDown={handleMouseDown}
						onClick={handleClick}
						onMouseEnter={() => setIsHovered(true)}
						onMouseLeave={() => setIsHovered(false)}
					>
						<div className={`flex flex-col h-full justify-between text-left max-w-full ${isStackedEntry ? "p-1" : "p-1.5"}`}>
							<div className="w-full overflow-hidden">
								<Typography className={`text-xs font-bold text-white/90 truncate block ${isStackedEntry ? "text-[10px]" : ""}`}>
									{startTimeFormatted}
								</Typography>
								{customerName && !isStackedEntry && (
									<Typography className="text-xs text-white/80 truncate block mb-1">
										{customerName}
									</Typography>
								)}
								{projectName && !isStackedEntry && (
									<Typography className="text-xs text-white/70 truncate block mb-1">
										{projectName}
									</Typography>
								)}
							</div>
							<div className="w-full">
								<Typography className={`text-xs text-white/90 truncate block ${isStackedEntry ? "text-[10px]" : ""}`}>
									{isStackedEntry && totalStacked > 1 ? `+${totalStacked - 1}` : durationFormatted}
								</Typography>
							</div>
						</div>
					</div>
				</ContextMenuTrigger>
				
				<ContextMenuContent className="w-56">
					<ContextMenuItem onClick={(e) => handleContextMenuAction("edit", e)} className="cursor-pointer">
						<Edit className="w-4 h-4 mr-2" />
						Edit Entry
					</ContextMenuItem>
					<ContextMenuItem
						onClick={(e) => handleContextMenuAction("duplicate", e)}
						className="cursor-pointer"
						disabled={duplicateStatus === "pending"}
					>
						<Copy className="w-4 h-4 mr-2" />
						Duplicate Entry
					</ContextMenuItem>
					<ContextMenuSeparator />
					<ContextMenuItem
						onClick={(e) => handleContextMenuAction("delete", e)}
						className="cursor-pointer text-destructive focus:text-destructive"
					>
						<Trash2 className="w-4 h-4 mr-2" />
						Delete Entry
					</ContextMenuItem>
				</ContextMenuContent>
			</ContextMenu>
			
			{/* Simple popover */}
			{isOpen && typeof document !== 'undefined' && createPortal(
				<div 
					className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50"
					onClick={() => setIsOpen(false)}
				>
					<div
						className="bg-white border rounded-lg shadow-lg p-6 w-96 max-h-[80vh] overflow-y-auto m-4"
						onClick={(e) => e.stopPropagation()}
					>
						<form
							className="flex flex-col space-y-4"
							onSubmit={(e) => {
								e.preventDefault();
								handleUpdate();
							}}
						>
							<div className="flex justify-between items-center mb-2">
								<h3 className="text-lg font-bold">{customerName || "Edit Time Entry"}</h3>
								<button
									type="button"
									onClick={() => setIsOpen(false)}
									className="text-gray-500 hover:text-gray-700"
								>
									×
								</button>
							</div>
							
							<label className="flex flex-col">
								<span className="text-sm font-medium mb-1">Description:</span>
								<Textarea
									name="description"
									value={formState.description}
									onChange={handleFormChange}
									className="w-full p-2 border rounded-md"
									rows={3}
								/>
							</label>

							<label className="flex flex-col">
								<span className="text-sm font-medium mb-1">Date:</span>
								<input
									type="date"
									name="entryDate"
									value={formState.entryDate}
									onChange={handleFormChange}
									className="w-full p-2 border rounded-md"
								/>
							</label>

							<label className="flex flex-col">
								<span className="text-sm font-medium mb-1">Start Time:</span>
								<input
									type="time"
									name="startTime"
									value={formState.startTime}
									onChange={handleFormChange}
									className="w-full p-2 border rounded-md"
								/>
							</label>

							<label className="flex flex-col">
								<span className="text-sm font-medium mb-1">Duration (minutes):</span>
								<input
									type="number"
									name="duration"
									value={formState.duration}
									onChange={handleFormChange}
									className="w-full p-2 border rounded-md"
								/>
							</label>

							<div className="flex justify-end space-x-2 pt-4">
								<button
									type="button"
									onClick={handleDelete}
									className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-md hover:bg-red-700"
								>
									Delete
								</button>
								<button
									type="submit"
									className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700"
									disabled={isLoading}
								>
									{isLoading ? <Spinner /> : "Save Changes"}
								</button>
							</div>
						</form>
					</div>
				</div>,
				document.body
			)}
		</>
	);
};

export default TimeEntryComponent;
