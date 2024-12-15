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
			const response = await axios.get<GetAccountsResult>(`/api/bank/get-accounts?userId=${userId}`);
			return response.data;
		},
		enabled: !!userId,
	});
};
