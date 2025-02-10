import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

export const useSyncTransactions = (userId: string | null | undefined) => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async () => {
			if (!userId) {
				throw new Error("User ID is required");
			}
			const response = await axios.post(
				"/api/transactions/sync",
				{ userId: userId },
				{
					headers: {
						"Content-Type": "application/json",
					},
				}
			);
			return response.data;
		},
		onSuccess: () => {
			// Invalidate and refetch relevant queries
			queryClient.invalidateQueries({ queryKey: ["transactions"] });
			queryClient.invalidateQueries({ queryKey: ["plaidBanks"] });
		},
	});
};
