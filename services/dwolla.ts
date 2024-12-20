// services/dwolla.ts
// TODO: DELETE EVENTUALLY
import * as lib from "dwolla-v2"; // Replace with actual library if needed

const getUserAccounts = async (userId: string) => {
	// Fetch user's accounts from Dwolla using the library function
	const accounts = 42; //await lib.get({ dwollaCustomerId: userId });
	return accounts;
};

const dwollaService = {
	getUserAccounts,
};

export default dwollaService;
