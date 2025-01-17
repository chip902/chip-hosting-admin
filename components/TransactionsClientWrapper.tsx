"use client";

import TransactionReporting from "@/components/TransactionReporting";
import TransactionImporter from "@/components/TransactionImporter";
import { useQueryClient } from "@tanstack/react-query";

interface TransactionsClientWrapperProps {
	userId: string;
}

export default function TransactionsClientWrapper({ userId }: TransactionsClientWrapperProps) {
	const queryClient = useQueryClient();

	return (
		<>
			<div className="transactions-content">
				<TransactionReporting userId={userId} />
			</div>

			<div className="mt-8">
				<h2 className="text-lg font-semibold mb-4">Manual Import</h2>
				<TransactionImporter
					userId={userId}
					onImportSuccess={() => {
						queryClient.invalidateQueries({ queryKey: ["transactions"] });
						queryClient.invalidateQueries({ queryKey: ["plaidBanks"] });
					}}
				/>
			</div>
		</>
	);
}
