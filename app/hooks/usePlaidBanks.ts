import { useQuery } from "@tanstack/react-query";
import { getAccounts } from "@/lib/actions/bank.actions";

export const usePlaidBanks = (userId: string) => {
	return useQuery({
		queryKey: ["plaidBanks", userId],
		queryFn: () => getAccounts(userId),
		enabled: !!userId,
	});
};
