// lib/dwolla-client.ts
import prisma from "@/prisma/client";
import { Bank, User } from "@prisma/client";
import axios from "axios";
import { Client } from "dwolla-v2";

const MAX_RETRIES = 5;
const RETRY_DELAY = 1000; // 1 second

function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

async function authenticate(): Promise<string> {
	const authUrl = process.env.NODE_ENV === "production" ? "https://api.dwolla.com/token" : "https://api-sandbox.dwolla.com/token";

	const response = await axios.get(authUrl, {
		params: {
			client_id: process.env.DWOLLA_APP_KEY,
			client_secret: process.env.DWOLLA_APP_SECRET,
			grant_type: "client_credentials",
		},
	});

	if (!response) {
		throw new Error(`Failed to authenticate with Dwolla: ${await response}`);
	}

	const data = await response.data;
	// Save the access token for future requests
	return data.access_token;
}

async function createDwollaClient(retries = 0): Promise<{ client: Client; accessToken: string }> {
	console.log("Attempting to create Dwolla client. Attempt:", retries + 1);
	console.log("DWOLLA_APP_KEY:", process.env.DWOLLA_APP_KEY);
	console.log("DWOLLA_APP_SECRET:", process.env.DWOLLA_APP_SECRET);
	console.log("DWOLLA_ENVIRONMENT:", process.env.DWOLLA_ENVIRONMENT);

	if (!process.env.DWOLLA_APP_KEY || !process.env.DWOLLA_APP_SECRET) {
		if (retries < MAX_RETRIES) {
			console.log("Environment variables not loaded. Retrying...");
			await sleep(RETRY_DELAY);
			return createDwollaClient(retries + 1);
		}
		throw new Error("DWOLLA_APP_KEY and DWOLLA_APP_SECRET must be defined");
	}

	const client = new Client({
		key: process.env.DWOLLA_APP_KEY,
		secret: process.env.DWOLLA_APP_SECRET,
		environment: (process.env.DWOLLA_ENVIRONMENT as "production" | "sandbox") || "sandbox",
	});

	const result = await authenticate();
	return { client, accessToken: result };
}

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
export default createDwollaClient;
