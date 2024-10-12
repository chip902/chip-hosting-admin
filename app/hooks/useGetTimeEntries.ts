// app/hooks/useGetTimeEntries.ts
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
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

	const queryKey = [
		"timeEntries",
		page,
		pageSize,
		startDate ? format(startDate, "yyyy-MM-dd") : undefined,
		endDate ? format(endDate, "yyyy-MM-dd") : undefined,
		customerId,
		isInvoiced,
		sortBy,
		sortOrder,
	];

	return useQuery<TimeEntryResponse>({
		queryKey,
		queryFn: async () => {
			const params: Record<string, string> = {
				page: page.toString(),
				pageSize: pageSize.toString(),
				...(startDate && { startDate: format(startDate, "yyyy-MM-dd") }),
				...(endDate && { endDate: format(endDate, "yyyy-MM-dd") }),
				...(customerId !== undefined && { customerId: customerId.toString() }),
				...(isInvoiced !== undefined && { isInvoiced: isInvoiced.toString() }),
				sortBy,
				sortOrder,
			};
			const queryString = new URLSearchParams(params).toString();
			console.log("Request URL to Endpoint: ", `/api/timelog?${queryString}`);
			const response = await axios.get(`/api/timelog?${queryString}`);
			return response.data;
		},
		staleTime: 5 * 60 * 1000, // 5 minutes
		refetchOnWindowFocus: false,
		refetchOnMount: false,
	});
};
