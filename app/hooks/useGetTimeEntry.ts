import { Invoice, TimeEntry } from "@prisma/client";
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
	customer: {
		id: number;
		name: string;
		color: string;
	};
	project: {
		id: number;
		name: string;
	};
	task: {
		id: number;
		name: string;
	};
	user: {
		id: number;
		name: string;
	};
}

const fetchTimeEntries = async (userId: number, filters: { customerId?: number; startDate?: string; endDate?: string }): Promise<TimeEntryData[]> => {
	const response = await axios.get("/api/timelog", {
		params: {
			userId,
			...filters,
		},
	});
	return response.data;
};

export const useGetTimeEntries = (userId: number, filters: { customerId?: number; startDate?: string; endDate?: string }) =>
	useQuery<TimeEntryData[]>({
		queryKey: ["time-entries", userId, filters],
		queryFn: () => fetchTimeEntries(userId, filters),
		staleTime: 60 * 1000,
		retry: 3,
	});

export const useGetTimeEntry = (startDate?: string, endDate?: string) => {
	return useQuery<TimeEntryData[]>({
		queryKey: ["timeEntries", startDate, endDate],
		queryFn: () => fetchTimeEntries(1, { startDate, endDate }),
		staleTime: 30 * 1000,
		retry: 3,
	});
};
