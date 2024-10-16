import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Transaction } from "@/types";

export const usePlaidTransactions = (userId: string) => {
	return useQuery<Transaction[]>({
		queryKey: ["plaidTransactions", userId],
		queryFn: async () => {
			const response = await axios.get<Transaction[]>(`/api/transactions/get-transactions?userId=${userId}`);
			return response.data;
		},
		enabled: !!userId,
	});
};
