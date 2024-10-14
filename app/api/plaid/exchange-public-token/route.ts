// app/api/plaid/exchange-public-token/route.ts

import { NextRequest, NextResponse } from "next/server";
import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";
import prisma from "@/prisma/client";

const configuration = new Configuration({
	basePath: PlaidEnvironments.sandbox,
	baseOptions: {
		headers: {
			"PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID!,
			"PLAID-SECRET": process.env.PLAID_SECRET!,
		},
	},
});

const plaidClient = new PlaidApi(configuration);

export async function POST(request: NextRequest) {
	try {
		const { publicToken, userID } = await request.json();
		console.log("API Route - Received userID:", userID);

		if (!publicToken || !userID) {
			throw new Error("Public token and user ID are required");
		}

		const response = await plaidClient.itemPublicTokenExchange({
			public_token: publicToken,
		});

		const accessToken = response.data.access_token;
		const itemId = response.data.item_id;

		// Fetch accounts associated with the access token
		const accountsResponse = await plaidClient.accountsGet({
			access_token: accessToken,
		});

		const accounts = accountsResponse.data.accounts;

		if (!accounts || accounts.length === 0) {
			throw new Error("No accounts found for this user");
		}

		// Use the first account as an example
		const account = accounts[0];
		const accountId = account.account_id;

		// Placeholder values for fundingSourceUrl and sharableId
		const fundingSourceUrl = "placeholder_funding_source_url";
		const sharableId = "placeholder_sharable_id";

		// Save accessToken and itemId to your database associated with the user
		await prisma.bank.create({
			data: {
				userId: userID,
				bankId: itemId,
				accountId: accountId,
				accessToken: accessToken,
				fundingSourceUrl: fundingSourceUrl,
				sharableId: sharableId,
			},
		});

		return NextResponse.json({ success: true, accessToken, itemId });
	} catch (error) {
		console.error("Error exchanging public token:", error);
		return NextResponse.json({ error: "Error exchanging public token" }, { status: 500 });
	}
}
