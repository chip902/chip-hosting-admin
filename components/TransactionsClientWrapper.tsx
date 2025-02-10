"use client";

import TransactionReporting from "@/components/TransactionReporting";
import TransactionImporter from "@/components/TransactionImporter";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useSyncTransactions } from "@/app/hooks/useSyncTransactions";
import axios from "axios";
import { Bank } from "@/types";

interface TransactionsClientWrapperProps {
	userId: string;
}

export default function TransactionsClientWrapper({ userId }: TransactionsClientWrapperProps) {
	const queryClient = useQueryClient();
	const { mutate: syncTransactions } = useSyncTransactions(userId); // Add this hook

	const { data: banksData } = useQuery({
		queryKey: ["banks"],
		queryFn: async () => {
			const response = await axios.get("/api/bank/get-banks", {
				data: userId,
				params: userId,
			});
			return response as unknown as Bank[];
		},
	});
	const defaultBankId = banksData?.[0]?.bankId;

	// Add a sync handler
	const handleSync = async () => {
		try {
			await syncTransactions(undefined, {
				onSuccess: () => {
					// Invalidate and refetch queries after successful sync
					queryClient.invalidateQueries({ queryKey: ["transactions"] });
					queryClient.invalidateQueries({ queryKey: ["plaidBanks"] });
				},
				onError: (error: any) => {
					console.error("Sync failed:", error);
					// Add error handling here (e.g., show a toast notification)
				},
			});
		} catch (error) {
			console.error("Error during sync:", error);
		}
	};

	return (
		<>
			<div className="transactions-content">
				{/* Add a sync button */}
				<div className="mb-4">
					<button onClick={handleSync} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
						Sync Transactions
					</button>
				</div>
				<TransactionReporting userId={userId} />
			</div>

			<div className="mt-8">
				<h2 className="text-lg font-semibold mb-4">Manual Import</h2>
				<TransactionImporter
					userId={userId}
					bankId={defaultBankId || ""}
					onImportSuccess={() => {
						queryClient.invalidateQueries({ queryKey: ["transactions"] });
						queryClient.invalidateQueries({ queryKey: ["plaidBanks"] });
					}}
				/>
			</div>
		</>
	);
}
