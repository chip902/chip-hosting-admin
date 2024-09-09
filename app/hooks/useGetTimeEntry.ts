import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export interface TimeEntryData {
	id: number;
	description: string | null;
	duration: number | undefined;
	date: string;
	userId: number;
	taskId: number;
	customerId: number;
	projectId: number;
	invoiceItemId: number | null;
	isInvoiced: boolean;
	shortname: string;
	Customer: {
		id: number;
		name: string;
		color: string;
		shortname: string;
	};
	Project: {
		id: number;
		name: string;
	};
	Task: {
		id: number;
		name: string;
	};
	User: {
		id: number;
		name: string;
	};
}

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
		entries: TimeEntryData[];
		totalEntries: number;
	}>({
		queryKey: ["time-entries", startDate, endDate, customerId, isInvoiced, page, pageSize],
		queryFn: () => fetchTimeEntry(0, { startDate, endDate, customerId }, isInvoiced),
		refetchOnWindowFocus: true,
		retry: 3,
	});
};
