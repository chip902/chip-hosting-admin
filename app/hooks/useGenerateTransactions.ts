import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { Transaction } from "@/types"; // Adjust import path as needed

interface TransactionResponse {
	transactions: Transaction[];
}

interface GenerateTransactionsParams {
	startDate: Date;
	endDate: Date;
}

export const useGenerateTransactions = (userId: string | null | undefined) => {
	return useMutation<TransactionResponse, Error, GenerateTransactionsParams>({
		mutationFn: async ({ startDate, endDate }) => {
			if (!userId) {
				throw new Error("User ID is required");
			}
			// First sync the transactions
			await axios.post("/api/transactions/sync", { userId });

			// Then fetch the transactions with the date range
			const response = await axios.get<TransactionResponse>("/api/transactions/get-transactions", {
				params: {
					userId,
					startDate: startDate.toISOString().split("T")[0],
					endDate: endDate.toISOString().split("T")[0],
				},
			});

			return response.data;
		},
	});
};
