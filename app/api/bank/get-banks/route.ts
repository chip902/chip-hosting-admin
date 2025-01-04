// app/api/bank/get-banks/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAccounts } from "@/lib/actions/bank.actions";

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	const userId = searchParams.get("userId");

	if (!userId) {
		return NextResponse.json({ error: "User ID is required" }, { status: 400 });
	}

	try {
		const result = await getAccounts(userId);
		return NextResponse.json(result.accounts, { status: 200 });
	} catch (error) {
		console.error("Error in Get Banks API: ", error);
		return NextResponse.json({ error: "Error fetching banks" }, { status: 500 });
	}
}
