// FilterComponent.tsx
"use client";
import { useForm } from "react-hook-form";
import { filterSchema } from "../validationSchemas";
import { z } from "zod";
import { useCustomers } from "../hooks/useCustomers";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";

type FilterFormSchema = z.infer<typeof filterSchema>;

interface FilterComponentProps {
	onApplyFilters: (filters: FilterFormSchema) => void;
}

const FilterComponent = ({ onApplyFilters }: FilterComponentProps) => {
	const { data: customers, isLoading, error } = useCustomers();
	const form = useForm<FilterFormSchema>({
		resolver: zodResolver(filterSchema),
		defaultValues: {
			customerId: undefined,
			startDate: "",
			endDate: "",
			invoiceStatus: "all",
		},
	});

	const customerId = form.watch("customerId");

	const onSubmit = (data: FilterFormSchema) => {
		// Adjust the end date to include the full day
		const adjustedData = {
			...data,
			endDate: data.endDate ? `${data.endDate}T23:59:59.999` : undefined,
		};
		onApplyFilters(adjustedData);
	};

	const handleReset = () => {
		form.reset();
		form.setValue("customerId", undefined);
		form.handleSubmit(onSubmit)();
	};

	useEffect(() => {
		if (!customerId) {
			form.setValue("customerId", undefined);
		}
	}, [customerId, form.setValue]);

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
		<div className="flex flex-row items-center gap-4">
			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)}>
					<FormField
						control={form.control}
						name="customerId"
						render={({ field }) => (
							<FormItem>
								<FormLabel className="mr-2">Select Customer</FormLabel>
								<FormControl>
									<Select onValueChange={field.onChange} defaultValue={field.value?.toString()}>
										<SelectTrigger>
											<SelectValue placeholder="Select a customer" />
										</SelectTrigger>
										<SelectContent>
											{customers.map((customer) => (
												<SelectItem key={customer.id} value={customer.id.toString()}>
													{customer.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="startDate"
						render={({ field }) => (
							<FormItem className="flex-1">
								<FormLabel className="mr-2">Start Date</FormLabel>
								<FormControl>
									<Input type="date" className="time-input" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="endDate"
						render={({ field }) => (
							<FormItem className="flex-1">
								<FormLabel className="mr-2">End Date</FormLabel>
								<FormControl>
									<Input type="date" className="time-input" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="invoiceStatus"
						render={({ field }) => (
							<FormItem className="flex-1">
								<FormLabel className="mr-2">Invoice Status</FormLabel>
								<FormControl>
									<Select onValueChange={field.onChange} defaultValue={field.value}>
										<SelectTrigger>
											<SelectValue placeholder="Select status" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="all">All Entries</SelectItem>
											<SelectItem value="true">Invoiced Only</SelectItem>
											<SelectItem value="false">Not Invoiced Only</SelectItem>
										</SelectContent>
									</Select>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<div className="gap-3">
						<Button type="submit">Apply Filters</Button>
						<Button type="button" onClick={handleReset}>
							Reset
						</Button>
					</div>
				</form>
			</Form>
		</div>
	);
};

export default FilterComponent;
