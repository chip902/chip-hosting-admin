// /app/api/plaid/create-processor-token/route.ts

import { NextRequest, NextResponse } from "next/server";
import { plaidClient } from "@/lib/plaid";
import { ProcessorTokenCreateRequestProcessorEnum } from "plaid";

export async function POST(request: NextRequest) {
	try {
		const { accessToken, accountId } = await request.json();

		const processorTokenResponse = await plaidClient.processorTokenCreate({
			access_token: accessToken,
			account_id: accountId,
			processor: "dwolla" as ProcessorTokenCreateRequestProcessorEnum,
		});

		const processorToken = processorTokenResponse.data.processor_token;

		return NextResponse.json({ processorToken });
	} catch (error) {
		console.error("Error creating processor token for Dwolla: ", error);
		return NextResponse.json({ error: "Error creating processor token for Dwolla" }, { status: 500 });
	}
}
