"use client";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Transaction } from "@/types";
import { useMemo } from "react";

interface TransactionsResponse {
	transactions: Transaction[];
}

interface DateRange {
	startDate?: Date;
	endDate?: Date;
}

export const usePlaidTransactions = (userId: string, range?: DateRange & { bankIds?: string[] }) => {
	// Format dates properly
	const defaultRange = {
		startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
		endDate: new Date(),
	};
	const effectiveRange = range || defaultRange;
	const formattedStartDate = effectiveRange.startDate?.toISOString().split("T")[0];
	const formattedEndDate = effectiveRange.endDate?.toISOString().split("T")[0];

	const queryKey = useMemo(
		() => ["transactions", userId, range?.startDate?.toISOString(), range?.endDate?.toISOString(), range?.bankIds?.join(",")],
		[userId, range?.startDate, range?.endDate, range?.bankIds]
	);

	const { data, isLoading, error } = useQuery<TransactionsResponse>({
		queryKey,
		queryFn: async () => {
			if (!userId) {
				throw new Error("User ID is required");
			}
			console.log("Sending date parameters:", {
				startDate: range?.startDate?.toISOString().split("T")[0],
				endDate: range?.endDate?.toISOString().split("T")[0],
			});

			const response = await axios.get("/api/transactions/get-transactions", {
				params: {
					userId,
					startDate: range?.startDate?.toISOString().split("T")[0],
					endDate: range?.endDate?.toISOString().split("T")[0],
					bankIds: range?.bankIds?.join(","),
				},
			});

			return response.data;
		},
		enabled: !!userId && !!formattedStartDate && !!formattedEndDate,
		staleTime: 60 * 60 * 1000,
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
