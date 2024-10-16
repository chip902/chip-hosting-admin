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
	} catch (error) {
		console.error("Error fetching Dwolla accounts: ", error);
		return NextResponse.json({ error: "Error fetching Dwolla accounts" }, { status: 500 });
	}
}
