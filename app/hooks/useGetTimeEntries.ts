// app/hooks/useGetTimeEntries.ts
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useEffect } from "react";
import { format } from "date-fns";

export interface TimeEntryData {
	id: number;
	description: string | null;
	duration: number;
	date: string;
	userId: number;
	taskId: number;
	customerid: number;
	projectId: number;
	invoiceItemId: number | null;
	isInvoiced: boolean;
	Customer: { id: number; name: string; color: string };
	Project: { id: number; name: string };
	Task: { id: number; name: string };
	User: { id: number; name: string };
}

interface QueryParams {
	customerId?: number;
	startDate?: Date;
	endDate?: Date;
	isInvoiced?: boolean;
	pageSize: number;
	page: number;
}

interface TimeEntryResponse {
	length: number;
	entries: TimeEntryData[];
	totalEntries: number;
}

export const useGetTimeEntries = ({ page, pageSize, startDate, endDate, customerId, isInvoiced }: QueryParams) => {
	const queryClient = useQueryClient();

	// Ensure queryKey only contains relevant values
	const queryKey = [
		"timeEntries",
		page,
		pageSize,
		startDate ? startDate.toISOString() : undefined, // Convert dates to ISO strings
		endDate ? endDate.toISOString() : undefined, // Convert dates to ISO strings
		customerId !== undefined ? customerId : undefined, // Include customerId only if it's defined
		isInvoiced,
	].filter((key) => key !== undefined); // Remove any undefined keys from the queryKey

	const formattedStartDate = startDate ? format(startDate, "yyyy-MM-dd") : undefined;
	const formattedEndDate = endDate ? format(endDate, "yyyy-MM-dd") : undefined;

	const query = useQuery<TimeEntryResponse>({
		queryKey, // Pass queryKey as the key for this query
		queryFn: async () => {
			const params: Record<string, string> = {
				page: page.toString(),
				pageSize: pageSize.toString(),
				...(formattedStartDate && { startDate: formattedStartDate }),
				...(formattedEndDate && { endDate: formattedEndDate }),
				...(customerId !== undefined ? { customerId: customerId.toString() } : {}),
				isInvoiced: isInvoiced?.toString() ?? "false",
			};
			const queryString = new URLSearchParams(params).toString();
			console.log("Request URL to Endpoint: ", `/api/timelog?${queryString}`);
			const result = await fetchTimeEntries(page, pageSize, params);
			return result;
		},
		refetchOnWindowFocus: true,
		retry: 3,
	});

	useEffect(() => {
		console.log("Invalidating query with key:", queryKey);
		queryClient.invalidateQueries({ queryKey });
	}, [queryKey, queryClient]);

	return query;
};

// Fetch function with consistent return type
async function fetchTimeEntries(
	page: number,
	pageSize: number,
	filters: { startDate?: string; endDate?: string; customerId?: string; isInvoiced?: string }
): Promise<TimeEntryResponse> {
	const params = new URLSearchParams({
		page: page.toString(),
		pageSize: pageSize.toString(),
		...(filters.startDate && { startDate: filters.startDate }),
		...(filters.endDate && { endDate: filters.endDate }),
		...(filters.customerId && { customerId: filters.customerId }),
		isInvoiced: filters.isInvoiced ?? "false",
	});

	try {
		console.log("Request URL to Endpoint: ", `/api/timelog?${params.toString()}`);
		const response = await axios.get(`/api/timelog?${params.toString()}`);

		if (!response.data || !Array.isArray(response.data.entries)) {
			throw new Error("Invalid response format");
		}

		return {
			length: response.data.entries.length,
			entries: response.data.entries,
			totalEntries: response.data.totalEntries ?? response.data.entries.length,
		};
	} catch (error) {
		console.error("Error fetching time entries:", error);
		throw new Error("Error fetching time entries");
	}
}
