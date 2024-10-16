import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/client";
import { plaidClient } from "@/lib/plaid";
import { Account } from "@/types";

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	const userId = searchParams.get("userId");

	if (!userId) {
		return NextResponse.json({ error: "User ID is required" }, { status: 400 });
	}

	try {
		const banks = await prisma.bank.findMany({ where: { userId } });

		const accounts: Account[] = await Promise.all(
			banks.map(async (bank) => {
				const accountsResponse = await plaidClient.accountsGet({
					access_token: bank.accessToken,
				});
				const accountData = accountsResponse.data.accounts[0];

				return {
					id: accountData.account_id,
					availableBalance: accountData.balances.available || 0,
					currentBalance: accountData.balances.current || 0,
					institutionId: bank.bankId,
					name: accountData.name,
					officialName: accountData.official_name || null,
					mask: accountData.mask || "",
					type: accountData.type,
					subtype: accountData.subtype || "",
					bankId: bank.id.toString(),
					appwriteItemId: bank.id.toString(),
					sharableId: bank.sharableId,
				};
			})
		);

		const totalBanks = accounts.length;
		const totalCurrentBalance = accounts.reduce((total, account) => total + account.currentBalance, 0);

		return NextResponse.json({ accounts, totalBanks, totalCurrentBalance }, { status: 200 });
	} catch (error) {
		console.error("Error in Get Accounts API: ", error);
		return NextResponse.json({ error: "Error fetching accounts" }, { status: 500 });
	}
}
