// app/hooks/useGetTimeEntries.ts
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { format } from "date-fns";
import { TimeEntry } from "@/types";

interface QueryParams {
	customerId?: number;
	startDate?: Date;
	endDate?: Date;
	invoiceStatus?: string | boolean;
	isInvoiced?: string | boolean;
	pageSize: number;
	page: number;
	sortBy?: string;
	sortOrder?: "asc" | "desc";
}

interface TimeEntryResponse {
	length: number;
	entries: TimeEntry[];
	totalEntries: number;
}

export const useGetTimeEntries = ({ page, pageSize, startDate, endDate, customerId, invoiceStatus, sortBy = "date", sortOrder = "desc" }: QueryParams) => {
	const queryKey = [
		"timeEntries",
		page,
		pageSize,
		startDate ? format(startDate, "yyyy-MM-dd") : undefined,
		endDate ? format(endDate, "yyyy-MM-dd") : undefined,
		customerId,
		invoiceStatus,
		sortBy,
		sortOrder,
	];

	return useQuery<TimeEntryResponse>({
		queryKey,
		queryFn: async () => {
			const params = new URLSearchParams({
				page: page.toString(),
				pageSize: pageSize.toString(),
				...(startDate && { startDate: format(startDate, "yyyy-MM-dd") }),
				...(endDate && { endDate: format(endDate, "yyyy-MM-dd") }),
				...(customerId !== undefined && { customerId: customerId.toString() }),
				...(invoiceStatus !== undefined && { invoiceStatus: invoiceStatus.toString() }),
				sortBy,
				sortOrder,
			});
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
