// app/projects/AddDocument.tsx
"use client";
import * as Form from "@radix-ui/react-form";
import { Button, Dialog, Flex, Select, Spinner, TextField } from "@radix-ui/themes";
import { zodResolver } from "@hookform/resolvers/zod";
import { projectSchema } from "../validationSchemas";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Customer, Project } from "@prisma/client";
import { useForm } from "react-hook-form";
import axios from "axios";
import ErrorMessage from "@/components/ErrorMessage";

type ProjectSchema = z.infer<typeof projectSchema>;

const AddDocument = ({ project }: { project?: Project }) => {
	const [customers, setCustomers] = useState<Customer[]>([]);
	useEffect(() => {
		const fetchData = async () => {
			try {
				const response = await axios.get("/api/data");
				setCustomers(response.data.customers);
			} catch (error) {
				console.error("Error fetching data:", error);
			}
		};
		fetchData();
	}, []);
	const router = useRouter();
	const {
		register,
		handleSubmit,
		setValue,
		formState: { errors },
	} = useForm<ProjectSchema>({
		resolver: zodResolver(projectSchema),
	});
	const [error, setError] = useState("");
	const [submitting, setSubmitting] = useState(false);

	const onSubmit = async (data: ProjectSchema) => {
		console.log("Form submitted", data);
		try {
			setSubmitting(true);
			const newData = {
				...data,
				rate: data.rate ? parseFloat(data.rate as unknown as string) : undefined,
			};

			if (project) {
				await axios.patch("/api/projects/" + project.id, newData);
			} else {
				await axios.post("/api/projects", newData);
			}
			setSubmitting(false);
			router.push("/projects");
			router.refresh();
		} catch (error) {
			console.error("Error occurred during submission:", error);
			setSubmitting(false);
			setError("An unexpected error occurred");
		}
	};
	const handleSelectChange = <T extends keyof ProjectSchema>(name: T, value: ProjectSchema[T]) => {
		// @ts-ignore
		setValue(name, value, { shouldValidate: true });
	};

	return (
		<Flex direction="column" gap="2">
			<Dialog.Root>
				<Dialog.Trigger>
					<Button variant="solid">Add Project</Button>
				</Dialog.Trigger>

				<Dialog.Content size="4">
					<Dialog.Title>Add A New Project</Dialog.Title>
					<Form.Root onSubmit={handleSubmit(onSubmit)}>
						<Flex className="flex flex-col">
							<Form.Field name="name">
								<Form.Label>Project Name</Form.Label>
								<Form.Control asChild>
									<TextField.Root placeholder="Project Name" {...register("name")} />
								</Form.Control>
								{errors.name && <ErrorMessage>{errors.name.message}</ErrorMessage>}
							</Form.Field>
							<Form.Field name="description" className="flex-1">
								<Form.Label className="mr-2">Project Description</Form.Label>
								<Form.Control asChild>
									<TextField.Root placeholder="Project Description" {...register("description")} />
								</Form.Control>
								{errors.description && <ErrorMessage>{errors.description.message}</ErrorMessage>}
							</Form.Field>
							<Form.Field name="customerId">
								<Form.Label>Customer</Form.Label>
								<Form.Control asChild>
									<Select.Root onValueChange={(value) => handleSelectChange("customerId", parseInt(value))}>
										<Select.Trigger className="w-full" placeholder="Select a Customer" />
										<Select.Content>
											{customers.map((customer) => (
												<Select.Item key={customer.id} value={customer.id.toString()}>
													{customer.name}
												</Select.Item>
											))}
										</Select.Content>
									</Select.Root>
								</Form.Control>
								{errors.customerId && <ErrorMessage>{errors.customerId.message}</ErrorMessage>}
							</Form.Field>
							<Form.Field name="rate">
								<Form.Label>Project Rate</Form.Label>
								<Form.Control asChild>
									<TextField.Root placeholder="Project rate if different from Client Rate" {...register("rate")} />
								</Form.Control>
								{errors.rate && <ErrorMessage>{errors.rate.message}</ErrorMessage>}
							</Form.Field>
							<Flex gap="3" mt="4">
								<Dialog.Close>
									<Button type="button" color="red" size="2">
										Cancel
									</Button>
								</Dialog.Close>
								<Button type="submit" variant="solid" color="green" size="2" disabled={submitting}>
									{submitting && <Spinner />} Add
								</Button>
							</Flex>
						</Flex>
					</Form.Root>
				</Dialog.Content>
			</Dialog.Root>
		</Flex>
	);
};

export default AddDocument;
