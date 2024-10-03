// app/hooks/useGetTimeEntries.ts
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useEffect } from "react";
import { format } from "date-fns";
import { TimeEntryData } from "@/types";

interface QueryParams {
	customerId?: number;
	startDate?: Date;
	endDate?: Date;
	isInvoiced?: boolean;
	pageSize: number;
	page: number;
	sortBy?: string;
	sortOrder?: "asc" | "desc";
}

interface TimeEntryResponse {
	length: number;
	entries: TimeEntryData[];
	totalEntries: number;
}

export const useGetTimeEntries = ({ page, pageSize, startDate, endDate, customerId, isInvoiced, sortBy = "date", sortOrder = "desc" }: QueryParams) => {
	const queryClient = useQueryClient();

	// Ensure queryKey only contains relevant values
	const queryKey = [
		"timeEntries",
		page,
		pageSize,
		startDate ? startDate.toISOString() : undefined, // Convert dates to ISO strings
		endDate ? endDate.toISOString() : undefined, // Convert dates to ISO strings
		customerId !== undefined ? customerId : undefined, // Include customerId only if it's defined
		isInvoiced !== undefined ? isInvoiced : undefined,
		sortBy,
		sortOrder,
	].filter((key) => key !== undefined);

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
				...(isInvoiced !== undefined ? { isInvoiced: isInvoiced.toString() } : {}),
				sortBy,
				sortOrder,
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
	const params = new URLSearchParams();
	if (filters.startDate) {
		params.append("startDate", filters.startDate);
	}
	if (filters.endDate) {
		params.append("endDate", filters.endDate);
	}
	if (filters.customerId) {
		params.append("customerId", filters.customerId);
	}
	if (filters.isInvoiced !== undefined) {
		params.append("isInvoiced", filters.isInvoiced);
	}

	// Always add page and pageSize params
	params.append("page", page.toString());
	params.append("pageSize", pageSize.toString());

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
