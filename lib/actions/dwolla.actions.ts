// lib/actions/dwolla.actions.ts
import createDwollaClient from "@/lib/dwolla";
import prisma from "@/prisma/client";
import { Client } from "dwolla-v2";

interface DwollaError {
	code: string;
	message: string;
	_embedded?: {
		errors?: Array<{
			code: string;
			message: string;
			path?: string;
		}>;
	};
}

async function makeAuthenticatedRequest(client: Client, accessToken: string, method: string, path: string, body?: any) {
	const headers = {
		Authorization: `Bearer ${accessToken}`,
		Accept: "application/vnd.dwolla.v1.hal+json",
		"Content-Type": "application/vnd.dwolla.v1.hal+json",
	};

	try {
		switch (method.toUpperCase()) {
			case "POST":
				return await client.post(path, body, headers);
			case "GET":
				return await client.get(path, headers);
			case "DELETE":
				return await client.delete(path);
			default:
				throw new Error(`Unsupported HTTP method: ${method}`);
		}
	} catch (error) {
		if (error instanceof Error) {
			console.error("Dwolla API request failed:", {
				method,
				path,
				errorMessage: error.message,
				response: (error as any).response?.data as DwollaError,
			});
		} else {
			console.error("Unknown error in Dwolla API request:", error);
		}
		throw error;
	}
}
export const getDwollaAccounts = async (userId: string) => {
	try {
		const user = await prisma.user.findUnique({
			where: { userId },
			select: { dwollaCustomerUrl: true },
		});

		if (!user?.dwollaCustomerUrl) {
			console.log(`Dwolla customer not found for user ID: ${userId}`);
			return [];
		}

		console.log("Dwolla Customer URL:", user.dwollaCustomerUrl);

		const { client, accessToken } = await createDwollaClient();

		const response = await makeAuthenticatedRequest(client, accessToken, "GET", `${user.dwollaCustomerUrl}/funding-sources`);

		if (!response.body._embedded?.["funding-sources"]) {
			console.log("No funding sources found:", response.body);
			return [];
		}

		return response.body._embedded["funding-sources"];
	} catch (error) {
		console.error("Error fetching Dwolla accounts:", error);
		throw error;
	}
};

export const createDwollaCustomer = async (userId: string, customerData: any) => {
	try {
		const { client, accessToken } = await createDwollaClient();
		const response = await makeAuthenticatedRequest(client, accessToken, "POST", "customers", customerData);

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
		const { client, accessToken } = await createDwollaClient();
		const response = await makeAuthenticatedRequest(client, accessToken, "POST", `${customerUrl}/funding-sources`, fundingSourceData);
		return response.headers.get("location");
	} catch (error) {
		console.error("Error creating funding source: ", error);
		throw error;
	}
};

export const createTransfer = async (transferData: any) => {
	try {
		const { client, accessToken } = await createDwollaClient();
		const response = await makeAuthenticatedRequest(client, accessToken, "POST", "transfers", transferData);
		return response.headers.get("location");
	} catch (error) {
		console.error("Error creating transfer: ", error);
		throw error;
	}
};
