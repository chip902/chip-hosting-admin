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

const fetchTimeEntries = async (startDate?: string, endDate?: string) => {
	const response = await axios
		.get("/api/timelog", {
			params: { startDate, endDate },
		})
		.then((res) => res.data);
	return response;
};

export const useGetTimeEntry = (startDate?: string, endDate?: string) => {
	return useQuery<TimeEntryData[]>({
		queryKey: ["timeEntries", startDate, endDate],
		queryFn: () => fetchTimeEntries(startDate, endDate),
		staleTime: 30 * 1000,
		retry: 3,
	});
};
