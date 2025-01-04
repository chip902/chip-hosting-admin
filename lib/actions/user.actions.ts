import { GetBankProps, GetBanksProps, SignUpParams } from "@/types";
import axios from "axios";
import { parseStringify } from "../utils";

export const getBanks = async ({ userId }: GetBanksProps) => {
	try {
		const request = await axios.get(`/api/bank/get-banks/${userId}`);
		return parseStringify(request.data);
	} catch (error) {
		console.log("Error in getting Banks: ", error);
	}
};

export const getBank = async ({ bankId }: GetBankProps) => {
	try {
		const request = await axios.get(`/api/bank/get-banks/${bankId}`);
		return parseStringify(request.data);
	} catch (error) {
		console.log("Error in getting Banks: ", error);
	}
};
