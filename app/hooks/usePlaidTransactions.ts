import { Transaction } from "@/types";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export const usePlaidTransactions = (userId?: string) => {
	return useQuery<Transaction[]>({
		queryKey: ["transactions", userId],
		queryFn: async () => {
			const response = await axios.get<Transaction[]>(`/api/transactions/get-transactions?userId=${userId}`);
			// Sort transactions by date (newest first)
			return response.data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
		},
		enabled: !!userId,
		staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
	});
};
