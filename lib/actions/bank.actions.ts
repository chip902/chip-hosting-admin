import { plaidClient } from "../plaid";
import prisma from "@/prisma/client";
import { CountryCode } from "plaid";
import { Account } from "@/types";
import axios from "axios";

const PLAID_API_URL = process.env.PLAID_API_URL || "https://sandbox.plaid.com";
const PLAID_CLIENT_ID = process.env.PLAID_CLIENT_ID;
const PLAID_SECRET = process.env.PLAID_SECRET;

export const getAccounts = async (userId: string): Promise<Account[]> => {
	try {
		const accessToken = await getAccessTokenForUser(userId);

		if (!PLAID_CLIENT_ID || !PLAID_SECRET) {
			throw new Error("Plaid client ID or secret is not set");
		}

		const response = await axios.post(`${PLAID_API_URL}/accounts/get`, {
			client_id: PLAID_CLIENT_ID,
			secret: PLAID_SECRET,
			access_token: accessToken,
		});

		return response.data.accounts;
	} catch (error) {
		console.error("Error fetching accounts from Plaid:", error);
		throw new Error("Failed to fetch accounts");
	}
};

export const getAccount = async (bankId: number) => {
	try {
		const bank = await prisma.bank.findUnique({
			where: { id: bankId },
		});

		if (!bank || !bank.accessToken) {
			throw new Error("Bank not found or access token is missing");
		}

		const accountsResponse = await plaidClient.accountsGet({
			access_token: bank.accessToken,
		});
		const accountData = accountsResponse.data.accounts[0];

		const institution = await getInstitution(accountsResponse.data.item.institution_id!);

		const transactions = await getTransactions(bank.accessToken);

		const account = {
			id: accountData.account_id,
			availableBalance: accountData.balances.available!,
			currentBalance: accountData.balances.current!,
			institutionId: institution.institution_id,
			name: accountData.name,
			officialName: accountData.official_name,
			mask: accountData.mask!,
			type: accountData.type,
			subtype: accountData.subtype!,
			bankId: bank.id,
		};

		return { account, transactions };
	} catch (error) {
		console.error("An error occurred while getting the account:", error);
		throw error;
	}
};

export const getInstitution = async (institutionId: string) => {
	try {
		const institutionResponse = await plaidClient.institutionsGetById({
			institution_id: institutionId,
			country_codes: ["US"] as CountryCode[],
		});

		return institutionResponse.data.institution;
	} catch (error) {
		console.error("An error occurred while getting the institution:", error);
		throw error;
	}
};

export const getTransactions = async (accessToken: string) => {
	try {
		const response = await plaidClient.transactionsSync({
			access_token: accessToken,
		});

		return response.data.added.map((transaction) => ({
			id: transaction.transaction_id,
			name: transaction.name,
			paymentChannel: transaction.payment_channel,
			type: transaction.payment_channel,
			accountId: transaction.account_id,
			amount: transaction.amount,
			pending: transaction.pending,
			category: transaction.category ? transaction.category[0] : "",
			date: transaction.date,
			image: transaction.logo_url,
		}));
	} catch (error) {
		console.error("An error occurred while getting the transactions:", error);
		throw error;
	}
};

async function getUserWithBank(userId: string) {
	const user = await prisma.user.findUnique({
		where: { userId },
		include: {
			banks: true,
		},
	});

	if (!user || !user.banks.length) {
		throw new Error("User not found or no bank information available");
	}

	// Access the accessToken from the Bank model
	const plaidAccessToken = user.banks[0].accessToken;

	return {
		userId: user.userId,
		email: user.email,
		plaid_access_token: plaidAccessToken,
		// other fields may be required
	};
}

// Function to fetch only the Plaid access token for a user
async function getAccessTokenForUser(userId: string): Promise<string> {
	const user = await prisma.user.findUnique({
		where: { userId },
		include: {
			banks: true,
		},
	});

	if (!user || !user.banks.length) {
		throw new Error("Access token not found");
	}

	return user.banks[0].accessToken;
}
