"use client";

import { Button } from "@/components/ui/button";
import { Copy, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { subWeeks, endOfWeek } from "date-fns";
import axios from "axios";
import { toast } from "sonner";
import { TimeEntry, Customer, Project, Task, User } from "@/prisma/app/generated/prisma/client";
import { TimeLogSchema } from "./LogTime";

interface CopyPreviousWeekButtonProps {
	currentStartDate: Date;
	onSuccess?: () => void;
}

export default function CopyPreviousWeekButton({ currentStartDate, onSuccess }: CopyPreviousWeekButtonProps) {
	const [isLoading, setIsLoading] = useState(false);
	const [customer, setCustomer] = useState<Customer[]>([]);
	const [project, setProject] = useState<Project[]>([]);
	const [task, setTask] = useState<Task[]>([]);
	const [user, setUser] = useState<User[]>([]);

	// Fetch data on component mount
	useEffect(() => {
		const fetchData = async () => {
			try {
				const response = await axios.get("/api/data");
				setCustomer(response.data.customers || []);
				setProject(response.data.projects || []);
				setTask(response.data.tasks || []);
				setUser(response.data.users || []);
			} catch (error) {
				console.error("Error fetching data:", error);
			}
		};

		fetchData();
	}, []);

	const copyPreviousWeek = async () => {
		if (!confirm("This will copy all time entries from last week to this week. Continue?")) {
			return;
		}

		setIsLoading(true);
		try {
			// Calculate date ranges
			const previousWeekStart = subWeeks(currentStartDate, 1);
			const previousWeekEnd = endOfWeek(previousWeekStart, { weekStartsOn: 0 });

			let allEntries: any[] = [];
			let page = 1;
			const pageSize = 100; // Adjust based on your API's max limit
			let hasMore = true;

			// Fetch all pages of entries
			while (hasMore) {
				const response = await axios.get("/api/timelog", {
					params: {
						startDate: previousWeekStart.toISOString(),
						endDate: previousWeekEnd.toISOString(),
						page,
						pageSize,
					},
				});

				const { entries = [], totalEntries = 0 } = response.data;

				if (entries.length > 0) {
					allEntries = [...allEntries, ...entries];
				}

				// Check if we've fetched all entries
				if (allEntries.length >= totalEntries || entries.length < pageSize) {
					hasMore = false;
				} else {
					page++;
				}

				// Prevent infinite loops
				if (page > 100) {
					// Safety check
					console.warn("Reached maximum page limit");
					break;
				}
			}

			// Debug: Log the number of entries found
			console.log(`Found ${allEntries.length} entries from the previous week`);

			if (allEntries.length === 0) {
				toast.info("No time entries were found for the previous week.");
				return;
			}

			// Prepare new entries for current week
			const newEntries = allEntries.reduce<TimeLogSchema[]>((acc, entry) => {
				try {
					const originalDate = new Date(entry.date);
					const dayOfWeek = originalDate.getDay(); // 0 (Sunday) to 6 (Saturday)

					// Calculate the same day in the current week
					const currentWeekStart = new Date(currentStartDate);
					const daysToAdd = (dayOfWeek - currentWeekStart.getDay() + 7) % 7;
					const newDate = new Date(currentWeekStart);
					newDate.setDate(currentWeekStart.getDate() + daysToAdd);

					// Extract time components from the original entry's startTime
					const originalStartTime = new Date(entry.startTime);
					const originalEndTime = new Date(entry.endTime);

					// Format the date as YYYY-MM-DD
					const formattedDate = newDate.toISOString().split("T")[0];

					// Format the time as HH:MM
					const formatTime = (date: Date) => {
						return `${String(date.getUTCHours()).padStart(2, "0")}:${String(date.getUTCMinutes()).padStart(2, "0")}`;
					};

					const startTime = formatTime(originalStartTime);
					const endTime = formatTime(originalEndTime);

					const customerId = entry.customer.id;
					const projectId = entry.project.id;
					const taskId = entry.task.id;
					const userId = entry.userId;

					// Only include entries with all required IDs
					if (!customerId || !projectId || !taskId || !userId) {
						console.warn("Skipping entry due to missing required IDs:", { customerId, projectId, taskId, userId });
						return acc;
					}

					// Create a new time entry for the current week
					const newEntry: TimeLogSchema = {
						date: formattedDate,
						description: entry.description || "",
						duration: entry.duration || 60,
						customerId: customerId,
						projectId: projectId,
						taskId: taskId,
						userId: userId,
						startTime: startTime,
						endTime: endTime,
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
