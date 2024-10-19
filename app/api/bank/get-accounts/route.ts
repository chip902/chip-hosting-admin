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
			const response = await plaidClient.accountsGet({
				access_token: bank.accessToken,
			});
			return response.data.accounts as PlaidAccount[];
		});

		const accountArrays: PlaidAccount[][] = await Promise.all(accountsPromises);

		const accounts = accountArrays.flatMap((accountArray, index) => {
			const bank = banks[index];
			return accountArray.map((accountData) => ({
				id: accountData.account_id || "",
				availableBalance: accountData.balances.available || null,
				currentBalance: accountData.balances.current || null,
				bankId: accountData.institution_id ? accountData.institution_id.toString() : bank.id.toString(),
				institution_id: accountData.institution_id || null,
				name: accountData.name || "",
				officialName: accountData.official_name || null,
				fundingSourceUrl: bank.fundingSourceUrl,
				sharableId: accountData.persistent_account_id || null,
				balances: accountData.balances,
			}));
		});

		const totalBanks = banks.length; // Corrected to use the number of banks
		const totalCurrentBalance = accounts.reduce((total, account) => total + (account.currentBalance || 0), 0);

		return NextResponse.json({ accounts, totalBanks, totalCurrentBalance }, { status: 200 });
	} catch (error) {
		console.error("Error in Get Accounts API: ", error);
		return NextResponse.json({ error: "Error fetching accounts" }, { status: 500 });
	}
}
