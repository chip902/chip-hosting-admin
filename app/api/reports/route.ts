import { NextResponse } from "next/server";
import { prisma } from "@/prisma/client";

export async function POST(request: Request) {
	try {
		const { startDate, endDate } = await request.json();

		// Fetch filtered transactions
		const transactions = await prisma.transaction.findMany({
			where: {
				date: {
					gte: new Date(startDate),
					lte: new Date(endDate),
				},
			},
			include: { bank: true },
		});

		// Calculate totals
		const totalIncome = transactions.reduce((sum: number, t: { amount: number }) => sum + (t.amount > 0 ? t.amount : 0), 0);
		const totalExpenses = transactions.reduce((sum: number, t: { amount: number }) => sum + (t.amount < 0 ? Math.abs(t.amount) : 0), 0);

		return NextResponse.json({
			data: {
				totalIncome,
				totalExpenses,
				transactionCount: transactions.length,
			},
		});
	} catch (error) {
		return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
	}
}
