import { useQuery } from "@tanstack/react-query";
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
	const queryKey = ["timeEntries", page, pageSize, startDate?.toISOString(), endDate?.toISOString(), customerId, isInvoiced, sortBy, sortOrder];

	return useQuery<TimeEntryResponse>({
		queryKey,
		queryFn: async () => {
			const params = new URLSearchParams({
				page: page.toString(),
				pageSize: pageSize.toString(),
				sortBy,
				sortOrder,
				...(startDate && { startDate: format(startDate, "yyyy-MM-dd") }),
				...(endDate && { endDate: format(endDate, "yyyy-MM-dd") }),
				...(customerId !== undefined && { customerId: customerId.toString() }),
				...(isInvoiced !== undefined && { isInvoiced: isInvoiced.toString() }),
			});

			const url = `/api/timelog?${params.toString()}`;

			const response = await axios.get<TimeEntryResponse>(url);

			if (!response.data || !Array.isArray(response.data.entries)) {
				throw new Error("Invalid response format");
			}

			return response.data;
		},
		refetchOnWindowFocus: false,
		retry: 3,
	});
};
