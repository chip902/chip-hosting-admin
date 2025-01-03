// app/transactions/page.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import TransactionReporting from "@/components/TransactionReporting";

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
			<TransactionReporting userId={session.user.id} />
		</main>
	);
}
