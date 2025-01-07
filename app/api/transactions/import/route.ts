// app/api/transactions/import/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: Request) {
	try {
		const { transactions, userId, bankId } = await request.json();

		// Validate request data
		if (!transactions || !Array.isArray(transactions)) {
			return NextResponse.json({ error: "Invalid transactions data" }, { status: 400 });
		}

		if (!userId || !bankId) {
			return NextResponse.json({ error: "Missing userId or bankId" }, { status: 400 });
		}

		// Format transactions for database insertion
		const formattedTransactions = transactions.map((transaction) => ({
			id: transaction.id,
			accountId: transaction.accountId,
			amount: transaction.amount,
			date: new Date(transaction.date),
			name: transaction.name,
			paymentChannel: transaction.paymentChannel,
			pending: transaction.pending,
			category: transaction.category,
			userId: userId,
			bankId: parseInt(bankId), // Convert string bankId to integer
		}));

		// Insert transactions in batches to handle large datasets
		const batchSize = 100;
		let insertedCount = 0;

		for (let i = 0; i < formattedTransactions.length; i += batchSize) {
			const batch = formattedTransactions.slice(i, i + batchSize);

			// Use createMany with skipDuplicates to handle potential duplicates
			const result = await prisma.transaction.createMany({
				data: batch,
				skipDuplicates: true, // This will skip records with duplicate IDs
			});

			insertedCount += result.count;
		}

		return NextResponse.json({
			success: true,
			count: insertedCount,
			message: `Successfully imported ${insertedCount} transactions`,
		});
	} catch (error) {
		console.error("Error importing transactions:", error);

		// Return a more detailed error message for debugging
		return NextResponse.json(
			{
				error: "Failed to import transactions",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 }
		);
	} finally {
		await prisma.$disconnect();
	}
}
