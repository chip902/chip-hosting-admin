// app/transactions/page.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import TransactionReporting from "@/components/TransactionReporting";
import TransactionImporter from "@/components/TransactionImporter";

export default async function TransactionsPage() {
	const session = await auth();

	if (!session?.user) {
		redirect("/login");
	}

	return (
		<main className="transactions">
			<div className="transactions-header">
				<div className="header-box">
					<h1 className="header-box-title">Transaction History</h1>
					<p className="header-box-subtext">View and manage your financial transactions</p>
				</div>
			</div>

			<div className="transactions-content">
				<TransactionReporting userId={session.user.id} />
			</div>

			<div className="mt-8">
				<h2 className="text-lg font-semibold mb-4">Manual Import</h2>
				<TransactionImporter userId={session.user.id} bankId="34" />
			</div>
		</main>
	);
}
