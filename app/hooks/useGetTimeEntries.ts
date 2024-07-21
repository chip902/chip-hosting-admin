import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export interface TimeEntryData {
	id: number;
	description: string | null;
	duration: number;
	date: string;
	userId: number;
	taskId: number;
	customerId: number;
	projectId: number;
	invoiceItemId: number | null;
	isInvoiced: boolean;
	Customer: {
		id: number;
		name: string;
		color: string;
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

interface Filters {
	startDate?: string;
	endDate?: string;
	customerId?: number;
	isInvoiced?: boolean;
}

const fetchTimeEntries = async (page: number, pageSize: number, filters: Filters) => {
	const params = new URLSearchParams({
		page: page.toString(),
		pageSize: pageSize.toString(),
		...(filters.startDate && { startDate: filters.startDate }),
		...(filters.endDate && { endDate: filters.endDate }),
		...(filters.customerId && { customerId: filters.customerId.toString() }),
		isInvoiced: filters.isInvoiced?.toString() ?? "false",
	});

	const response = await axios.get(`/api/timelog?${params.toString()}`);
	return response.data;
};

export const useGetTimeEntries = (
	startDate?: string,
	endDate?: string,
	customerId?: number,
	isInvoiced: boolean = false,
	page: number = 1,
	pageSize: number = 10
) => {
	return useQuery<{
		entries: TimeEntryData[];
		totalEntries: number;
	}>({
		queryKey: ["time-entries", startDate, endDate, customerId, isInvoiced, page, pageSize],
		queryFn: () => fetchTimeEntries(page, pageSize, { startDate, endDate, customerId, isInvoiced }),
		staleTime: 30 * 1000,
		retry: 3,
	});
};
