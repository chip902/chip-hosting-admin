import { NextRequest, NextResponse } from "next/server";
import { getAccounts } from "@/lib/actions/bank.actions";

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	const userId = searchParams.get("userId");

	if (!userId) {
		return NextResponse.json({ error: "User ID is required" }, { status: 400 });
	}

	try {
		const { accounts } = await getAccounts(userId);
		const banks = accounts.map((account) => ({
			id: account.id,
			name: account.name,
			institutionId: account.institutionId,
		}));
		return NextResponse.json(banks, { status: 200 });
	} catch (error) {
		console.error("Error in Get Banks API: ", error);
		return NextResponse.json({ error: "Error fetching banks" }, { status: 500 });
	}
}
