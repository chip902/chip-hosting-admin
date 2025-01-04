// app/api/transactions/get-transactions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { plaidClient } from "@/lib/plaid";
import prisma from "@/prisma/client";

export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const userId = searchParams.get("userId");

		if (!userId) {
			return NextResponse.json({ error: "UserId is required" }, { status: 400 });
		}

		// Get all banks for the user
		const banks = await prisma.bank.findMany({
			where: { userId },
		});

		if (!banks.length) {
			return NextResponse.json({ transactions: [] });
		}

		let allTransactions = [];

		// Get transactions for the last 30 days
		const endDate = new Date().toISOString().split("T")[0];
		const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

		// Process each bank sequentially
		for (const bank of banks) {
			try {
				const response = await plaidClient.transactionsSync({
					access_token: bank.accessToken,
				});

				const transactions = response.data.added
					.filter((transaction) => {
						const transactionDate = new Date(transaction.date);
						return transactionDate >= new Date(startDate) && transactionDate <= new Date(endDate);
					})
					.map((transaction) => ({
						id: transaction.transaction_id,
						name: transaction.name,
						paymentChannel: transaction.payment_channel,
						type: transaction.payment_channel,
						accountId: transaction.account_id,
						amount: transaction.amount,
						pending: transaction.pending,
						category: transaction.personal_finance_category?.primary ?? transaction.category?.[0] ?? "uncategorized",
						date: transaction.date,
						image: transaction.logo_url ?? "",
						senderBankId: bank.id.toString(),
						receiverBankId: bank.id.toString(),
					}));

				allTransactions.push(...transactions);
			} catch (error: any) {
				console.error(`Error fetching transactions for bank ${bank.id}:`, {
					error: error.response?.data || error.message,
					statusCode: error.response?.status,
				});
				// Continue with other banks even if one fails
			}
		}

		// Sort transactions by date (newest first)
		allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

		return NextResponse.json({ transactions: allTransactions });
	} catch (error: any) {
		console.error("Error fetching transactions: ", error);
		return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 });
	}
}
