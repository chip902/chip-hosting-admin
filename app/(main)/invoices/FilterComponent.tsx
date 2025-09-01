"use client";
import { useForm } from "react-hook-form";
import { filterSchema } from "@/app/validationSchemas";
import { z } from "zod";
import { useCustomers } from "@/app/hooks/useCustomers";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Customer } from "@/prisma/app/generated/prisma/client";

type FilterFormSchema = z.infer<typeof filterSchema>;

interface FilterComponentProps {
	onApplyFilters: (filters: { startDate?: string; endDate?: string; customerId?: number; invoiceStatus?: string }) => void;
}

const FilterComponent = ({ onApplyFilters }: FilterComponentProps) => {
	const { data: customers, isLoading, error } = useCustomers();
	const [localFilters, setLocalFilters] = useState({
		startDate: "",
		endDate: "",
		customerId: undefined as string | undefined,
		invoiceStatus: "",
	});
	const form = useForm<FilterFormSchema>({
		resolver: zodResolver(filterSchema),
		defaultValues: {
			customerId: undefined,
			startDate: "",
			endDate: "",
			invoiceStatus: "all",
		},
	});

	// const [filters, setFilters] = useState({
	// 	startDate: "",
	// 	endDate: "",
	// 	customerId: undefined,
	// 	invoiceStatus: "",
	// });

	// const handleFilterChange = (key: string, value: any) => {
	// 	console.log(`Updating ${key} to:`, value); // Debug log
	// 	setLocalFilters((prev) => ({
	// 		...prev,
	// 		[key]: value,
	// 	}));
	// };

	// const handleApplyFilters = () => {
	// 	console.log("Applying filters:", localFilters); // Debug log

	// 	// Create an object with only the non-empty values
	// 	const filtersToApply = Object.entries(localFilters).reduce((acc, [key, value]) => {
	// 		if (value !== "" && value !== undefined) {
	// 			acc[key] = value;
	// 		}
	// 		return acc;
	// 	}, {} as Record<string, any>);

	// 	console.log("Filtered values to apply:", filtersToApply); // Debug log
	// 	onApplyFilters(filtersToApply);
	// };

	// Also update the reset handler to properly reset both states
	// const handleReset = () => {
	// 	const emptyFilters = {
	// 		startDate: "",
	// 		endDate: "",
	// 		customerId: undefined,
	// 		invoiceStatus: "",
	// 	};
	const customerId = form.watch("customerId");

	const onSubmit = (data: FilterFormSchema) => {
		console.log("Form submission started");
		console.log("Form submitted with data:", data);
		const adjustedData = {
			...data,
			// Normalize dates: empty -> undefined; endDate inclusive end of day
			startDate: data.startDate ? data.startDate : undefined,
			endDate: data.endDate ? `${data.endDate}T23:59:59.999` : undefined,
			// Convert invoice status to API expectations; 'all' -> undefined
			invoiceStatus:
				data.invoiceStatus === "all"
					? undefined
					: data.invoiceStatus === "invoiced"
						? "true"
						: data.invoiceStatus === "not-invoiced"
							? "false"
							: data.invoiceStatus,
		};
		console.log("Adjusted data:", adjustedData);
		onApplyFilters(adjustedData);
	};

	const handleReset = () => {
		// Reset the form UI to defaults but send undefineds to clear filters upstream
		form.reset({
			customerId: undefined,
			startDate: "",
			endDate: "",
			invoiceStatus: "all",
		});
		onApplyFilters({
			customerId: undefined,
			startDate: undefined,
			endDate: undefined,
			invoiceStatus: undefined,
		});
	};

	if (isLoading) {
		return <div>Loading Filter Items...</div>;
	}

	if (!customers) {
		return <Alert>No Customers Found</Alert>;
	}

	if (error) {
		return <div>Error fetching data from the database</div>;
	}
	return (
		<div className="p-4">
			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
					<div className="flex space-x-2">
						{/* Customer Select */}
						<FormField
							control={form.control}
							name="customerId"
							render={({ field }) => (
								<FormItem className="w-full">
									<FormLabel>Customer</FormLabel>
									<Select
										onValueChange={(value) => {
											field.onChange(value ? parseInt(value) : undefined);
										}}
										value={field.value !== undefined ? field.value.toString() : undefined}>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Select a customer" />
											</SelectTrigger>
										</FormControl>
										<SelectContent className="max-h-40">
											{customers?.map((customer: Customer) => (
												<SelectItem key={customer.id} value={customer.id.toString()}>
													{customer.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</FormItem>
							)}
						/>

						{/* Start Date */}
						<FormField
							control={form.control}
							name="startDate"
							render={({ field }) => (
								<FormItem className="w-full">
									<FormLabel>Start Date</FormLabel>
									<FormControl>
										<Input type="date" {...field} className="w-full" />
									</FormControl>
								</FormItem>
							)}
						/>

						{/* End Date */}
						<FormField
							control={form.control}
							name="endDate"
							render={({ field }) => (
								<FormItem className="w-full">
									<FormLabel>End Date</FormLabel>
									<FormControl>
										<Input type="date" {...field} className="w-full" />
									</FormControl>
								</FormItem>
							)}
						/>

						{/* Invoice Status */}
						<FormField
							control={form.control}
							name="invoiceStatus"
							render={({ field }) => (
								<FormItem className="w-full">
									<FormLabel>Invoice Status</FormLabel>
									<Select onValueChange={field.onChange} value={field.value ?? "all"}>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="All Entries" />
											</SelectTrigger>
										</FormControl>
										<SelectContent className="max-h-40">
											<SelectItem value="all">All Entries</SelectItem>
											<SelectItem value="invoiced">Invoiced</SelectItem>
											<SelectItem value="not-invoiced">Not Invoiced</SelectItem>
										</SelectContent>
									</Select>
								</FormItem>
							)}
						/>
						{/* Action Buttons */}
						<div className="flex items-end space-x-2">
							<Button type="submit">Apply Filters</Button>
							<Button variant="outline" onClick={handleReset} type="button">
								Reset
							</Button>
						</div>
					</div>
				</form>
			</Form>
		</div>
	);
};

export default FilterComponent;
