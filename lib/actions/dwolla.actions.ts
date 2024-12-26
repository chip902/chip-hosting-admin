// lib/actions/dwolla.actions.ts
import createDwollaClient from "@/lib/dwolla";
import prisma from "@/prisma/client";
import { Client } from "dwolla-v2";

// Custom type to work around missing typings
type DwollaClient = Client;

const getAppToken = async (): Promise<DwollaClient> => {
	return createDwollaClient as unknown as DwollaClient;
};

async function makeAuthenticatedRequest(client: DwollaClient, accessToken: string, method: string, path: string, body?: any) {
	const headers = { Authorization: `Bearer ${accessToken}` };
	if (method.toUpperCase() === "POST") {
		return client.post(path, body, headers); // Adjust params according to dwolla-v2's post method
	} else if (method.toUpperCase() === "GET") {
		return client.get(path, headers); // Adjust params according to dwolla-v2's get method
	} else if (method.toUpperCase() === "DELETE") {
		// For delete, might not need body, check dwolla-v2's docs
		return client.delete(path);
	} else {
		throw new Error(`Unsupported HTTP method: ${method}`);
	}
}

export const createDwollaCustomer = async (userId: string, customerData: any) => {
	try {
		const { client, accessToken } = await createDwollaClient();
		const response = await makeAuthenticatedRequest(client, accessToken, "POST", "customers", customerData);

		//const appToken = await getAppToken();
		//const response = await appToken.post("customers", customerData);
		const customerUrl = response.headers.get("location");
		const dwollaCustomerId = customerUrl?.split("/").pop();

		await prisma.user.update({
			where: { userId },
			data: { dwollaCustomerUrl: customerUrl, dwollaCustomerId },
		});

		return { dwollaCustomerId, customerUrl };
	} catch (error) {
		console.error("Error creating Dwolla customer: ", error);
		throw error;
	}
};

export const createFundingSource = async (customerUrl: string, fundingSourceData: any) => {
	try {
		const appToken = await getAppToken();
		const response = await appToken.post(`${customerUrl}/funding-sources`, fundingSourceData);
		return response.headers.get("location");
	} catch (error) {
		console.error("Error creating funding source: ", error);
		throw error;
	}
};

export const createTransfer = async (transferData: any) => {
	try {
		const appToken = await getAppToken();
		const response = await appToken.post("transfers", transferData);
		return response.headers.get("location");
	} catch (error) {
		console.error("Error creating transfer: ", error);
		throw error;
	}
};

export const getDwollaAccounts = async (userId: string) => {
	try {
		const user = await prisma.user.findUnique({
			where: { userId: userId },
			select: { dwollaCustomerUrl: true },
		});

		if (!user || !user.dwollaCustomerUrl) {
			console.log(`Dwolla customer not found for user ID: ${userId}`);
			return [];
		}

		console.log("Dwolla Customer URL:", user.dwollaCustomerUrl);

		const dwollaClient = await createDwollaClient;
		const clientInstance = await dwollaClient();
		const appToken = await getAppToken();
		const dwollaResponse = await appToken.get(`${user.dwollaCustomerUrl}/funding-sources`);
		console.log("Dwolla API Response:", dwollaResponse);

		return dwollaResponse.body._embedded["funding-sources"] || [];
	} catch (error) {
		console.error("Error fetching Dwolla accounts: ", error);
		throw error;
	}
};
