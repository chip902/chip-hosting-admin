"use client";
import * as Form from "@radix-ui/react-form";
import { Button, Dialog, Flex, IconButton, Spinner, TextField } from "@radix-ui/themes";
import { zodResolver } from "@hookform/resolvers/zod";
import { projectSchema } from "../validationSchemas";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import ErrorMessage from "@/components/ErrorMessage";
import { Cross1Icon, DotsVerticalIcon } from "@radix-ui/react-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";

type ProjectSchema = z.infer<typeof projectSchema>;

interface EditProjectProps {
	project?: {
		id: number;
		name: string | null;
		customerId: number | null;
		rate: number | null;
		description: string | null;
	};
}

const EditCustomer = ({ project }: EditProjectProps) => {
	const router = useRouter();
	const queryClient = useQueryClient();
	const {
		register,
		handleSubmit,
		setValue,
		formState: { errors },
	} = useForm<ProjectSchema>({
		resolver: zodResolver(projectSchema),
		defaultValues: {
			id: project?.id,
			description: project?.description || "",
			name: project?.name || "",
			rate: project?.rate || 0,
		},
	});
	const [error, setError] = useState("");
	const [submitting, setSubmitting] = useState(false);

	useEffect(() => {
		if (project) {
			setValue("id", project.id);
			setValue("name", project.name || "");
			setValue("rate", project.rate || 0);
			setValue("description", project.description || "");
		}
	}, [project, setValue]);

	const mutation = useMutation<void, Error, ProjectSchema>({
		mutationFn: async (data: ProjectSchema) => {
			const newData = {
				...data,
				rate: data.rate,
				name: data.name,
				description: data.description,
			};

			if (project) {
				await axios.patch(`/api/projects/${project.id}`, newData);
			}
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["projects"] });
			setSubmitting(false);
			router.push("/projects");
			router.refresh();
		},
		onError: (error: Error) => {
			console.error("Error occurred during submission:", error);
			setSubmitting(false);
			setError("An unexpected error occurred");
		},
	});

	const onSubmit = (data: ProjectSchema) => {
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
							<Form.Label>Project Name</Form.Label>
							<Form.Control asChild>
								<TextField.Root placeholder="Project Name" {...register("name")} />
							</Form.Control>
							{errors.name && <ErrorMessage>{errors.name.message}</ErrorMessage>}
						</Form.Field>
						<Form.Field name="description" className="flex-1">
							<Form.Label className="mr-2">Project Description</Form.Label>
							<Form.Control asChild>
								<TextField.Root placeholder="Description" {...register("description")} />
							</Form.Control>
							{errors.description && <ErrorMessage>{errors.description.message}</ErrorMessage>}
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
