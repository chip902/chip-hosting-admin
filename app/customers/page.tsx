"use client";
import { Flex, Table } from "@radix-ui/themes";
import AddCustomer from "./AddCustomer";
import { Customer } from "@prisma/client";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";

const CustomerTable = () => {
	const { data: customers } = useCustomers();
	return (
		<>
			<Flex justify="end" p="3">
				<AddCustomer />
			</Flex>
			<Table.Root variant="surface">
				<Table.Header>
					<Table.Row>
						<Table.ColumnHeaderCell>Customer name</Table.ColumnHeaderCell>
						<Table.ColumnHeaderCell>Primary Email</Table.ColumnHeaderCell>
						<Table.ColumnHeaderCell>Default Rate</Table.ColumnHeaderCell>
					</Table.Row>
				</Table.Header>

				<Table.Body>
					{customers?.map((customer) => (
						<Table.Row key={customer.id}>
							<Table.RowHeaderCell>{customer.name}</Table.RowHeaderCell>
							<Table.Cell>{customer.email}</Table.Cell>
							<Table.Cell>${customer.defaultRate}</Table.Cell>
						</Table.Row>
					))}
				</Table.Body>
			</Table.Root>
		</>
	);
};

const useCustomers = () =>
	useQuery<Customer[]>({
		queryKey: ["customer"],
		queryFn: () => axios.get("/api/customers").then((res) => res.data),
		staleTime: 60 * 1000,
		retry: 3,
	});

export default CustomerTable;
