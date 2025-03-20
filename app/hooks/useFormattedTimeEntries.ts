// hooks/useFormattedTimeEntries.ts

import { ProcessedTimeEntry, TimeEntry } from "@/types";
import { format } from "date-fns";
import { useMemo } from "react";

export function useFormattedTimeEntries(timeEntries: TimeEntry[], userId: number | string): ProcessedTimeEntry[] {
	return useMemo(() => {
		const formattedEntries: ProcessedTimeEntry[] = timeEntries.map((entry) => {
			// Convert date strings to Date objects if they are not already
			const startDate = typeof entry.date === "string" ? new Date(entry.date) : entry.date;
			const endDate = typeof entry.endTime === "string" ? new Date(entry.endTime) : entry.endTime;

			const startTime = format(startDate, "yyyy-MM-dd'T'HH:mm:ss'Z'");
			const endTime = format(endDate, "HH:mm:ss");

			// Placeholder values for missing properties
			const isBillable = true; // Or any logic to determine if it's billable
			const color = entry.customer.color;
			const name = entry.task.name || "Unknown Task"; // Use task name or a default value

			return {
				id: entry.id,
				date: format(startDate, "yyyy-MM-dd"),
				startTime,
				endTime,
				customer: entry.customer,
				project: entry.project,
				task: entry.task,
				isInvoiced: entry.isInvoiced,
				duration: entry.duration,
				user: entry.user,
				invoiceStatus: entry.isInvoiced,
				userId,
				isBillable,
				color,
				name,
			};
		});

		return formattedEntries;
	}, [timeEntries, userId]);
}
