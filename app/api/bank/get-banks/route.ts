// app/api/bank/get-banks/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAccounts } from "@/lib/actions/bank.actions";
import { prisma } from "@/prisma/client";
import { Bank } from "@/prisma/app/generated/prisma/client";

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	const userId = searchParams.get("userId");

	if (!userId) {
		return NextResponse.json({ error: "User ID is required" }, { status: 400 });
	}

	try {
		// First get all banks from the database
		const banks = await prisma.bank.findMany({
			where: {
				User: {
					userId: userId,
				},
			},
		});

		// Then get the accounts from Plaid
		const plaidAccounts = await getAccounts(userId);

		// Combine the data
		const result = plaidAccounts.accounts.map((account) => {
			const bank = banks.find((b: Bank) => b.id.toString() === account.bankId);
			return {
				...account,
				institutionName: bank?.institutionName,
			};
		});

		return NextResponse.json(result, { status: 200 });
	} catch (error) {
		console.error("Error in Get Banks API:", error);
		return NextResponse.json({ error: "Error fetching banks" }, { status: 500 });
	}
}
