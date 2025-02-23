// app/api/plaid/create-link-token/route.ts
import { NextRequest, NextResponse } from "next/server";
import { plaidClient } from "@/lib/plaid";
import { Products, CountryCode } from "plaid";

export async function POST(request: NextRequest) {
	try {
		const { user } = await request.json();
		console.log("User object received in create-link-token API:", user);

		// Use the UUID consistently
		const userId = user.userId || user.id;

		console.log("Using userId for Plaid:", userId);

		if (!userId) {
			throw new Error("User ID is required");
		}

		const tokenParams = {
			user: {
				client_user_id: userId,
			},
			client_name: "ChipBooks",
			products: ["auth", "identity", "transactions"] as Products[],
			country_codes: ["US"] as CountryCode[],
			language: "en",
			transactions: {
				days_requested: 730,
			},
		};

		console.log("Creating link token with params:", tokenParams);

		const response = await plaidClient.linkTokenCreate(tokenParams);
		console.log("Link token created successfully");

		return NextResponse.json({ linkToken: response.data.link_token });
	} catch (error: any) {
		console.error("Error creating link token:", error);
		console.error("Plaid API Error Details:", error.response?.data);
		return NextResponse.json({ error: "Error creating link token", details: error.response?.data }, { status: 400 });
	}
}
