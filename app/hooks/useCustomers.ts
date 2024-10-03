// app/hooks/useCustomers.ts
import { Customer } from "@prisma/client";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

const fetchCustomers = async (): Promise<Customer[]> => {
	try {
		const response = await axios.get("/api/customers");
		if (!response.data || !Array.isArray(response.data)) {
			throw new Error("Invalid customer data response");
		}
		return response.data;
	} catch (error) {
		console.error(error);
		throw error;
	}
};

export const useCustomers = () => {
	const options = {
		queryKey: ["customers", "isInvoiced"],
		queryFn: fetchCustomers,
		staleTime: 15 * 60, // Adjusted stale time to every 15 minutes
		refetchOnMount: true,
		refetchInterval: 30 * 60 * 1000, // Refetch every 30 minutes
		retry: 3,
	};

	return useQuery<Customer[]>(options);
};
