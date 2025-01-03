// app/api/plaid/exchange-public-token/route.ts

import { NextRequest, NextResponse } from "next/server";
import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";
import prisma from "@/prisma/client";

const basePath = process.env.NODE_ENV === "production" ? PlaidEnvironments.production : PlaidEnvironments.sandbox;

const configuration = new Configuration({
	basePath,
	baseOptions: {
		headers: {
			"PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID!,
			"PLAID-SECRET": process.env.NODE_ENV !== "production" ? process.env.PLAID_SECRET : process.env.PLAID_PROD_SECRET,
		},
	},
});

const plaidClient = new PlaidApi(configuration);

export async function POST(request: NextRequest) {
	try {
		const { publicToken, userID } = await request.json();

		// Exchange the public token for an access token
		const exchangeResponse = await plaidClient.itemPublicTokenExchange({
			public_token: publicToken,
		});

		const accessToken = exchangeResponse.data.access_token;
		const itemId = exchangeResponse.data.item_id;

		// Check if a bank record already exists for this user
		const existingBank = await prisma.bank.findUnique({
			where: {
				userId: userID.userId,
			},
		});

		if (existingBank) {
			// Update existing bank record
			const updatedBank = await prisma.bank.update({
				where: {
					userId: userID.userId,
				},
				data: {
					bankId: itemId,
					accessToken: accessToken,
					accountId: "", // This will be updated later
					fundingSourceUrl: "", // This will be updated later
					sharableId: itemId, // Using itemId as sharableId for now
				},
			});
			return NextResponse.json({
				accessToken,
				itemId,
				bankId: updatedBank.id,
			});
		} else {
			// Create new bank record
			const newBank = await prisma.bank.create({
				data: {
					userId: userID.userId,
					bankId: itemId,
					accessToken: accessToken,
					accountId: "", // This will be updated later
					fundingSourceUrl: "", // This will be updated later
					sharableId: itemId, // Using itemId as sharableId for now
				},
			});
			return NextResponse.json({
				accessToken,
				itemId,
				bankId: newBank.id,
			});
		}
	} catch (error) {
		console.error("Error exchanging public token:", error);
		return NextResponse.json({ error: "Error exchanging public token" }, { status: 500 });
	}
}
