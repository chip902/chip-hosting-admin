import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";

function initializePlaidClient() {
	// Use PLAID_ENV environment variable to explicitly control the Plaid environment
	const plaidEnv = process.env.PLAID_ENVIRONMENT || (process.env.NODE_ENV === "production" ? "production" : "sandbox");
	const environment = plaidEnv === "production" ? PlaidEnvironments.production : PlaidEnvironments.sandbox;

	// Only log in development
	if (process.env.NODE_ENV === "development") {
		console.log("Initializing Plaid client with environment:", {
			nodeEnv: process.env.NODE_ENV,
			plaidEnv,
			usedEnv: environment,
		});
	}

	const configuration = new Configuration({
		basePath: environment,
		baseOptions: {
			headers: {
				"PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID,
				"PLAID-SECRET": plaidEnv === "production" ? process.env.PLAID_PROD_SECRET : process.env.PLAID_SECRET,
			},
		},
	});

	return new PlaidApi(configuration);
}

// Initialize and export the client
export const plaidClient = initializePlaidClient();
