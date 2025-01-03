// lib/plaid.ts
import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";

// Determine the environment based on NODE_ENV
const environment = process.env.NODE_ENV === "production" ? PlaidEnvironments.production : PlaidEnvironments.sandbox;

const config = new Configuration({
	basePath: environment,
	baseOptions: {
		headers: {
			"PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID,
			"PLAID-SECRET": process.env.NODE_ENV === "production" ? process.env.PLAID_PROD_SECRET : process.env.PLAID_SECRET,
		},
	},
});

export const plaidClient = new PlaidApi(config);
