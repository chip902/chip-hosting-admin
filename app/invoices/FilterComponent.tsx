// FilterComponent.tsx
"use client";
import { useForm } from "react-hook-form";
import { Flex, Button, Select } from "@radix-ui/themes";
import { filterSchema } from "../validationSchemas";
import { z } from "zod";
import { useCustomers } from "../hooks/useCustomers";
import { zodResolver } from "@hookform/resolvers/zod";
import * as Form from "@radix-ui/react-form";
import { useEffect } from "react";

type FilterFormSchema = z.infer<typeof filterSchema>;

interface FilterComponentProps {
	onApplyFilters: (filters: FilterFormSchema) => void;
}

const FilterComponent = ({ onApplyFilters }: FilterComponentProps) => {
	const { data: customers, isLoading, error } = useCustomers();
	const { register, setValue, handleSubmit, reset, watch } = useForm<FilterFormSchema>({
		resolver: zodResolver(filterSchema),
		defaultValues: {
			customerId: undefined,
			startDate: "",
			endDate: "",
			invoiceStatus: "all",
		},
	});

	const customerId = watch("customerId");

	const onSubmit = (data: FilterFormSchema) => {
		// Adjust the end date to include the full day
		const adjustedData = {
			...data,
			endDate: data.endDate ? `${data.endDate}T23:59:59.999` : undefined,
		};
		onApplyFilters(adjustedData);
	};

	const handleReset = () => {
		reset();
		setValue("customerId", undefined);
		handleSubmit(onSubmit)();
	};

	useEffect(() => {
		if (!customerId) {
			setValue("customerId", undefined);
		}
	}, [customerId, setValue]);

	if (isLoading) {
		return <div>Loading Filter Items...</div>;
	}

	if (error) {
		return <div>Error fetching data from the database</div>;
	}
	return (
		<Form.Root className="flex flex-row items-center gap-4" onSubmit={handleSubmit(onSubmit)}>
			<Form.Field name="customerId" className="flex-1">
				<Form.Label className="mr-2">Select Customer</Form.Label>
				<Form.Control asChild>
					<Select.Root
						value={customerId ? customerId.toString() : ""}
						onValueChange={(value) => setValue("customerId", value ? parseInt(value, 10) : undefined)}>
						<Select.Trigger placeholder="Select Customer" />
						<Select.Content>
							{customers?.map((customer: { id: number; name: string }) => (
								<Select.Item key={customer.id} value={customer.id.toString()}>
									{customer.name}
								</Select.Item>
							))}
						</Select.Content>
					</Select.Root>
				</Form.Control>
			</Form.Field>
			<Form.Field name="startDate" className="flex-1">
				<Form.Label className="mr-2">Start Date</Form.Label>
				<Form.Control asChild>
					<input className="time-input" type="date" {...register("startDate")} />
				</Form.Control>
			</Form.Field>
			<Form.Field name="endDate" className="flex-1">
				<Form.Label className="mr-2">End Date</Form.Label>
				<Form.Control asChild>
					<input className="time-input" type="date" {...register("endDate")} />
				</Form.Control>
			</Form.Field>
			<Form.Field name="isInvoiced" className="flex-1">
				<Form.Label className="mr-2">Invoice Status</Form.Label>
				<Form.Control asChild>
					<select className="select-input" {...register("invoiceStatus")}>
						<option value="all">All Entries</option>
						<option value="true">Invoiced Only</option>
						<option value="false">Not Invoiced Only</option>
					</select>
				</Form.Control>
			</Form.Field>
			<Flex gap="3">
				<Button type="submit">Apply Filters</Button>
				<Button type="button" onClick={handleReset}>
					Reset
				</Button>
			</Flex>
		</Form.Root>
	);
};

export default FilterComponent;
