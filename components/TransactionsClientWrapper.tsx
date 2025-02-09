"use client";

import TransactionReporting from "@/components/TransactionReporting";
import TransactionImporter from "@/components/TransactionImporter";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Bank } from "@/types";

interface TransactionsClientWrapperProps {
	userId: string;
}

export default function TransactionsClientWrapper({ userId }: TransactionsClientWrapperProps) {
	const queryClient = useQueryClient();
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

	return (
		<>
			<div className="transactions-content">
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
