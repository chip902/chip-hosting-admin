import React from "react";
import * as Form from "@radix-ui/react-form";
import { Button, Dialog, Flex, IconButton, Spinner, TextField } from "@radix-ui/themes";
import { zodResolver } from "@hookform/resolvers/zod";
import { projectSchema } from "../validationSchemas";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import ErrorMessage from "@/components/ErrorMessage";
import { Cross1Icon, DotsVerticalIcon } from "@radix-ui/react-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import AlertDialog from "@/components/AlertDialog";

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

const EditDocument = ({ project }: EditProjectProps) => {
	const queryClient = useQueryClient();
	const router = useRouter();
	const [isOpen, setIsOpen] = useState(false);

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<ProjectSchema>({
		resolver: zodResolver(projectSchema),
		defaultValues: {
			id: project?.id,
			description: project?.description || "",
			name: project?.name || "",
			rate: project?.rate || 0,
			customerId: project?.customerId ?? undefined,
		},
	});

	const [error, setError] = useState("");

	const mutation = useMutation<void, Error, ProjectSchema>({
		mutationFn: async (data: ProjectSchema) => {
			try {
				if (!project?.id) {
					throw new Error("Project ID is missing");
				}

				const newData = {
					...data,
					id: project.id,
					customerId: project.customerId,
				};

				await axios.patch(`/api/projects/${project.id}`, newData);
			} catch (err) {
				console.error("Error during mutation:", err);
				throw err;
			}
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["projects"] });
			setIsOpen(false);
			router.refresh();
		},
		onError: (error: Error) => {
			console.error("Error occurred during submission:", error.message);
			setError(error.message);
		},
	});

	const onSubmit = async (data: ProjectSchema) => {
		if (!project) return;
		await mutation.mutateAsync(data);
	};

	return (
		<Flex direction="column" gap="2">
			{error && <AlertDialog error={error} />}

			<Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
				<Dialog.Trigger>
					<IconButton variant="ghost">
						<DotsVerticalIcon />
					</IconButton>
				</Dialog.Trigger>

				<Dialog.Content size="4">
					<Dialog.Title>
						<Flex justify="between">
							Edit Project
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
								<TextField.Root placeholder="Rate per hour USD" type="number" {...register("rate", { valueAsNumber: true })} />
							</Form.Control>
							{errors.rate && <ErrorMessage>{errors.rate.message}</ErrorMessage>}
						</Form.Field>

						<Flex gap="3" mt="4">
							<Button type="button" color="red" size="2" onClick={() => setIsOpen(false)}>
								Cancel
							</Button>
							<Button type="submit" variant="solid" color="green" size="2" disabled={mutation.isPending}>
								{mutation.isPending && <Spinner />} Save
							</Button>
						</Flex>
					</Form.Root>
				</Dialog.Content>
			</Dialog.Root>
		</Flex>
	);
};

export default EditDocument;
