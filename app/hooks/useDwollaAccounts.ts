import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export const useDwollaAccounts = (userId: string) => {
	return useQuery({
		queryKey: ["dwollaAccounts", userId],
		queryFn: async () => {
			const response = await axios.get(`/api/dwolla/get-accounts?userId=${userId}`);
			return response.data;
		},
		enabled: !!userId,
	});
};
