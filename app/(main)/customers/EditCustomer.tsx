"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { customerSchema } from "@/app/validationSchemas";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Form, FormControl, FormField, FormLabel, FormItem, FormMessage } from "@/components/ui/form";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type CustomerSchema = z.infer<typeof customerSchema>;

interface EditCustomerProps {
	customer?: {
		id: number;
		name: string | null;
		shortName: string | null;
		email: string;
		dateCreated: Date;
		defaultRate: number;
		color: string | null;
		paymentTerms: string | null;
		employmentType?: string;
		isW2?: boolean;
		w2HourlyRate?: number;
	};
	onClose: () => void;
}

const EditCustomer = ({ customer, onClose }: EditCustomerProps) => {
	const router = useRouter();
	const queryClient = useQueryClient();
	const [isW2, setIsW2] = useState(customer?.employmentType === 'W2' || false);
	const form = useForm<CustomerSchema>({
		resolver: zodResolver(customerSchema),
		defaultValues: {
			id: customer?.id,
			color: customer?.color || "",
			email: customer?.email || "",
			name: customer?.name || "",
			shortName: customer?.shortName || "",
			defaultRate: customer?.defaultRate || 0,
			paymentTerms: customer?.paymentTerms || "30",
			employmentType: (customer?.employmentType as "W2" | "CONTRACTOR_1099") || "CONTRACTOR_1099",
			isW2: customer?.isW2 || false,
			w2HourlyRate: customer?.w2HourlyRate || undefined,
		},
	});
	const [error, setError] = useState("");
	const [submitting, setSubmitting] = useState(false);

	useEffect(() => {
		if (customer) {
			form.setValue("id", customer.id || undefined);
			form.setValue("name", customer.name || "");
			form.setValue("shortName", customer.shortName || "");
			form.setValue("email", customer.email || "");
			form.setValue("defaultRate", customer.defaultRate || 0);
			form.setValue("color", customer.color || "#000000");
			form.setValue("employmentType", (customer.employmentType as "W2" | "CONTRACTOR_1099") || "CONTRACTOR_1099");
			form.setValue("isW2", customer.isW2 || false);
			form.setValue("w2HourlyRate", customer.w2HourlyRate || undefined);
			setIsW2(customer.employmentType === 'W2');
		}
	}, [customer, form.setValue]);

	const mutation = useMutation<void, Error, CustomerSchema>({
		mutationFn: async (data: CustomerSchema) => {
			const newData = {
				...data,
				defaultRate: parseFloat(data.defaultRate.toString()),
				color: data.color,
				name: data.name,
				shortName: data.shortName,
				email: data.email,
				paymentTerms: data.paymentTerms,
				employmentType: data.employmentType,
				isW2: data.isW2,
				w2HourlyRate: data.w2HourlyRate ? parseFloat(data.w2HourlyRate.toString()) : null,
			};

			if (customer) {
				await axios.patch(`/api/customers/${customer.id}`, newData);
			}
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["customers"] });
			setSubmitting(false);
			onClose();
			router.push("/customers");
			router.refresh();
		},
		onError: (error: Error) => {
			console.error("Error occurred during submission:", error);
			setSubmitting(false);
			setError("An unexpected error occurred");
		},
	});

	const onSubmit = (data: CustomerSchema) => {
		setSubmitting(true);
		mutation.mutate(data);
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
								"Save"
							)}
						</Button>
					</div>
				</form>
			</Form>
		</div>
	);
};

export default EditCustomer;
