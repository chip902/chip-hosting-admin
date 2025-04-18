// app/api/bank/get-accounts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { plaidClient } from "@/lib/plaid";
import { prisma } from "@/prisma/client";

export const dynamic = "force-dynamic"; // This is important!

export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const userId = searchParams.get("userId");

		if (!userId) {
			return NextResponse.json({ error: "UserId is required" }, { status: 400 });
		}

		// Get all banks for the user
		const banks = await prisma.bank.findMany({
			where: { userId },
		});

		if (!banks.length) {
			return NextResponse.json({
				accounts: [],
				totalBanks: 0,
				totalCurrentBalance: 0,
			});
		}

		let allAccounts = [];
		let totalCurrentBalance = 0;

		// Process each bank sequentially to avoid rate limits
		for (const bank of banks) {
			try {
				const response = await plaidClient.accountsGet({
					access_token: bank.accessToken,
				});

				const accounts = response.data.accounts.map((account) => ({
					id: account.account_id,
					account_id: account.account_id,
					balances: {
						available: account.balances.available,
						current: account.balances.current || 0,
						iso_currency_code: account.balances.iso_currency_code || "USD",
						limit: account.balances.limit,
						unofficial_currency_code: account.balances.unofficial_currency_code,
					},
					mask: account.mask || "",
					name: account.name,
					official_name: account.official_name,
					subtype: account.subtype || "",
					type: account.type,
					institution_id: response.data.item.institution_id || "",
					availableBalance: account.balances.available,
					currentBalance: account.balances.current,
					bankId: bank.id.toString(),
				}));

				allAccounts.push(...accounts);
				totalCurrentBalance += accounts.reduce((sum, account) => sum + (account.currentBalance || 0), 0);
			} catch (error: any) {
				console.error(`Error fetching accounts for bank ${bank.id}:`, {
					error: error.response?.data || error.message,
					statusCode: error.response?.status,
				});
				// Continue with other banks even if one fails
			}
		}

		return NextResponse.json({
			accounts: allAccounts,
			totalBanks: banks.length,
			totalCurrentBalance,
		});
	} catch (error: any) {
		console.error("Error in Get Accounts API: ", error);
		return NextResponse.json({ error: "Failed to fetch accounts" }, { status: 500 });
	}
}
