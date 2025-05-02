"use client";
import AddCustomer from "./AddCustomer";
import { useCustomers } from "../hooks/useCustomers";
import EditCustomer from "./EditCustomer";
import { Customer } from "@/prisma/app/generated/prisma/client";
import React from "react";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { Box } from "lucide-react";

const CustomerTable = () => {
	const { data: customers } = useCustomers();
	return (
		<div className="flex flex-col p-8 bg-gray-25 dark:bg-gray-900">
			<div className="flex justify-between items-center mb-6">
				<h2 className="header-box-title">Customers</h2>
				<AddCustomer />
			</div>

			<div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
				<Table>
					<TableHeader>
						<TableRow className="border-b border-gray-200 dark:border-gray-700">
							<TableCell className="text-14 font-semibold text-gray-700 dark:text-gray-300">Customer name</TableCell>
							<TableCell className="text-14 font-semibold text-gray-700 dark:text-gray-300">Primary Email</TableCell>
							<TableCell className="text-14 font-semibold text-gray-700 dark:text-gray-300">Default Rate</TableCell>
							<TableCell className="text-14 font-semibold text-gray-700 dark:text-gray-300">Display Color</TableCell>
							<TableCell className="text-14 font-semibold text-gray-700 dark:text-gray-300" />
						</TableRow>
					</TableHeader>

					<TableBody>
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
								<TableRow key={customerData.id} className="border-b border-gray-200 dark:border-gray-700">
									<TableCell className="text-14 text-gray-900 dark:text-gray-100">{customerData.name}</TableCell>
									<TableCell className="text-14 text-gray-900 dark:text-gray-100">{customerData.email}</TableCell>
									<TableCell className="text-14 text-gray-900 dark:text-gray-100">${customerData.defaultRate}</TableCell>
									<TableCell>
										<div className="flex items-center">
											<Box
												style={{
													backgroundColor: customer.color || "#fff",
													width: "24px",
													height: "24px",
													borderRadius: "6px",
													border: "1px solid #ddd",
												}}
											/>
										</div>
									</TableCell>
									<TableCell>
										<div className="flex justify-end">
											<EditCustomer customer={customerData} />
										</div>
									</TableCell>
								</TableRow>
							);
						})}
					</TableBody>
				</Table>
			</div>
		</div>
	);
};

export default CustomerTable;
