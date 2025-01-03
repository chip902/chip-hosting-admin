// lib/dwolla.ts
import prisma from "@/prisma/client";
import { Bank, User } from "@prisma/client";
import axios from "axios";
import { Client } from "dwolla-v2";

async function authenticate(): Promise<string> {
	const isProd = process.env.DWOLLA_ENVIRONMENT === "production";
	const authUrl = isProd
		? "https://api.dwolla.com/token" // Changed from /oauth/v2/token to /token
		: "https://api-sandbox.dwolla.com/token";

	try {
		console.log("Authenticating with Dwolla...", {
			environment: process.env.DWOLLA_ENVIRONMENT,
			url: authUrl,
		});

		// Create Basic Auth token
		const credentials = Buffer.from(`${process.env.DWOLLA_APP_KEY}:${process.env.DWOLLA_APP_SECRET}`).toString("base64");

		// Send the request exactly as documented
		const response = await axios({
			method: "post",
			url: authUrl,
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
				Authorization: `Basic ${credentials}`,
			},
			data: new URLSearchParams({
				grant_type: "client_credentials",
			}).toString(),
		});

		if (!response.data?.access_token) {
			console.error("Unexpected response format:", response.data);
			throw new Error("No access token in response");
		}

		return response.data.access_token;
	} catch (error: any) {
		// Enhanced error logging
		console.error("Dwolla authentication error details:", {
			status: error.response?.status,
			statusText: error.response?.statusText,
			data: error.response?.data,
			message: error.message,
			env: process.env.DWOLLA_ENVIRONMENT,
			url: authUrl,
			// Log only non-sensitive parts of headers
			requestHeaders: {
				"Content-Type": error.config?.headers?.["Content-Type"],
				"Has-Authorization": !!error.config?.headers?.Authorization,
			},
		});
		throw error;
	}
}

async function createDwollaClient(): Promise<{ client: Client; accessToken: string }> {
	if (!process.env.DWOLLA_APP_KEY || !process.env.DWOLLA_APP_SECRET) {
		throw new Error("DWOLLA_APP_KEY and DWOLLA_APP_SECRET must be defined");
	}

	const environment = process.env.DWOLLA_ENVIRONMENT === "production" ? "production" : "sandbox";

	console.log("Creating Dwolla client...", {
		environment,
		hasKey: !!process.env.DWOLLA_APP_KEY,
		hasSecret: !!process.env.DWOLLA_APP_SECRET,
	});

	const client = new Client({
		key: process.env.DWOLLA_APP_KEY,
		secret: process.env.DWOLLA_APP_SECRET,
		environment: environment as "production" | "sandbox",
	});

	const accessToken = await authenticate();
	return { client, accessToken };
}

export { createDwollaClient as default, authenticate };

export async function updateUserDwollaCustomerId(userId: User["id"], dwollaCustomerUrl: string, dwollaCustomerId: string): Promise<User> {
	return prisma.user.update({
		where: { id: userId },
		data: { dwollaCustomerUrl, dwollaCustomerId },
	});
}

export async function updateFundingSourceURL(accountId: Bank["accountId"], fundingSourceUrl: string): Promise<Bank> {
	return prisma.bank.update({
		where: { id: Number(accountId) },
		data: { fundingSourceUrl },
	});
}
