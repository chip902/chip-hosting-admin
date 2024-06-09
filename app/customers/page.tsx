import { Button, Flex, Table } from "@radix-ui/themes";
import React from "react";

export default function Customers() {
	return (
		<div className="main-content">
			<Flex justify="end" p="3">
				<Button radius="medium" variant="solid">
					Add Customer
				</Button>
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
					<Table.Row>
						<Table.RowHeaderCell>Danilo Sousa</Table.RowHeaderCell>
						<Table.Cell>danilo@example.com</Table.Cell>
						<Table.Cell>Developer</Table.Cell>
					</Table.Row>

					<Table.Row>
						<Table.RowHeaderCell>Zahra Ambessa</Table.RowHeaderCell>
						<Table.Cell>zahra@example.com</Table.Cell>
						<Table.Cell>Admin</Table.Cell>
					</Table.Row>

					<Table.Row>
						<Table.RowHeaderCell>Jasper Eriksson</Table.RowHeaderCell>
						<Table.Cell>jasper@example.com</Table.Cell>
						<Table.Cell>Developer</Table.Cell>
					</Table.Row>
				</Table.Body>
			</Table.Root>
		</div>
	);
}
