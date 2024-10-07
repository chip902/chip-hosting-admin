import { createBankAccountProps, exchangePublicTokenProps, User } from "@/types";
import { CountryCode, ProcessorTokenCreateRequest, ProcessorTokenCreateRequestProcessorEnum, Products } from "plaid";
import { plaidClient } from "../plaid";
import { encryptId, parseStringify } from "../utils";
import { revalidatePath } from "next/cache";
import { addFundingSource, createDwollaCustomer } from "./dwolla.actions";
import axios from "axios";

export const createLinkToken = async (user: User) => {
	try {
		if (!user.$id) throw new Error("User client ID is required");
		const tokenParams = {
			user: {
				client_user_id: user.$id,
			},
			client_name: `${user.firstName} ${user.lastName}`,
			products: ["auth"] as Products[],
			language: "en",
			country_codes: ["US"] as CountryCode[],
		};
		const response = await plaidClient.linkTokenCreate(tokenParams);

		return parseStringify({ linkToken: response.data.link_token });
	} catch (error) {
		console.log(error);
	}
};

export const createBankAccount = async ({ userId, bankId, accountId, accessToken, fundingSourceUrl, sharableId }: createBankAccountProps) => {
	try {
		const response = await axios.post("/api/plaid/new-bank/", { userId, bankId, accountId, accessToken, fundingSourceUrl, sharableId });
	} catch (error) {
		console.log(error);
	}
};

export const exchangePublicToken = async ({ publicToken, user }: exchangePublicTokenProps) => {
	try {
		const response = await plaidClient.itemPublicTokenExchange({
			public_token: publicToken,
		});
		const accessToken = response.data.access_token;
		const itemId = response.data.item_id;
		const accountsResponse = plaidClient.accountsGet({
			access_token: accessToken,
		});
		const accountData = (await accountsResponse).data.accounts[0];
		const request: ProcessorTokenCreateRequest = {
			access_token: accessToken,
			account_id: accountData.account_id,
			processor: "dwolla" as ProcessorTokenCreateRequestProcessorEnum,
		};
		const processorTokenResponse = await plaidClient.processorTokenCreate(request);
		const processToken = processorTokenResponse.data.processor_token;

		const fundingSourceUrl = await addFundingSource({
			dwollaCustomerId: user.dwollaCustomerId,
			processToken: processToken,
			bankName: accountData.name,
		});
		if (!fundingSourceUrl) throw new Error("fundingSourceUrl is required but was not provided");
		if (typeof itemId !== "string") throw new Error("itemId must be a string but got a different type of value.");

		await createBankAccount({
			userId: user.id,
			bankId: itemId,
			accountId: accountData.account_id,
			accessToken,
			fundingSourceUrl,
			sharableId: encryptId(accountData.account_id),
		});
		revalidatePath("/");
		return parseStringify({
			publicTokenExchange: "Complete!",
		});
	} catch (error) {
		console.log(error);
	}
};
