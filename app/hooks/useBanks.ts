// app/hooks/useBanks.ts
import { Bank } from "@prisma/client";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

const fetchBanks = async (): Promise<Bank[]> => {
	const response = await axios.get("/api/bank/get-banks");
	return response.data;
};

export const useBanks = () => {
	const options = {
		queryKey: ["banks"],
		queryFn: fetchBanks,
		staleTime: 15 * 60, // Adjusted stale time to every 15 minutes
		refetchOnMount: true,
		refetchInterval: 30 * 60 * 1000, // Refetch every 30 minutes
		retry: 3,
	};

	return useQuery<Bank[]>(options);
};
