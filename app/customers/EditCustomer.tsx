"use client";
import * as Form from "@radix-ui/react-form";
import { Button, Dialog, Flex, IconButton, Spinner, TextField } from "@radix-ui/themes";
import { zodResolver } from "@hookform/resolvers/zod";
import { customerSchema } from "../validationSchemas";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import ErrorMessage from "@/components/ErrorMessage";
import { Cross1Icon, DotsVerticalIcon } from "@radix-ui/react-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";

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
	};
}

const EditCustomer = ({ customer }: EditCustomerProps) => {
	const router = useRouter();
	const queryClient = useQueryClient();
	const {
		register,
		handleSubmit,
		setValue,
		formState: { errors },
	} = useForm<CustomerSchema>({
		resolver: zodResolver(customerSchema),
		defaultValues: {
			id: customer?.id,
			color: customer?.color || "",
			email: customer?.email || "",
			name: customer?.name || "",
			shortname: customer?.shortName || "",
			defaultRate: customer?.defaultRate || 0,
		},
	});
	const [error, setError] = useState("");
	const [submitting, setSubmitting] = useState(false);

	useEffect(() => {
		if (customer) {
			setValue("id", customer.id || undefined);
			setValue("name", customer.name || "");
			setValue("shortname", customer.shortName || "");
			setValue("email", customer.email || "");
			setValue("defaultRate", customer.defaultRate || 0);
			setValue("color", customer.color || "#000000");
		}
	}, [customer, setValue]);

	const mutation = useMutation<void, Error, CustomerSchema>({
		mutationFn: async (data: CustomerSchema) => {
			const newData = {
				...data,
				defaultRate: parseFloat(data.defaultRate.toString()),
				color: data.color,
				name: data.name,
				shortname: data.shortname,
				email: data.email,
			};

			if (customer) {
				await axios.patch(`/api/customers/${customer.id}`, newData);
			}
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["customers"] });
			setSubmitting(false);
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
		<Flex direction="column" gap="2">
			<Dialog.Root>
				<Dialog.Trigger>
					<IconButton variant="ghost">
						<DotsVerticalIcon />
					</IconButton>
				</Dialog.Trigger>

				<Dialog.Content size="4">
					<Dialog.Title>
						<Flex justify="between">
							Edit Customer
							<Dialog.Close>
								<IconButton variant="ghost" size="2">
									<Cross1Icon />
								</IconButton>
							</Dialog.Close>
						</Flex>
					</Dialog.Title>
					<Form.Root onSubmit={handleSubmit(onSubmit)}>
						<Form.Field name="name">
							<Form.Label>Customer Name</Form.Label>
							<Form.Control asChild>
								<TextField.Root placeholder="Customer Name" {...register("name")} />
							</Form.Control>
							{errors.name && <ErrorMessage>{errors.name.message}</ErrorMessage>}
						</Form.Field>
						<Form.Field name="shortName" className="flex-1">
							<Form.Label className="mr-2">Short Name</Form.Label>
							<Form.Control asChild>
								<TextField.Root placeholder="Invoice Code" {...register("shortname")} />
							</Form.Control>
							{errors.shortname && <ErrorMessage>{errors.shortname.message}</ErrorMessage>}
						</Form.Field>
						<Form.Field name="email">
							<Form.Label>Customer Email</Form.Label>
							<Form.Control asChild>
								<TextField.Root placeholder="Primary Email Address" {...register("email")} />
							</Form.Control>
							{errors.email && <ErrorMessage>{errors.email.message}</ErrorMessage>}
						</Form.Field>
						<Form.Field name="defaultRate">
							<Form.Label>Customer Rate</Form.Label>
							<Form.Control asChild>
								<TextField.Root placeholder="Rate per hour USD" {...register("defaultRate", { valueAsNumber: true })} />
							</Form.Control>
							{errors.defaultRate && <ErrorMessage>{errors.defaultRate.message}</ErrorMessage>}
						</Form.Field>
						<Form.Field name="color">
							<Form.Label>Display Color</Form.Label>
							<Form.Control asChild>
								<input type="color" {...register("color")} />
							</Form.Control>
							{errors.color && <ErrorMessage>{errors.color.message}</ErrorMessage>}
						</Form.Field>
						<Flex gap="3" mt="4">
							<Dialog.Close>
								<Button type="button" color="red" size="2">
									Cancel
								</Button>
							</Dialog.Close>
							<Dialog.Close>
								<Button type="submit" variant="solid" color="green" size="2" disabled={submitting}>
									{submitting && <Spinner />} Save
								</Button>
							</Dialog.Close>
						</Flex>
					</Form.Root>
				</Dialog.Content>
			</Dialog.Root>
		</Flex>
	);
};

export default EditCustomer;
