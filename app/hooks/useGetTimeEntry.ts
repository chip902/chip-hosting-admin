import { TimeEntry } from "@/types";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

const fetchTimeEntry = async (userId: number, filters: any, isInvoiced: boolean) => {
	const response = await axios.get("/api/timelog", {
		params: {
			userId,
			...filters,
			isInvoiced,
		},
	});
	return response.data;
};

export const useGetTimeEntry = (startDate?: string, endDate?: string, customerId?: number, page?: number, pageSize?: number, isInvoiced: boolean = false) => {
	return useQuery<{
		entries: TimeEntry[];
		totalEntries: number;
	}>({
		queryKey: ["time-entries", startDate, endDate, customerId, isInvoiced, page, pageSize],
		queryFn: () => fetchTimeEntry(0, { startDate, endDate, customerId }, isInvoiced),
		refetchOnWindowFocus: true,
		retry: 3,
	});
};
