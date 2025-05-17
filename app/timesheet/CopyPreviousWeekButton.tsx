"use client";

import { Button } from "@/components/ui/button";
import { Copy, Loader2 } from "lucide-react";
import { useState } from "react";
import { subWeeks, endOfWeek } from "date-fns";
import axios from "axios";
import { toast } from "sonner";
import { TimeEntry, Customer, Project, Task, User } from "@/prisma/app/generated/prisma/client";

// Define a type for the API response that includes the related entities
type TimeEntryWithRelations = TimeEntry & {
	customer?: Customer | null;
	project?: Project | null;
	task?: Task | null;
	user?: User | null;
	startTime?: string | null;
	endTime?: string | null;
	customerId: number;
	projectId: number;
	taskId: number;
	userId: number;
	isInvoiced?: boolean;
	invoiceStatus?: string | null;
	isBillable?: boolean;
	color?: string | null;
	startSlot?: number | null;
	endSlot?: number | null;
	totalHours?: number | null;
	width?: number | null;
	left?: number | null;
};

// Type for creating a new time entry
type CreateTimeEntryInput = Omit<TimeEntry, "id" | "customer" | "project" | "task" | "user" | "invoiceItem" | "invoice"> & {
	customerId: number;
	projectId: number;
	taskId: number;
	userId: number;
};

interface CopyPreviousWeekButtonProps {
	currentStartDate: Date;
	onSuccess?: () => void;
}

export default function CopyPreviousWeekButton({ currentStartDate, onSuccess }: CopyPreviousWeekButtonProps) {
	const [isLoading, setIsLoading] = useState(false);

	const copyPreviousWeek = async () => {
		if (!confirm("This will copy all time entries from last week to this week. Continue?")) {
			return;
		}

		setIsLoading(true);
		try {
			// Calculate date ranges
			const previousWeekStart = subWeeks(currentStartDate, 1);
			const previousWeekEnd = endOfWeek(previousWeekStart, { weekStartsOn: 0 });

			// Get entries from previous week
			const response = await axios.get("/api/timelog", {
				params: {
					startDate: previousWeekStart.toISOString(),
					endDate: previousWeekEnd.toISOString(),
				},
			});

			const entries = response.data.entries || [];

			// Debug: Log the first entry to see its structure
			if (entries.length > 0) {
				console.log("First entry from API:", JSON.stringify(entries[0], null, 2));
			}

			if (entries.length === 0) {
				toast.info("No time entries were found for the previous week.");
				return;
			}

			// Prepare new entries for current week
			const newEntries = (entries as any[]).reduce<CreateTimeEntryInput[]>((acc, entry) => {
				try {
					const originalDate = new Date(entry.date);
					const dayOfWeek = originalDate.getDay(); // 0 (Sunday) to 6 (Saturday)

					// Calculate the same day in the current week
					const currentWeekStart = new Date(currentStartDate);
					const daysToAdd = (dayOfWeek - currentWeekStart.getDay() + 7) % 7;
					const newDate = new Date(currentWeekStart);
					newDate.setDate(currentWeekStart.getDate() + daysToAdd);

					// Copy the time from the original entry
					const startTime = new Date(entry.startTime);
					newDate.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);

					// Helper function to safely extract numeric IDs from various possible locations
					const extractId = (entry: any, paths: string[]): number | null => {
						for (const path of paths) {
							const value = path.split(".").reduce((obj, key) => obj?.[key], entry);
							if (value !== undefined && value !== null) {
								const num = Number(value);
								if (!isNaN(num)) return num;
							}
						}
						return null;
					};

					// Extract IDs from various possible locations in the response
					const customerId = extractId(entry, ["customerId", "customer.id"]);
					const projectId = extractId(entry, ["projectId", "project.id"]);
					const taskId = extractId(entry, ["taskId", "task.id"]);
					const userId = extractId(entry, ["userId"]) || 1; // Default to user ID 1 if not specified

					// Only include entries with all required IDs
					if (!customerId || !projectId || !taskId) {
						console.warn("Skipping entry due to missing required IDs:", { customerId, projectId, taskId, userId });
						return acc;
					}

					// Create a new time entry for the current week
					const newEntry: CreateTimeEntryInput = {
						date: newDate,
						description: entry.description || "",
						duration: entry.duration || 60, // Default to 60 minutes if not specified
						isBillable: entry.isBillable !== false, // Default to true if not specified
						customerId: customerId,
						projectId: projectId,
						taskId: taskId,
						userId: userId,
						endDate: null,
						invoiceItemId: null,
						invoiceId: null,
						isInvoiced: false,
						invoiceStatus: "draft",
						color: entry.color || "#000000",
						startSlot: 0,
						endSlot: 1,
						totalHours: 1,
						width: 100,
						left: 0,
					};
					acc.push(newEntry);
				} catch (error) {
					console.error("Error processing entry:", error);
				}
				return acc;
			}, []);

			if (newEntries.length === 0) {
				toast.warning("No valid time entries found to copy. Please check that all entries have customer, project, task, and user IDs.");
				return;
			}

			// Create new entries
			await Promise.all(newEntries.map((entry: any) => axios.post("/api/timelog", entry)));

			toast.success(`Successfully copied ${newEntries.length} time entries from last week.`);

			if (onSuccess) {
				onSuccess();
			}
		} catch (error) {
			console.error("Error copying previous week:", error);
			toast.error("Failed to copy time entries. Please try again.");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Button variant="outline" size="sm" onClick={copyPreviousWeek} disabled={isLoading} className="gap-2">
			{isLoading ? (
				<>
					<Loader2 className="h-4 w-4 animate-spin" />
					Copying...
				</>
			) : (
				<>
					<Copy className="h-4 w-4" />
					Copy Previous Week
				</>
			)}
		</Button>
	);
}
