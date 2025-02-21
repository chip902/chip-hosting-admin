// app/api/transactions/get-transactions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { plaidClient } from "@/lib/plaid";
import prisma from "@/prisma/client";

export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const userId = searchParams.get("userId");
		const startDate = searchParams.get("startDate") || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
		const endDate = searchParams.get("endDate") || new Date().toISOString().split("T")[0];

		if (!userId) {
			return NextResponse.json({ error: "UserId is required" }, { status: 400 });
		}

		const banks = await prisma.bank.findMany({
			where: { userId },
			select: {
				id: true,
				bankId: true,
				accessToken: true,
				accountId: true,
				institutionName: true,
			},
		});

		if (!banks.length) {
			return NextResponse.json({ transactions: [] });
		}

		let allTransactions = new Map();

		for (const bank of banks) {
			try {
				console.log(`Fetching transactions for bank:`, {
					bankId: bank.id,
					institutionName: bank.institutionName,
					accountId: bank.accountId,
				});

				// Use transactionsGet instead of transactionsSync for initial pull
				const response = await plaidClient.transactionsGet({
					access_token: bank.accessToken,
					start_date: startDate,
					end_date: endDate,
					options: {
						include_personal_finance_category: true,
					},
				});

				const transactions = response.data.transactions.map((transaction) => ({
					id: transaction.transaction_id,
					name: transaction.name,
					paymentChannel: transaction.payment_channel,
					type: transaction.payment_channel,
					accountId: transaction.account_id,
					amount: transaction.amount * -1,
					pending: transaction.pending,
					category: transaction.personal_finance_category?.primary ?? "uncategorized",
					date: transaction.date,
					image: transaction.logo_url ?? "",
					bankId: bank.id,
					institutionName: bank.institutionName,
				}));

				// Add new transactions
				transactions.forEach((transaction) => {
					allTransactions.set(transaction.id, transaction);
				});

				console.log(`Bank ${bank.institutionName} (${bank.id}) results:`, {
					totalTransactions: transactions.length,
					accountIds: [...new Set(transactions.map((t) => t.accountId))],
					accounts: response.data.accounts,
				});
			} catch (error: any) {
				console.error(`Error fetching transactions for bank ${bank.institutionName}:`, {
					bankId: bank.id,
					error: error.response?.data || error.message,
				});
				continue;
			}
		}

		const uniqueTransactions = Array.from(allTransactions.values()).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

		console.log("Final transaction summary:", {
			totalBanks: banks.length,
			totalTransactions: uniqueTransactions.length,
			transactionsByBank: uniqueTransactions.reduce((acc, t) => {
				acc[t.institutionName] = (acc[t.institutionName] || 0) + 1;
				return acc;
			}, {} as Record<string, number>),
			uniqueAccountIds: [...new Set(uniqueTransactions.map((t) => t.accountId))],
		});

		return NextResponse.json({ transactions: uniqueTransactions });
	} catch (error: any) {
		console.error("Error fetching transactions: ", error);
		return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 });
	}
}
