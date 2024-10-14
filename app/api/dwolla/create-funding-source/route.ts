import { NextRequest, NextResponse } from "next/server";
import { dwollaClient } from "@/lib/actions/dwolla.actions";

export async function POST(request: NextRequest) {
	try {
		const { customerUrl, processorToken, bankName, bankAccountType } = await request.json();

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

		return NextResponse.json({ fundingSourceUrl }, { status: 201 });
	} catch (error: any) {
		console.error("Error creating funding source in Dwolla:", error);
		if (error.response?.body) {
			console.error("Dwolla Error Details:", error.response.body);
		}
		return NextResponse.json({ error: "Error creating funding source in Dwolla" }, { status: 500 });
	}
}
