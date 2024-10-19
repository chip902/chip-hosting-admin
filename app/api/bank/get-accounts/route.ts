import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/client";
import { plaidClient } from "@/lib/plaid";
import { AccountBase } from "@/types";

interface PlaidAccount extends AccountBase {}
export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	const userId = searchParams.get("userId");

	if (!userId) {
		return NextResponse.json({ error: "User ID is required" }, { status: 400 });
	}

	try {
		const banks = await prisma.bank.findMany({ where: { userId } });

		const accountsPromises = banks.map(async (bank) => {
			const response = await plaidClient.accountsGet({ access_token: bank.accessToken });
			return response.data.accounts as PlaidAccount[];
		});

		const accountArrays: PlaidAccount[][] = await Promise.all(accountsPromises);

		const accounts = accountArrays.flatMap((accountArray, index) => {
			const bank = banks[index];
			return accountArray.map((accountData) => ({
				id: accountData.id || "",
				availableBalance: accountData.available_balance || null,
				currentBalance: accountData.current_balance || null,
				bankId: accountData.institution_id ? accountData.institution_id.toString() : bank.id,
				institution_id: accountData.institution_id || null,
				name: accountData.name || "",
				officialName: accountData.official_name || null,
				sharableId: accountData.persistent_account_id || null,
				balances: {
					available: accountData.available_balance || null,
					current: accountData.current_balance || null,
				},
			}));
		});

		const totalBanks = accounts.length;
		const totalCurrentBalance = accounts.reduce((total, account) => total + (account.currentBalance || 0), 0);

		return NextResponse.json({ accounts, totalBanks, totalCurrentBalance }, { status: 200 });
	} catch (error) {
		console.error("Error in Get Accounts API: ", error);
		return NextResponse.json({ error: "Error fetching accounts" }, { status: 500 });
	}
}
