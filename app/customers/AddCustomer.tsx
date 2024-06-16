"use client";
import * as Form from "@radix-ui/react-form";
import { Button, Dialog, Flex, Spinner, TextField } from "@radix-ui/themes";
import { zodResolver } from "@hookform/resolvers/zod";
import { customerSchema } from "../validationSchemas";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Customer } from "@prisma/client";
import { useForm } from "react-hook-form";
import axios from "axios";
import ErrorMessage from "@/components/ErrorMessage";

type CustomerSchema = z.infer<typeof customerSchema>;

const AddCustomer = ({ customer }: { customer?: Customer }) => {
	const router = useRouter();
	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<CustomerSchema>({
		resolver: zodResolver(customerSchema),
	});
	const [error, setError] = useState("");
	const [submitting, setSubmitting] = useState(false);

	const onSubmit = async (data: CustomerSchema) => {
		try {
			setSubmitting(true);
			const newData = {
				...data,
				rate: parseFloat(data.rate.toString()),
			};

			if (customer) {
				await axios.patch("/api/customers/" + customer.id, newData);
			} else {
				await axios.post("/api/customers", newData);
			}
			setSubmitting(false);
			router.push("/customers");
			router.refresh();
		} catch (error) {
			console.error("Error occurred during submission:", error);
			setSubmitting(false);
			setError("An unexpected error occurred");
		}
	};

	return (
		<Flex direction="column" gap="2">
			<Dialog.Root>
				<Dialog.Trigger>
					<Button variant="solid">Add Customer</Button>
				</Dialog.Trigger>

				<Dialog.Content size="4">
					<Dialog.Title>Add A New Customer</Dialog.Title>
					<Form.Root onSubmit={handleSubmit(onSubmit)}>
						<Form.Field name="name">
							<Form.Label>Customer Name</Form.Label>
							<Form.Control asChild>
								<TextField.Root placeholder="Customer Name" {...register("name")} />
							</Form.Control>
							{errors.name && <ErrorMessage>{errors.name.message}</ErrorMessage>}
						</Form.Field>
						<Form.Field name="email">
							<Form.Label>Customer Email</Form.Label>
							<Form.Control asChild>
								<TextField.Root placeholder="Primary Email Address" {...register("email")} />
							</Form.Control>
							{errors.email && <ErrorMessage>{errors.email.message}</ErrorMessage>}
						</Form.Field>
						<Form.Field name="rate">
							<Form.Label>Customer Rate</Form.Label>
							<Form.Control asChild>
								<TextField.Root placeholder="Rate per hour USD" {...register("rate", { valueAsNumber: true })} />
							</Form.Control>
							{errors.rate && <ErrorMessage>{errors.rate.message}</ErrorMessage>}
						</Form.Field>
						<Flex gap="3" mt="4">
							<Dialog.Close>
								<Button type="button" color="red" size="2">
									Cancel
								</Button>
							</Dialog.Close>
							<Dialog.Close>
								<Button type="submit" variant="solid" color="green" size="2" disabled={submitting}>
									{submitting && <Spinner />} Add
								</Button>
							</Dialog.Close>
						</Flex>
					</Form.Root>
				</Dialog.Content>
			</Dialog.Root>
		</Flex>
	);
};

export default AddCustomer;
