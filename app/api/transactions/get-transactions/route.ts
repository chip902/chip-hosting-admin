import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/client";
import { plaidClient } from "@/lib/plaid";
import { Transaction } from "@/types";

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	const userId = searchParams.get("userId");

	if (!userId) {
		return NextResponse.json({ error: "User ID is required" }, { status: 400 });
	}

	try {
		const banks = await prisma.bank.findMany({ where: { userId } });

		const allTransactions: Transaction[] = [];

		for (const bank of banks) {
			const now = new Date();
			const startDate = new Date(now.setMonth(now.getMonth() - 1)).toISOString().split("T")[0];
			const endDate = new Date().toISOString().split("T")[0];

			const transactionsResponse = await plaidClient.transactionsGet({
				access_token: bank.accessToken,
				start_date: startDate,
				end_date: endDate,
			});

			const transactions: Transaction[] = transactionsResponse.data.transactions.map((t) => ({
				id: t.transaction_id,
				$id: t.transaction_id,
				name: t.name,
				paymentChannel: t.payment_channel,
				type: t.payment_channel || "",
				accountId: t.account_id,
				amount: t.amount,
				pending: t.pending,
				category: t.personal_finance_category || t.personal_finance_category?.[0] || "Uncategorized",
				date: t.date,
				image: "",
				$createdAt: t.date,
				channel: t.payment_channel,
				senderBankId: bank.id.toString(),
				receiverBankId: "",
			}));

			allTransactions.push(...transactions);
		}

		// Sort transactions by date, most recent first
		allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

		return NextResponse.json(allTransactions, { status: 200 });
	} catch (error) {
		console.error("Error fetching transactions: ", error);
		return NextResponse.json({ error: "Error fetching transactions" }, { status: 500 });
	}
}
