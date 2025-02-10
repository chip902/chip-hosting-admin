// hooks/usePlaidTransactions.ts
import { Transaction } from "@/types";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export interface TransactionsResponse {
	transactions: Transaction[];
}

export const usePlaidTransactions = (userId?: string) => {
	return useQuery<TransactionsResponse, Error>({
		queryKey: ["transactions", userId],
		queryFn: async () => {
			const response = await axios.get<TransactionsResponse>(`/api/transactions/get-transactions?userId=${userId}`, {
				data: { userId },
			});
			return response.data;
		},
		enabled: !!userId,
		staleTime: 5 * 60 * 1000,
		refetchOnWindowFocus: false,
		// Provide a default value if the query fails or returns no data
		select: (data) => ({
			transactions: data?.transactions || [],
		}),
	});
};
