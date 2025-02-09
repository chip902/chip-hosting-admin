import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { GetAccountsResult } from "@/types";

export const usePlaidBanks = (userId: string | null | undefined) => {
	return useQuery<GetAccountsResult>({
		queryKey: ["plaidBanks", userId],
		queryFn: async () => {
			if (!userId) {
				throw new Error("User ID is required");
			}
			const response = await axios.get<GetAccountsResult>(`/api/bank/get-accounts?userId=${userId}`, {
				data: userId,
			});
			return response.data;
		},
		enabled: !!userId,
		staleTime: 15 * 60, // Adjusted stale time to every 15 minutes
		refetchInterval: 30 * 60 * 1000, // Refetch every 30 minutes
		retry: 3,
		refetchOnWindowFocus: false,
	});
};
