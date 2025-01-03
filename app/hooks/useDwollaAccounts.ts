import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export const useDwollaAccounts = (userId: string | null | undefined) => {
	return useQuery({
		queryKey: ["dwollaAccounts", userId],
		queryFn: async () => {
			const response = await axios.get(`/api/dwolla/get-accounts?userId=${userId}`);
			return response.data;
		},
		enabled: !!userId,
		staleTime: 15 * 60, // Adjusted stale time to every 15 minutes
		refetchInterval: 30 * 60 * 1000, // Refetch every 30 minutes
		retry: 3,
	});
};
