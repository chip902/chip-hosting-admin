import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useEffect } from "react";

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
		shortname: string | undefined;
		shortName: string | undefined;
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
	try {
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
	} catch (error) {
		console.error("Error fetching time entries:", error);
		throw new Error("Error fetching time entries");
	}
};

export const useGetTimeEntries = (
	startDate?: string,
	endDate?: string,
	customerId?: number,
	isInvoiced: boolean = false,
	page: number = 1,
	pageSize: number = 10
) => {
	const queryClient = useQueryClient();
	const queryKey = ["time-entries", startDate, endDate, customerId, isInvoiced, page, pageSize].filter((key) => key !== undefined);
	const query = useQuery<{
		entries: TimeEntryData[];
		totalEntries: number;
	}>({
		queryKey,
		queryFn: () =>
			fetchTimeEntries(page, pageSize, {
				startDate,
				endDate,
				customerId,
				isInvoiced,
			}),
		refetchOnWindowFocus: true,
		retry: 3,
	});

	// Invalidate the query when filters change
	useEffect(() => {
		queryClient.invalidateQueries({ queryKey });
	}, [startDate, endDate, customerId, isInvoiced, page, pageSize, queryClient]);

	return query;
};
