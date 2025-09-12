"use client";
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import useUpdateTimeEntry from "@/app/hooks/useUpdateTimeEntry";
import useDeleteTimeEntry from "@/app/hooks/useDeleteTimeEntry";
import { toast } from "sonner";
import { TimeEntry } from "@/types";
import { format } from "date-fns";

interface EditTimeEntryModalProps {
	entry: TimeEntry | null;
	isOpen: boolean;
	onClose: () => void;
	onRefresh?: () => void;
}

export const EditTimeEntryModal: React.FC<EditTimeEntryModalProps> = ({ entry, isOpen, onClose, onRefresh }) => {
	const [isLoading, setIsLoading] = useState(false);
	const [formData, setFormData] = useState({
		description: "",
		duration: "",
		date: "",
		startTime: "",
	});

	const { mutate: updateTimeEntry } = useUpdateTimeEntry();
	const { mutate: deleteTimeEntry } = useDeleteTimeEntry();

	useEffect(() => {
		if (entry) {
			// Parse the start time from the entry
			const startDate = new Date(entry.date);
			const startTime = entry.startTime?.match(/T(\d{2}:\d{2})/) ? entry.startTime.match(/T(\d{2}:\d{2})/)![1] : format(startDate, "HH:mm");

			setFormData({
				description: entry.description || "",
				duration: entry.duration?.toString() || "60",
				date: format(startDate, "yyyy-MM-dd"),
				startTime: startTime,
			});
		}
	}, [entry]);

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	const handleSave = async () => {
		if (!entry) return;

		setIsLoading(true);
		try {
			// Convert form data to API format
			const startDate = new Date(`${formData.date}T${formData.startTime}`);
			const durationMinutes = parseInt(formData.duration, 10);

			if (isNaN(durationMinutes) || durationMinutes <= 0) {
				toast.error("Duration must be a positive number");
				setIsLoading(false);
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
						description: formData.description,
						startTime: startDate.toISOString(),
						endTime: endDate.toISOString(),
					},
				},
				{
					onSuccess: () => {
						toast.success("Entry updated successfully");
						onClose();
						onRefresh?.();
					},
					onError: (error) => {
						console.error("Failed to update entry:", error);
						toast.error("Failed to update entry");
					},
					onSettled: () => {
						setIsLoading(false);
					},
				}
			);
		} catch (error) {
			console.error("Error processing form data:", error);
			toast.error("Invalid form data");
			setIsLoading(false);
		}
	};

	const handleDelete = () => {
		if (!entry) return;

		if (window.confirm("Are you sure you want to delete this time entry? This action cannot be undone.")) {
			setIsLoading(true);
			deleteTimeEntry(
				{ id: entry.id },
				{
					onSuccess: () => {
						toast.success("Entry deleted successfully");
						onClose();
						onRefresh?.();
					},
					onError: (error) => {
						console.error("Failed to delete entry:", error);
						toast.error("Failed to delete entry");
					},
					onSettled: () => {
						setIsLoading(false);
					},
				}
			);
		}
	};

	const handleClose = () => {
		if (!isLoading) {
			onClose();
		}
	};

	if (!entry) return null;

	// Calculate duration display
	const duration = parseInt(formData.duration || "0");
	const hours = Math.floor(duration / 60);
	const mins = duration % 60;
	const durationFormatted = `${hours}:${mins.toString().padStart(2, "0")}`;

	// Extract display information
	const customerName = entry.customer?.name || "Unknown Client";
	const projectName = entry.project?.name || "";
	const taskName = entry.task?.name || "";

	return (
		<Dialog open={isOpen} onOpenChange={handleClose}>
			<DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="flex justify-between items-center">
						<span>Edit Time Entry</span>
						<span className="text-sm text-muted-foreground font-normal">{durationFormatted}</span>
					</DialogTitle>
				</DialogHeader>

				<div className="space-y-6 py-4">
					{/* Client and Project Info */}
					<div className="space-y-2">
						<h3 className="text-lg font-semibold">{customerName}</h3>
						<div className="flex flex-wrap gap-2">
							{projectName && <span className="px-3 py-1 bg-secondary rounded-md text-sm">{projectName}</span>}
							{taskName && <span className="px-3 py-1 bg-secondary rounded-md text-sm">{taskName}</span>}
						</div>
					</div>

					{/* Form Fields */}
					<div className="grid grid-cols-1 gap-4">
						<div className="space-y-2">
							<Label htmlFor="description">Description</Label>
							<Textarea
								id="description"
								name="description"
								value={formData.description}
								onChange={handleInputChange}
								className="min-h-[100px]"
								placeholder="Add description..."
							/>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="date">Date</Label>
								<Input
									id="date"
									name="date"
									type="date"
									value={formData.date}
									onChange={handleInputChange}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="startTime">Start Time</Label>
								<Input
									id="startTime"
									name="startTime"
									type="time"
									value={formData.startTime}
									onChange={handleInputChange}
								/>
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="duration">Duration (minutes)</Label>
							<Input
								id="duration"
								name="duration"
								type="number"
								min="1"
								value={formData.duration}
								onChange={handleInputChange}
								placeholder="60"
							/>
						</div>
					</div>
				</div>

				<DialogFooter className="flex justify-between">
					<Button
						variant="destructive"
						onClick={handleDelete}
						disabled={isLoading}
						className="mr-auto"
					>
						{isLoading ? <Spinner className="mr-2" /> : null}
						Delete
					</Button>
					<div className="space-x-2">
						<Button variant="outline" onClick={handleClose} disabled={isLoading}>
							Cancel
						</Button>
						<Button onClick={handleSave} disabled={isLoading}>
							{isLoading ? (
								<>
									<Spinner className="mr-2" />
									Saving...
								</>
							) : (
								"Save Changes"
							)}
						</Button>
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};