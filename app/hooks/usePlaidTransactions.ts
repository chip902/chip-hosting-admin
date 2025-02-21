"use client";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Transaction } from "@/types";

interface TransactionsResponse {
	transactions: Transaction[];
}

interface DateRange {
	startDate?: Date;
	endDate?: Date;
}

export const usePlaidTransactions = (userId: string, range?: DateRange) => {
	// Format dates properly
	const defaultRange = {
		startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
		endDate: new Date(),
	};
	const effectiveRange = range || defaultRange;
	const formattedStartDate = effectiveRange.startDate?.toISOString().split("T")[0];
	const formattedEndDate = effectiveRange.endDate?.toISOString().split("T")[0];

	const { data, isLoading, error } = useQuery<TransactionsResponse>({
		queryKey: ["transactions", userId, formattedStartDate, formattedEndDate],
		queryFn: async () => {
			if (!userId) {
				throw new Error("User ID is required");
			}

			const response = await axios.get("/api/transactions/get-transactions", {
				params: {
					userId,
					startDate: formattedStartDate,
					endDate: formattedEndDate,
				},
			});

			return response.data;
		},
		enabled: !!userId && !!formattedStartDate && !!formattedEndDate,
		staleTime: 15 * 60,
		refetchInterval: 30 * 60 * 1000,
		retry: 3,
		refetchOnWindowFocus: false,
	});

	return {
		transactions: data?.transactions || [],
		isLoading,
		error,
	};
};
