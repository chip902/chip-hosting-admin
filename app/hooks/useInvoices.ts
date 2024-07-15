import { Invoice } from "@prisma/client";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

const fetchInvoices = async (): Promise<Invoice[]> => {
	const response = await axios.get("/api/invoices");
	return response.data;
};

export const useInvoices = () =>
	useQuery<Invoice[]>({
		queryKey: ["invoices"],
		queryFn: fetchInvoices,
		staleTime: 60 * 1000,
		retry: 3,
	});