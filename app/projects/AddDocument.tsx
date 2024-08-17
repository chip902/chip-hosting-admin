"use client";
import * as Form from "@radix-ui/react-form";
import { Button, Dialog, Flex, Spinner, TextField } from "@radix-ui/themes";
import { zodResolver } from "@hookform/resolvers/zod";
import { projectSchema } from "../validationSchemas";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Project } from "@prisma/client";
import { useForm } from "react-hook-form";
import axios from "axios";
import ErrorMessage from "@/components/ErrorMessage";

type ProjectSchema = z.infer<typeof projectSchema>;

const AddDocument = ({ project }: { project?: Project }) => {
	const router = useRouter();
	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<ProjectSchema>({
		resolver: zodResolver(projectSchema),
	});
	const [error, setError] = useState("");
	const [submitting, setSubmitting] = useState(false);

	const onSubmit = async (data: ProjectSchema) => {
		try {
			setSubmitting(true);
			const newData = {
				...data,
				rate: data.rate,
			};

			if (data) {
				await axios.patch("/api/projects/" + data.id, newData);
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
								<Dialog.Close>
									<Button type="submit" variant="solid" color="green" size="2" disabled={submitting}>
										{submitting && <Spinner />} Add
									</Button>
								</Dialog.Close>
							</Flex>
						</Flex>
					</Form.Root>
				</Dialog.Content>
			</Dialog.Root>
		</Flex>
	);
};

export default AddDocument;
