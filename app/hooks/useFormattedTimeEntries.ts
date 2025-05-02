// hooks/useFormattedTimeEntries.ts
import { ProcessedTimeEntry, TimeEntry } from "@/types";
import { format } from "date-fns";
import { useMemo } from "react";

export function useFormattedTimeEntries(timeEntries: TimeEntry[], userId: number | string): ProcessedTimeEntry[] {
	return useMemo(() => {
		const formattedEntries = timeEntries.map((entry) => {
			// Convert date strings to Date objects if they are not already
			const startDate = typeof entry.date === "string" ? new Date(entry.date) : entry.date;
			const endDate = typeof entry.endTime === "string" ? new Date(entry.endTime) : entry.endTime;

			// Format times
			const startTime = format(startDate, "yyyy-MM-dd'T'HH:mm:ss'Z'");
			const endTime = format(endDate, "HH:mm:ss");

			// Calculate any derived values
			const customerName = entry.customer?.name || "";
			const projectName = entry.project?.name || "";
			const taskName = entry.task?.name || "Unknown Task";

			// Create a properly typed ProcessedTimeEntry
			const processedEntry: ProcessedTimeEntry = {
				id: entry.id,
				date: format(startDate, "yyyy-MM-dd"),
				startTime,
				endTime,
				customerName,
				projectName,
				taskName,
				width: 1, // Set appropriate value or calculate based on duration
				left: 0, // Set appropriate value or calculate based on start time
				startSlot: null, // Set appropriate value if available
				endSlot: null, // Set appropriate value if available
				duration: entry.duration,
				description: entry.description || "", // Assuming TimeEntry may have a description field
				customer: { name: entry.customer?.name || "" },
				project: { name: entry.project?.name || "" },
				task: { name: entry.task?.name || "" },
				isInvoiced: entry.isInvoiced,
				invoiceStatus: entry.isInvoiced,
				userId,
				isBillable: true, // Or retrieve from entry if available
				color: entry.customer?.color || "#000000",
				name: taskName,
				zIndex: 1, // Default value, adjust as needed
				className: "", // Default value, adjust as needed
			};

			return processedEntry;
		});

		return formattedEntries;
	}, [timeEntries, userId]);
}

// Helper function to calculate duration (implement based on your requirements)
function calculateDuration(startTime: Date, endTime: Date): number {
	if (!endTime) return 0; // Or throw an error as needed
	const timeDiff = endTime.getTime() - startTime.getTime();
	const hoursDiff = timeDiff / (3600 * 1000);
	return Math.round(hoursDiff * 60); // Adjust based on whether you want minutes or decimals
}
