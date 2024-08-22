import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useEffect } from "react";
import { format } from "date-fns";
import { mockTimeEntries } from "../data/mockData";

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
	if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true") {
		// Use mock data instead of making a real API call
		const filteredEntries = mockTimeEntries.filter((entry) => {
			const matchesCustomer = filters.customerId ? entry.customerId === filters.customerId : true;
			const matchesStartDate = filters.startDate ? new Date(entry.date) >= new Date(filters.startDate) : true;
			const matchesEndDate = filters.endDate ? new Date(entry.date) <= new Date(filters.endDate) : true;
			const matchesInvoiced = filters.isInvoiced !== undefined ? entry.isInvoiced === filters.isInvoiced : true;
			return matchesCustomer && matchesStartDate && matchesEndDate && matchesInvoiced;
		});

		// Simulate pagination
		const startIndex = (page - 1) * pageSize;
		const endIndex = startIndex + pageSize;
		const paginatedEntries = filteredEntries.slice(startIndex, endIndex);

		return {
			entries: paginatedEntries,
			totalEntries: filteredEntries.length,
		};
	}

	// Default to real API logic if not in demo mode
	try {
		const params = new URLSearchParams({
			page: page.toString(),
			pageSize: pageSize.toString(),
			...(filters.startDate && { startDate: filters.startDate }),
			...(filters.endDate && { endDate: filters.endDate }),
			...(filters.customerId && { customerId: filters.customerId.toString() }),
			isInvoiced: filters.isInvoiced?.toString() ?? "false",
		});

		console.log("Fetching time entries with params:", params.toString());
		const response = await axios.get(`/api/timelog?${params.toString()}`);
		return response.data;
	} catch (error) {
		console.error("Error fetching time entries:", error);
		throw new Error("Error fetching time entries");
	}
};

export const useGetTimeEntries = (
	startDate?: Date,
	endDate?: Date,
	customerId?: number,
	isInvoiced: boolean = false,
	page: number = 1,
	pageSize: number = 10
) => {
	const queryClient = useQueryClient();
	const formattedStartDate = startDate ? format(startDate, "yyyy-MM-dd") : undefined;
	const formattedEndDate = endDate ? format(endDate, "yyyy-MM-dd") : undefined;

	const queryKey = ["time-entries", formattedStartDate, formattedEndDate, customerId, isInvoiced, page, pageSize].filter((key) => key !== undefined);

	const query = useQuery<{
		entries: TimeEntryData[];
		totalEntries: number;
	}>({
		queryKey,
		queryFn: () =>
			fetchTimeEntries(page, pageSize, {
				startDate: formattedStartDate,
				endDate: formattedEndDate,
				customerId,
				isInvoiced,
			}),
		refetchOnWindowFocus: true,
		retry: 3,
	});

	// Invalidate the query when filters change
	useEffect(() => {
		console.log("Invalidating query with key:", queryKey);
		queryClient.invalidateQueries({ queryKey });
	}, [formattedStartDate, formattedEndDate, customerId, isInvoiced, page, pageSize, queryClient]);

	return query;
};
