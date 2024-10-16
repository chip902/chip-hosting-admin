import dwollaClient from "@/lib/dwolla";
import prisma from "@/prisma/client";

// Custom type to work around missing typings
type DwollaClient = {
	post: (
		url: string,
		data: any
	) => Promise<{
		headers: {
			get: (key: string) => string | null;
		};
	}>;
	get: (url: string) => Promise<{
		body: {
			_embedded: {
				"funding-sources": any[];
			};
		};
	}>;
};

const getAppToken = async (): Promise<DwollaClient> => {
	return dwollaClient as unknown as DwollaClient;
};

export const createDwollaCustomer = async (userId: string, customerData: any) => {
	try {
		const appToken = await getAppToken();
		const response = await appToken.post("customers", customerData);
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
			return []; // Return an empty array instead of throwing an error
		}

		const appToken = await getAppToken();
		const response = await appToken.get(`${user.dwollaCustomerUrl}/funding-sources`);
		return response.body._embedded["funding-sources"];
	} catch (error) {
		console.error("Error fetching Dwolla accounts: ", error);
		return []; // Return an empty array in case of any error
	}
};
