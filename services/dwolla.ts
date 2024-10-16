// services/dwolla.ts
import * as lib from "dwolla-v2"; // Replace with actual library if needed

const getUserAccounts = async (userId: string) => {
	// Fetch user's accounts from Dwolla using the library function
	const accounts = await lib.getBanks({ dwollaCustomerId: userId });
	return accounts;
};

const dwollaService = {
	getUserAccounts,
};

export default dwollaService;
