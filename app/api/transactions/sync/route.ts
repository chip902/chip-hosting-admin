import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/client";
import { plaidClient } from "@/lib/plaid";
import { startOfDay, subYears } from "date-fns";

export async function POST(request: NextRequest) {
	try {
		const { userId } = await request.json();

		if (!userId) {
			return NextResponse.json({ error: "User ID is required" }, { status: 400 });
		}

		// Get all connected banks for the user
		const banks = await prisma.bank.findMany({ where: { userId } });
		console.log(`Number of banks found for user ${userId}:`, banks.length);

		if (!banks.length) {
			return NextResponse.json({ message: "No banks found for this user" });
		}

		const syncResults = [];
		const twoYearsAgo = subYears(startOfDay(new Date()), 2);

		for (const bank of banks) {
			try {
				// First try to use sync endpoint as it's more efficient
				const syncResponse = await plaidClient.transactionsSync({
					access_token: bank.accessToken,
				});

				const processedTransactions = syncResponse.data.added.map((t) => ({
					id: t.transaction_id,
					accountId: t.account_id,
					amount: t.amount,
					date: new Date(t.date),
					name: t.name,
					paymentChannel: t.payment_channel,
					pending: t.pending,
					category: t.personal_finance_category?.primary || "Uncategorized",
					bankId: bank.id,
					userId: userId,
				}));

				// Fall back to batch fetching if sync returns no data (for older transactions)
				if (processedTransactions.length === 0) {
					let hasMore = true;
					let offset = 0;
					const bankTransactions = [];
					const startDate = twoYearsAgo.toISOString().split("T")[0];
					const endDate = new Date().toISOString().split("T")[0];

					while (hasMore) {
						const transactionsResponse = await plaidClient.transactionsGet({
							access_token: bank.accessToken,
							start_date: startDate,
							end_date: endDate,
							options: {
								count: 500,
								offset: offset,
								include_personal_finance_category: true,
							},
						});

						const { transactions, total_transactions } = transactionsResponse.data;
						bankTransactions.push(...transactions);

						offset += transactions.length;
						hasMore = offset < total_transactions;
					}

					// Process batch transactions
					processedTransactions.push(
						...bankTransactions.map((t) => ({
							id: t.transaction_id,
							accountId: t.account_id,
							amount: t.amount,
							date: new Date(t.date),
							name: t.name,
							paymentChannel: t.payment_channel,
							pending: t.pending,
							category: t.personal_finance_category?.primary || "Uncategorized",
							bankId: bank.id,
							userId: userId,
						}))
					);
				}

				// Batch upsert transactions
				const batchSize = 100;
				for (let i = 0; i < processedTransactions.length; i += batchSize) {
					const batch = processedTransactions.slice(i, i + batchSize);
					await prisma.$transaction(
						batch.map((transaction) =>
							prisma.transaction.upsert({
								where: { id: transaction.id },
								create: transaction,
								update: transaction,
							})
						)
					);
				}

				syncResults.push({
					bankId: bank.id,
					transactionCount: processedTransactions.length,
					status: "success",
				});
			} catch (error) {
				console.error(`Error syncing bank ${bank.id}:`, error);
				syncResults.push({
					bankId: bank.id,
					error: error instanceof Error ? error.message : "Unknown error",
					status: "error",
				});
			}
		}

		return NextResponse.json({
			message: "Sync completed",
			results: syncResults,
		});
	} catch (error) {
		console.error("Error syncing transactions:", error);
		return NextResponse.json(
			{
				error: error instanceof Error ? error.message : "Error syncing transactions",
			},
			{ status: 500 }
		);
	}
}
