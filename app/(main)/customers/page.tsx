"use client";
import { AddCustomer } from "./AddCustomer";
import EditCustomer from "./EditCustomer";
import { useCustomers } from "@/app/hooks/useCustomers";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { Box } from "lucide-react";
import { DotsVerticalIcon } from "@radix-ui/react-icons";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import type { Customer } from "@/types/prisma";

const CustomerTable = () => {
	const { data: customers } = useCustomers();
	const [addDialogOpen, setAddDialogOpen] = useState(false);
	const [editDialogOpen, setEditDialogOpen] = useState(false);
	const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

	return (
		<div className="flex flex-col p-8 bg-background">
			<div className="flex justify-between items-center mb-6">
				<h2 className="header-box-title">Customers</h2>
				<Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
					<DialogTrigger asChild>
						<Button variant="outline" className="h-9 px-4 py-2">
							Add Customer
						</Button>
					</DialogTrigger>
					<DialogContent className="sm:max-w-[500px]">
						<DialogHeader>
							<DialogTitle>Add Customer</DialogTitle>
							<DialogDescription>Add a new customer to your system.</DialogDescription>
						</DialogHeader>
						<AddCustomer onClose={() => setAddDialogOpen(false)} />
					</DialogContent>
				</Dialog>
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
								employmentType: customer.employmentType,
								isW2: customer.isW2,
								w2HourlyRate: customer.w2HourlyRate
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
											<Dialog
												open={editDialogOpen && selectedCustomer?.id === customerData.id}
												onOpenChange={(open) => {
													setEditDialogOpen(open);
													if (!open) setSelectedCustomer(null);
												}}>
												<DialogTrigger asChild>
													<button
														className="inline-flex items-center justify-center p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
														onClick={() => {
															setSelectedCustomer(customerData);
															setEditDialogOpen(true);
														}}>
														<DotsVerticalIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
													</button>
												</DialogTrigger>
												<DialogContent className="sm:max-w-[500px]">
													<DialogHeader>
														<DialogTitle>Edit Customer</DialogTitle>
														<DialogDescription>Update the customer information below.</DialogDescription>
													</DialogHeader>
													<EditCustomer
														customer={{
															id: customerData.id,
															name: customerData.name || "",
															shortName: customerData.shortName || "",
															email: customerData.email,
															dateCreated: customerData.dateCreated,
															defaultRate: customerData.defaultRate,
															color: customerData.color,
															paymentTerms: customerData.paymentTerms,
														}}
														onClose={() => {
															setEditDialogOpen(false);
															setSelectedCustomer(null);
														}}
													/>
												</DialogContent>
											</Dialog>
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
