import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";

function initializePlaidClient() {
	const environment = process.env.NODE_ENV === "production" ? PlaidEnvironments.production : PlaidEnvironments.sandbox;

	// Only log in development
	if (process.env.NODE_ENV === "development") {
		console.log("Initializing Plaid client with environment:", {
			nodeEnv: process.env.NODE_ENV,
			usedEnv: environment,
		});
	}

	const configuration = new Configuration({
		basePath: environment,
		baseOptions: {
			headers: {
				"PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID,
				"PLAID-SECRET": process.env.NODE_ENV === "production" ? process.env.PLAID_PROD_SECRET : process.env.PLAID_SECRET,
			},
		},
	});

	return new PlaidApi(configuration);
}

// Initialize and export the client
export const plaidClient = initializePlaidClient();
