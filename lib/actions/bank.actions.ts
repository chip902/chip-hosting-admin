// lib/actions/bank.actions.ts
import { plaidClient } from "@/lib/plaid";
import prisma from "@/prisma/client";
import { Account, GetAccountsResult, Balances } from "@/types";
import { AccountBase as PlaidAccountBase, CountryCode } from "plaid";

const handlePlaidError = (error: unknown, context: string) => {
	if (error instanceof Error) {
		const plaidError = error as any;
		if (plaidError.error_code) {
			console.error(`Plaid error in ${context}:`, {
				error_code: plaidError.error_code,
				error_message: plaidError.error_message,
			});
		} else {
			console.error(`Error in ${context}:`, error.message);
		}
	} else {
		console.error(`Unknown error in ${context}:`, error);
	}
	throw error;
};

const transformPlaidBalances = (plaidBalances: PlaidAccountBase["balances"]): Balances => ({
	available: plaidBalances.available,
	current: plaidBalances.current ?? 0, // Ensure current is never null
	iso_currency_code: plaidBalances.iso_currency_code ?? "USD",
	limit: plaidBalances.limit,
	unofficial_currency_code: plaidBalances.unofficial_currency_code,
});

const transformPlaidAccount = (plaidAccount: PlaidAccountBase, institutionId?: string): Account => ({
	account_id: plaidAccount.account_id,
	id: plaidAccount.account_id,
	balances: transformPlaidBalances(plaidAccount.balances),
	institution_id: institutionId || plaidAccount.account_id,
	mask: plaidAccount.mask || "",
	name: plaidAccount.name,
	official_name: plaidAccount.official_name,
	subtype: plaidAccount.subtype || "",
	type: plaidAccount.type,
	availableBalance: plaidAccount.balances.available,
	currentBalance: plaidAccount.balances.current,
	bankId: null,
});

export const getAccounts = async (userId: string): Promise<GetAccountsResult> => {
	try {
		// Get all banks for the user
		const user = await prisma.user.findUnique({
			where: { userId },
			include: { banks: true },
		});

		if (!user?.banks.length) {
			return { accounts: [], totalBanks: 0, totalCurrentBalance: 0 };
		}

		// Get accounts for all banks
		const allAccounts: Account[] = [];
		let totalCurrentBalance = 0;

		// Process each bank
		for (const bank of user.banks) {
			try {
				const response = await plaidClient.accountsGet({
					access_token: bank.accessToken,
				});

				const accounts = response.data.accounts.map((account) => ({
					id: account.account_id,
					account_id: account.account_id,
					bankId: bank.id.toString(),
					name: account.name,
					mask: account.mask || "",
					type: account.type,
					subtype: account.subtype || "",
					institution_id: bank.bankId,
					balances: {
						available: account.balances.available,
						current: account.balances.current || 0,
						iso_currency_code: account.balances.iso_currency_code || "USD",
						limit: account.balances.limit,
						unofficial_currency_code: account.balances.unofficial_currency_code,
					},
					availableBalance: account.balances.available,
					currentBalance: account.balances.current,
					official_name: account.official_name,
				}));

				allAccounts.push(...accounts);
				totalCurrentBalance += accounts.reduce((sum, account) => sum + (account.currentBalance || 0), 0);
			} catch (error) {
				console.error(`Error fetching accounts for bank ${bank.id}:`, error);
				// Continue with other banks if one fails
			}
		}

		return {
			accounts: allAccounts,
			totalBanks: user.banks.length,
			totalCurrentBalance,
		};
	} catch (error) {
		console.error("Error in getAccounts:", error);
		throw error;
	}
};

export const getAccount = async (bankId: number) => {
	try {
		// Get bank info from your database
		const bank = await prisma.bank.findUnique({
			where: { id: bankId },
		});

		if (!bank?.accessToken) {
			throw new Error("Bank not found or access token is missing");
		}

		// Get account info from Plaid
		const accountsResponse = await plaidClient.accountsGet({
			access_token: bank.accessToken,
		});
		const plaidAccount = accountsResponse.data.accounts[0];
		const institutionId = accountsResponse.data.item.institution_id;

		// Get additional info
		const institution = await getInstitution(institutionId || "");
		const transactions = await getTransactions(bank.accessToken);

		// Transform into your Account type with all necessary fields
		const account: Account = {
			...transformPlaidAccount(plaidAccount, institutionId || undefined),
			id: bank.accountId, // Use your stored accountId
			bankId: bank.id.toString(),
			institution_id: institutionId || null,
			name: plaidAccount.name || institution?.name || "Unknown Bank",
			availableBalance: plaidAccount.balances.available,
			currentBalance: plaidAccount.balances.current,
			type: plaidAccount.type,
			mask: plaidAccount.mask || "",
			subtype: plaidAccount.subtype || "",
			balances: transformPlaidBalances(plaidAccount.balances),
			account_id: bank.accountId,
			official_name: plaidAccount.official_name,
		};

		return {
			account,
			transactions,
			institution: institution || undefined,
		};
	} catch (error) {
		handlePlaidError(error, "getAccount");
		throw error;
	}
};

export const getInstitution = async (institutionId: string) => {
	try {
		const response = await plaidClient.institutionsGetById({
			institution_id: institutionId,
			country_codes: ["US"] as CountryCode[],
			options: {
				include_optional_metadata: true,
			},
		});

		return response.data.institution;
	} catch (error) {
		handlePlaidError(error, "getInstitution");
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
			category: transaction.personal_finance_category?.primary ?? transaction.category?.[0] ?? "uncategorized",
			date: transaction.date,
			image: transaction.logo_url ?? "",
		}));
	} catch (error) {
		handlePlaidError(error, "getTransactions");
		throw error;
	}
};

export const getUserWithBank = async (userId: string) => {
	const user = await prisma.user.findUnique({
		where: { userId },
		include: { banks: true },
	});

	if (!user?.banks.length) {
		throw new Error("User not found or no bank information available");
	}

	return {
		userId: user.userId,
		email: user.email,
		plaid_access_token: user.banks[0].accessToken,
		banks: user.banks,
	};
};

export const getAccessTokenForUser = async (userId: string): Promise<string> => {
	const user = await prisma.user.findUnique({
		where: { userId },
		include: { banks: true },
	});

	if (!user?.banks.length) {
		throw new Error("Access token not found");
	}

	return user.banks[0].accessToken;
};
