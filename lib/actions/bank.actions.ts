import { plaidClient } from "../plaid";
import prisma from "@/prisma/client";
import { CountryCode } from "plaid";
import { Account } from "@/types";

export const getAccounts = async (userId: string): Promise<Account[]> => {
	const response = await fetch(`/api/bank/get-accounts?userId=${userId}`);
	if (!response.ok) {
		throw new Error("Failed to fetch accounts");
	}
	return response.json();
};

export const getAccount = async (bankId: number) => {
	try {
		const bank = await prisma.bank.findUnique({
			where: { id: bankId },
		});

		if (!bank) {
			throw new Error("Bank not found");
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
		console.log("TRANSACTION DEBUG: ", response);

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
