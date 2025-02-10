import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/client";
import { plaidClient } from "@/lib/plaid";
import { startOfDay, subYears } from "date-fns";

export async function POST(request: NextRequest) {
	try {
		// Debug incoming request
		console.log("Sync request received");

		let userIdBody;
		try {
			const rawBody = await request.text(); // First get raw body
			console.log("Raw request body:", rawBody); // Log it for debugging

			if (!rawBody) {
				return NextResponse.json(
					{
						error: "Invalid request body - body is empty",
					},
					{ status: 400 }
				);
			}

			userIdBody = JSON.parse(rawBody);
			console.log("Parsed body:", userIdBody);
		} catch (e) {
			console.error("Error parsing request body:", e);
			return NextResponse.json(
				{
					error: "Invalid request body",
					details: e instanceof Error ? e.message : "Unknown parsing error",
				},
				{ status: 400 }
			);
		}

		const userId = userIdBody?.userId;
		if (!userId) {
			return NextResponse.json(
				{
					error: "User ID is required",
					receivedBody: userIdBody,
				},
				{ status: 400 }
			);
		}

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
					cursor: bank.transactionsCursor || undefined,
				});

				if (!syncResponse?.data?.added) {
					console.error("Plaid API returned an unexpected format:", syncResponse);
					return NextResponse.json({ error: "Invalid response format from Plaid" }, { status: 500 });
				}

				// Store the cursor for next sync
				if (syncResponse.data.next_cursor) {
					await prisma.bank.update({
						where: { id: bank.id },
						data: {
							transactionsCursor: syncResponse.data.next_cursor,
						},
					});
				}

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
						console.log(`Fetching transactions for bank ${bank.id}, offset: ${offset}`); // Add logging

						const transactionsResponse = await plaidClient.transactionsGet({
							access_token: bank.accessToken,
							start_date: startDate,
							end_date: endDate,
							options: {
								count: 500, // Maximum allowed by Plaid
								offset: offset,
								include_personal_finance_category: true,
							},
						});

						const { transactions, total_transactions } = transactionsResponse.data;
						console.log(`Received ${transactions.length} transactions, total: ${total_transactions}`); // Add logging

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
				try {
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
				} catch (error) {
					console.error(`Error processing transactions for bank ${bank.id}:`, error);
					return NextResponse.json({ error: "Failed to process transactions" }, { status: 500 });
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
