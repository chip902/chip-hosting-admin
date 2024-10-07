"use client";
import { Box, Flex, Table } from "@radix-ui/themes";
import AddCustomer from "./AddCustomer";
import { useCustomers } from "../hooks/useCustomers";
import EditCustomer from "./EditCustomer";
import { Customer } from "@prisma/client";
import React from "react";

const CustomerTable = () => {
	const { data: customers } = useCustomers();
	return (
		<>
			<Flex justify="end" p="3px" my="3">
				<AddCustomer />
			</Flex>
			<Table.Root variant="surface">
				<Table.Header>
					<Table.Row>
						<Table.ColumnHeaderCell>Customer name</Table.ColumnHeaderCell>
						<Table.ColumnHeaderCell>Primary Email</Table.ColumnHeaderCell>
						<Table.ColumnHeaderCell>Default Rate</Table.ColumnHeaderCell>
						<Table.ColumnHeaderCell>Display Color</Table.ColumnHeaderCell>
						<Table.ColumnHeaderCell />
					</Table.Row>
				</Table.Header>

				<Table.Body>
					{customers?.map((customer) => {
						const customerData: Customer = {
							id: customer.id,
							name: customer.name ?? null,
							shortName: customer.shortName,
							email: customer.email,
							dateCreated: new Date(customer.dateCreated),
							defaultRate: customer.defaultRate,
							color: customer.color ?? null,
							paymentTerms: customer.paymentTerms,
						};

						return (
							<Table.Row key={customerData.id}>
								<Table.RowHeaderCell>{customerData.name}</Table.RowHeaderCell>
								<Table.Cell>{customerData.email}</Table.Cell>
								<Table.Cell>${customerData.defaultRate}</Table.Cell>
								<Table.Cell>
									<Flex>
										<Flex align="center" gap="2">
											<Box
												style={{
													backgroundColor: customer.color || "#fff",
													width: "20px",
													height: "20px",
													borderRadius: "50%",
													border: "1px solid #ddd",
												}}
											/>
										</Flex>
									</Flex>
								</Table.Cell>
								<Table.Cell>
									<Flex justify="center">
										<EditCustomer customer={customerData} />
									</Flex>
								</Table.Cell>
							</Table.Row>
						);
					})}
				</Table.Body>
			</Table.Root>
		</>
	);
};

export default CustomerTable;
