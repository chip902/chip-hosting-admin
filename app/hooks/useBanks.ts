// app/hooks/useBanks.ts
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { GetAccountsResult } from "@/types";

/**
 * Unified hook for fetching bank data that combines both Plaid and database information
 * @param userId - The user's ID
 * @returns Query result containing bank accounts and related data
 */
export const useBanks = (userId: string | null | undefined) => {
	return useQuery<GetAccountsResult>({
		queryKey: ["banks", userId],
		queryFn: async () => {
			if (!userId) {
				throw new Error("User ID is required");
			}
			const response = await axios.get<GetAccountsResult>(`/api/bank/get-accounts?userId=${userId}`);
			return response.data;
		},
		enabled: !!userId,
		staleTime: 15 * 60 * 1000, // 15 minutes in milliseconds
		refetchInterval: 30 * 60 * 1000, // 30 minutes in milliseconds
		retry: 3,
		refetchOnWindowFocus: false,
	});
};

// If you need just the raw bank data without Plaid information, you can export this function
export const useRawBanks = (userId: string | null | undefined) => {
	return useQuery({
		queryKey: ["rawBanks", userId],
		queryFn: async () => {
			if (!userId) {
				throw new Error("User ID is required");
			}
			const response = await axios.get(`/api/bank/get-banks?userId=${userId}`);
			return response.data;
		},
		enabled: !!userId,
		staleTime: 15 * 60 * 1000,
		refetchInterval: 30 * 60 * 1000,
		retry: 3,
		refetchOnWindowFocus: false,
	});
};
