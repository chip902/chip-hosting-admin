// lib/dwolla-client.ts
import prisma from "@/prisma/client";
import { Bank, User } from "@prisma/client";
import { Client } from "dwolla-v2";

const MAX_RETRIES = 5;
const RETRY_DELAY = 1000; // 1 second

function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

async function authenticate(client: Client): Promise<void> {
	const authUrl = process.env.NODE_ENV === "production" ? "https://www.dwolla.com/oauth/v2/token" : "https://sandbox_dwolla.com/oauth/v2/token";

	const response = await fetch(authUrl, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			client_id: process.env.DWOLLA_APP_KEY,
			client_secret: process.env.DWOLLA_APP_SECRET,
			grant_type: "client_credentials",
		}),
	});

	if (!response.ok) {
		throw new Error(`Failed to authenticate with Dwolla: ${await response.text()}`);
	}

	const data = await response.json();
	// Save the access token for future requests
	// client.token = data.access_token;
}

async function createDwollaClient(retries = 0): Promise<Client> {
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

	await authenticate(client);

	return client;
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
