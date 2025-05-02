import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

export const useSyncTransactions = (userId: string) => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async () => {
			if (!userId) {
				throw new Error("User ID is required");
			}
			try {
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
			} catch (error: any) {
				// If we get a 400 error, we should reset the cursor and try again
				if (error?.response?.status === 400) {
					// Make a second attempt with reset cursor
					const retryResponse = await axios.post(
						"/api/transactions/sync",
						{
							userId: userId,
							resetCursor: true, // Add this flag to handle in your API
						},
						{
							headers: {
								"Content-Type": "application/json",
							},
						}
					);
					return retryResponse.data;
				}
				throw error; // Re-throw if it's not a 400 error
			}
		},
		onSuccess: () => {
			// Invalidate and refetch relevant queries
			queryClient.invalidateQueries({ queryKey: ["transactions"] });
			queryClient.invalidateQueries({ queryKey: ["plaidBanks"] });
		},
	});
};
