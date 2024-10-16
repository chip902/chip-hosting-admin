import { NextRequest, NextResponse } from "next/server";
import { getDwollaAccounts } from "@/lib/actions/dwolla.actions";

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	const userId = searchParams.get("userId");

	if (!userId) {
		return NextResponse.json({ error: "User ID is required" }, { status: 400 });
	}

	try {
		const accounts = await getDwollaAccounts(userId);
		return NextResponse.json(accounts, { status: 200 });
	} catch (error: any) {
		console.error("Error fetching Dwolla accounts: ", error);
		if (error.message.includes("DWOLLA_APP_KEY and DWOLLA_APP_SECRET must be set")) {
			return NextResponse.json({ error: "Dwolla configuration error. Please try again later." }, { status: 503 });
		}
		return NextResponse.json({ error: "Error fetching Dwolla accounts", details: error.message }, { status: 500 });
	}
}
