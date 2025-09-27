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

function toBusinessCategory(hierarchy: string[]): string {
	return hierarchy[0] || "uncategorized";
}

export const usePlaidTransactions = (userId: string, range?: DateRange & { bankIds?: string[] }) => {
	// Format dates properly
	const defaultRange = {
		startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
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

			const response = await axios.get("/api/transactions/get-transactions", {
				params: {
					userId,
					startDate: effectiveRange.startDate?.toISOString().split("T")[0],
					endDate: effectiveRange.endDate?.toISOString().split("T")[0],
					bankIds: range?.bankIds?.join(","),
				},
			});

			// Map the transactions with categories
			const mappedTransactions = response.data.transactions.map((tx: Transaction) => {
				// Create a proper string array for the category hierarchy
				const categoryHierarchy: string[] = tx.personal_finance_category
					? [tx.personal_finance_category.primary, tx.personal_finance_category.detailed].filter((cat): cat is string => Boolean(cat))
					: Array.isArray(tx.category)
					? tx.category
					: [];

				return {
					...tx,
					businessCategory: toBusinessCategory(categoryHierarchy),
					categoryConfidence: tx.personal_finance_category_confidence,
				};
			});

			return {
				transactions: mappedTransactions,
			};
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
