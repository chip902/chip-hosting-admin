// app/api/plaid/create-link-token/route.ts

import { NextRequest, NextResponse } from "next/server";
import { Configuration, CountryCode, PlaidApi, PlaidEnvironments, Products } from "plaid";

const configuration = new Configuration({
	basePath: PlaidEnvironments.sandbox, // Use 'sandbox', 'development', or 'production' as needed
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
		const { user } = await request.json();
		console.log("User object received in create-link-token API:", user);
		// Use the correct property for the user ID
		const userId = user?.id ?? user?.$id ?? user?.userId;

		console.log("User ID: ", userId);

		if (!userId) {
			throw new Error("User ID is required");
		}

		const tokenParams = {
			user: {
				client_user_id: String(user.$id),
			},
			client_name: `${user.firstName} ${user.lastName}`,
			products: ["auth", "transactions", "identity"] as Products[],
			language: "en",
			country_codes: ["US"] as CountryCode[],
			update: {
				account_selection_enabled: true,
			},
		};

		const response = await plaidClient.linkTokenCreate(tokenParams);

		return NextResponse.json({ linkToken: response.data.link_token });
	} catch (error) {
		console.error("Error creating link token:", error);
		return NextResponse.json({ error: "Error creating link token" }, { status: 500 });
	}
}
