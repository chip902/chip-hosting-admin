import { NextResponse } from "next/server";
import { prisma } from "@/prisma/client";

export async function GET() {
	try {
		// Fetch all transactions from the database
		const transactions = await prisma.transaction.findMany();

		// Group transactions by ID to find duplicates or discrepancies
		const transactionMap = new Map();
		for (const t of transactions) {
			if (!transactionMap.has(t.id)) {
				transactionMap.set(t.id, t);
			} else {
				// Handle duplicate entries
				console.log(`Duplicate transaction found: ${t.id}`);
			}
		}

		return NextResponse.json({ message: "Reconciliation process initiated" });
	} catch (error) {
		return NextResponse.json({ error: "Failed to initiate reconciliation" }, { status: 500 });
	}
}
