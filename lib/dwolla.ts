import { Client } from "dwolla-v2";

const MAX_RETRIES = 5;
const RETRY_DELAY = 1000; // 1 second

function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

async function createDwollaClient(retries = 0): Promise<Client> {
	console.log("Attempting to create Dwolla client. Attempt:", retries + 1);
	console.log("DWOLLA_APP_KEY:", process.env.DWOLLA_APP_KEY);
	console.log("DWOLLA_APP_SECRET:", process.env.DWOLLA_APP_SECRET);
	console.log("DWOLLA_ENVIRONMENT:", process.env.DWOLLA_ENVIRONMENT);

	if (!process.env.DWOLLA_APP_KEY || !process.env.DWOLLA_APP_SECRET) {
		if (retries < MAX_RETRIES) {
			console.log("Environment variables not loaded. Retrying...");
			await sleep(RETRY_DELAY);
			return createDwollaClient(retries + 1);
		}
		throw new Error("DWOLLA_APP_KEY and DWOLLA_APP_SECRET must be set in environment variables");
	}

	return new Client({
		key: process.env.DWOLLA_APP_KEY,
		secret: process.env.DWOLLA_APP_SECRET,
		environment: process.env.DWOLLA_ENVIRONMENT === "production" ? "production" : "sandbox",
	});
}

export default createDwollaClient();
