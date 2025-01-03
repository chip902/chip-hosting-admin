import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Transaction } from "@/types";

export const usePlaidTransactions = (userId: string | null | undefined) => {
	return useQuery<Transaction[], Error>({
		queryKey: ["plaidTransactions", userId],
		queryFn: async () => {
			try {
				const response = await axios.get<Transaction[]>(`/api/transactions/get-transactions?userId=${userId}`);
				return response.data;
			} catch (error) {
				if (axios.isAxiosError(error) && error.response) {
					throw new Error(error.response.data.error || "An error occurred while fetching transactions");
				}
				throw error;
			}
		},
		enabled: !!userId,
		staleTime: 15 * 60, // Adjusted stale time to every 15 minutes
		refetchInterval: 30 * 60 * 1000, // Refetch every 30 minutes
		retry: 3,
	});
};
