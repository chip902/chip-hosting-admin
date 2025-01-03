// app/api/dwolla/diagnostic/route.ts
import { NextResponse } from "next/server";
import createDwollaClient from "@/lib/dwolla";

export async function GET() {
	try {
		// Check environment variables
		const envInfo = {
			NODE_ENV: process.env.NODE_ENV,
			DWOLLA_ENVIRONMENT: process.env.DWOLLA_ENVIRONMENT,
			hasAppKey: !!process.env.DWOLLA_APP_KEY,
			hasAppSecret: !!process.env.DWOLLA_APP_SECRET,
		};

		console.log("Environment diagnostic:", envInfo);

		// Try to authenticate
		const { client, accessToken } = await createDwollaClient();

		return NextResponse.json({
			status: "success",
			environment: envInfo,
			auth: {
				success: true,
				tokenReceived: !!accessToken,
			},
		});
	} catch (error: any) {
		console.error("Diagnostic error:", error);
		return NextResponse.json(
			{
				status: "error",
				environment: {
					NODE_ENV: process.env.NODE_ENV,
					DWOLLA_ENVIRONMENT: process.env.DWOLLA_ENVIRONMENT,
					hasAppKey: !!process.env.DWOLLA_APP_KEY,
					hasAppSecret: !!process.env.DWOLLA_APP_SECRET,
				},
				error: {
					message: error.message,
					response: error.response?.data,
				},
			},
			{ status: 500 }
		);
	}
}
