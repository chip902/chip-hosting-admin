// FilterComponent.tsx
"use client";
import { useForm } from "react-hook-form";
import { filterSchema } from "../validationSchemas";
import { z } from "zod";
import { useCustomers } from "../hooks/useCustomers";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type FilterFormSchema = z.infer<typeof filterSchema>;

interface FilterComponentProps {
	onApplyFilters: (filters: { startDate?: string; endDate?: string; customerId?: number; invoiceStatus?: string }) => void;
}

const FilterComponent = ({ onApplyFilters }: FilterComponentProps) => {
	const { data: customers, isLoading, error } = useCustomers();
	const [localFilters, setLocalFilters] = useState({
		startDate: "",
		endDate: "",
		customerId: undefined as number | undefined,
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

	const [filters, setFilters] = useState({
		startDate: "",
		endDate: "",
		customerId: undefined,
		invoiceStatus: "",
	});

	const handleFilterChange = (key: string, value: any) => {
		console.log(`Updating ${key} to:`, value); // Debug log
		setLocalFilters((prev) => ({
			...prev,
			[key]: value,
		}));
	};

	const handleApplyFilters = () => {
		console.log("Applying filters:", localFilters); // Debug log

		// Create an object with only the non-empty values
		const filtersToApply = Object.entries(localFilters).reduce((acc, [key, value]) => {
			if (value !== "" && value !== undefined) {
				acc[key] = value;
			}
			return acc;
		}, {} as Record<string, any>);

		console.log("Filtered values to apply:", filtersToApply); // Debug log
		onApplyFilters(filtersToApply);
	};

	// Also update the reset handler to properly reset both states
	// const handleReset = () => {
	// 	const emptyFilters = {
	// 		startDate: "",
	// 		endDate: "",
	// 		customerId: undefined,
	// 		invoiceStatus: "",
	// 	};
	// 	setFilters(emptyFilters);
	// 	onApplyFilters({});
	// };

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
		<div className="p-4">
			<div className="flex items-center space-x-4">
				{/* Customer Select */}
				<div className="flex-1">
					<Label>Select Customer</Label>
					<Select>
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
				</div>

				{/* Start Date */}
				<div className="flex-1">
					<Label>Start Date</Label>
					<Input type="date" className="w-full" value={localFilters.startDate} onChange={(e) => handleFilterChange("startDate", e.target.value)} />
				</div>

				{/* End Date */}
				<div className="flex-1">
					<Label>End Date</Label>
					<Input type="date" className="w-full" value={localFilters.endDate} onChange={(e) => handleFilterChange("endDate", e.target.value)} />
				</div>

				{/* Invoice Status */}
				<div className="flex-1">
					<Label>Invoice Status</Label>
					<Select value={localFilters.invoiceStatus} onValueChange={(value) => handleFilterChange("invoiceStatus", value)}>
						<SelectTrigger>
							<SelectValue placeholder="All Entries" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Entries</SelectItem>
							<SelectItem value="invoiced">Invoiced</SelectItem>
							<SelectItem value="not-invoiced">Not Invoiced</SelectItem>
						</SelectContent>
					</Select>
				</div>

				{/* Action Buttons */}
				<div className="flex items-end space-x-2">
					<Button onClick={handleApplyFilters}>Apply Filters</Button>
					<Button variant="outline" onClick={handleReset}>
						Reset
					</Button>
				</div>
			</div>
		</div>
	);
};

export default FilterComponent;
