// app/api/plaid/exchange-public-token/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";
import prisma from "@/prisma/client";

const plaidClient = new PlaidApi(
	new Configuration({
		basePath: process.env.NODE_ENV === "production" ? PlaidEnvironments.production : PlaidEnvironments.sandbox,
		baseOptions: {
			headers: {
				"PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID!,
				"PLAID-SECRET": process.env.NODE_ENV === "production" ? process.env.PLAID_PROD_SECRET : process.env.PLAID_SECRET,
			},
		},
	})
);

export async function POST(request: NextRequest) {
	try {
		const { publicToken, userID, accountId, institutionName } = await request.json();

		// Exchange the public token for an access token
		const exchangeResponse = await plaidClient.itemPublicTokenExchange({
			public_token: publicToken,
		});

		const accessToken = exchangeResponse.data.access_token;
		const itemId = exchangeResponse.data.item_id;

		// Check if a bank record already exists for this user
		const existingBank = await prisma.bank.findFirst({
			where: {
				User: {
					userId: userID.userId,
				},
				accountId: accountId,
			},
		});

		if (existingBank) {
			// Update existing bank record
			const updatedBank = await prisma.bank.update({
				where: {
					id: existingBank.id,
				},
				data: {
					bankId: itemId,
					accessToken: accessToken,
					institutionName: institutionName || "Unknown Bank",
				},
			});
			return NextResponse.json({
				success: true,
				bankId: updatedBank.id,
			});
		} else {
			// Create new bank record
			const newBank = await prisma.bank.create({
				data: {
					bankId: itemId,
					accessToken: accessToken,
					accountId: accountId,
					institutionName: institutionName || "Unknown Bank",
					User: {
						connect: {
							userId: userID.userId,
						},
					},
				},
			});
			return NextResponse.json({
				success: true,
				bankId: newBank.id,
			});
		}
	} catch (error) {
		console.error("Error exchanging public token:", error);
		return NextResponse.json({ error: "Error exchanging public token" }, { status: 500 });
	}
}
