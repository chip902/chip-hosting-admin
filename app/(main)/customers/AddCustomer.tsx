"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { customerSchema } from "@/app/validationSchemas";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormLabel, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Customer } from "@/types/prisma";
import { useState } from "react";

type CustomerSchema = z.infer<typeof customerSchema>;

interface AddCustomerProps {
	customer?: Customer;
	onClose: () => void;
}

const AddCustomer = ({ customer, onClose }: AddCustomerProps) => {
	const router = useRouter();
	const [submitting, setSubmitting] = useState(false);
	const [isW2, setIsW2] = useState((customer as any)?.employmentType === 'W2' || false);

	const form = useForm<CustomerSchema>({
		resolver: zodResolver(customerSchema),
		defaultValues: {
			name: customer?.name || "",
			shortName: customer?.shortName || "",
			email: customer?.email || "",
			defaultRate: customer?.defaultRate || 0,
			paymentTerms: customer?.paymentTerms || "30",
			color: customer?.color || "#3b82f6",
			employmentType: (customer as any)?.employmentType || "CONTRACTOR_1099",
			isW2: (customer as any)?.isW2 || false,
			w2HourlyRate: (customer as any)?.w2HourlyRate || undefined,
		},
	});

	const onSubmit = async (data: CustomerSchema) => {
		try {
			setSubmitting(true);
			const newData = {
				...data,
				rate: parseFloat(data.defaultRate.toString()),
				color: data.color || "#3b82f6",
				employmentType: data.employmentType,
				isW2: data.isW2,
				w2HourlyRate: data.w2HourlyRate ? parseFloat(data.w2HourlyRate.toString()) : null,
			};

			if (customer) {
				await axios.patch(`/api/customers/${customer.id}`, newData);
			} else {
				await axios.post("/api/customers", newData);
			}
			setSubmitting(false);
			onClose();
			router.push("/customers");
			router.refresh();
		} catch (error) {
			console.error("Error occurred during submission:", error);
			setSubmitting(false);
		}
	};

	return (
		<div className="flex gap-3 bg-white dark:bg-gray-800 p-4 rounded-lg">
			<Form {...form}>
				<form className="flex flex-col space-y-4 w-full" onSubmit={form.handleSubmit(onSubmit)}>
					<div className="grid grid-cols-2 gap-4">
						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Customer Name</FormLabel>
									<FormControl>
										<Input placeholder="Customer Name" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="shortName"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Short Name</FormLabel>
									<FormControl>
										<Input placeholder="Invoice Code" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="email"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Email</FormLabel>
									<FormControl>
										<Input type="email" placeholder="customer@example.com" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="defaultRate"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Hourly Rate ($)</FormLabel>
									<FormControl>
										<Input
											type="number"
											placeholder="0.00"
											step="0.01"
											{...field}
											onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="paymentTerms"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Payment Terms (days)</FormLabel>
									<FormControl>
										<Input type="number" placeholder="30" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="color"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Color</FormLabel>
									<FormControl>
										<div className="flex items-center gap-2">
											<input
												type="color"
												className="h-10 w-16 p-1 rounded cursor-pointer border border-gray-300 dark:border-gray-600"
												value={field.value || "#3b82f6"}
												onChange={(e) => field.onChange(e.target.value)}
											/>
											<Input
												className="flex-1 h-10"
												value={field.value || "#3b82f6"}
												onChange={(e) => field.onChange(e.target.value)}
												placeholder="#3b82f6"
											/>
										</div>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="employmentType"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Employment Type</FormLabel>
									<Select
										onValueChange={(value) => {
											field.onChange(value);
											const isW2Selected = value === 'W2';
											setIsW2(isW2Selected);
											form.setValue('isW2', isW2Selected);
											if (!isW2Selected) {
												form.setValue('w2HourlyRate', undefined);
											}
										}}
										value={field.value}
									>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Select employment type" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											<SelectItem value="CONTRACTOR_1099">1099 Contractor</SelectItem>
											<SelectItem value="W2">W-2 Employee</SelectItem>
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>

					{isW2 && (
						<div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
							<div className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-3">
								W-2 Employee Settings
							</div>

							<FormField
								control={form.control}
								name="w2HourlyRate"
								render={({ field }) => (
									<FormItem>
										<FormLabel>W-2 Hourly Rate ($)</FormLabel>
										<FormControl>
											<Input
												type="number"
												placeholder="0.00"
												step="0.01"
												{...field}
												value={field.value || ''}
												onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<div className="text-xs text-blue-700 dark:text-blue-300">
								W-2 employees can use quick time entry features with automatic 8-hour workday setup.
							</div>
						</div>
					)}

					<div className="flex justify-end gap-3 mt-4">
						<Button type="button" variant="destructive" onClick={onClose}>
							Cancel
						</Button>
						<Button type="submit" disabled={submitting}>
							{submitting ? (
								<>
									<Spinner className="mr-2 h-4 w-4" />
									Saving...
								</>
							) : (
								<>{customer ? "Update" : "Add"} Customer</>
							)}
						</Button>
					</div>
				</form>
			</Form>
		</div>
	);
};

export { AddCustomer };
