// app/api/dwolla/create-funding-source/route.ts
import { NextRequest, NextResponse } from "next/server";
import createDwollaClient, { updateFundingSourceURL } from "@/lib/dwolla";

export async function POST(request: NextRequest) {
	try {
		const { accountId, customerUrl, processorToken, bankName, bankAccountType } = await request.json();
		const dwollaClient = await createDwollaClient();

		console.log("Received customerUrl:", customerUrl);
		console.log("Received processorToken:", processorToken);
		console.log("Received bankName:", bankName);

		const requestBody = {
			plaidToken: processorToken,
			name: bankName || "Funding Source",
			bankAccountType: bankAccountType,
		};

		const fundingSourceResponse = await dwollaClient.post(`${customerUrl}/funding-sources`, requestBody);

		const fundingSourceUrl = fundingSourceResponse.headers.get("location");
		if (!fundingSourceUrl) {
			throw new Error("Failed to retrieve funding source URL from Dwolla response");
		}
		await updateFundingSourceURL(accountId, fundingSourceUrl);
		return NextResponse.json({ fundingSourceUrl }, { status: 201 });
	} catch (error: any) {
		console.error("Error creating funding source in Dwolla:", error);
		if (error.response?.body) {
			console.error("Dwolla Error Details:", error.response.body);
		}
		return NextResponse.json({ error: "Error creating funding source in Dwolla" }, { status: 500 });
	}
}
