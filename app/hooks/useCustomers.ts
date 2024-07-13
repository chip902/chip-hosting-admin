import { Customer } from "@prisma/client";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

const fetchCustomers = async (): Promise<Customer[]> => {
	const response = await axios.get("/api/customers");
	return response.data;
};

export const useCustomers = () =>
	useQuery<Customer[]>({
		queryKey: ["customers"],
		queryFn: fetchCustomers,
		staleTime: 60 * 1000,
		retry: 3,
	});
