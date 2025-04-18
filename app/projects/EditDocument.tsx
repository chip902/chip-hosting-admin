import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { projectSchema } from "../validationSchemas";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import ErrorMessage from "@/components/ErrorMessage";
import { DotsVerticalIcon } from "@radix-ui/react-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogClose, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormLabel } from "@/components/ui/form";
import { Spinner } from "@/components/ui/spinner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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

	const form = useForm<ProjectSchema>({
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
			toast.success("Project updated successfully");
		},
		onError: (error: Error) => {
			console.error("Error occurred during submission:", error.message);
			toast.error("Failed to update project", {
				description: error.message,
			});
		},
	});

	const onSubmit = async (data: ProjectSchema) => {
		if (!project) return;
		toast.promise(mutation.mutateAsync(data), {
			loading: "Updating project...",
			success: "Project updated successfully",
			error: "Failed to update project",
		});
	};

	return (
		<div className="flex items-center">
			<Dialog open={isOpen} onOpenChange={setIsOpen}>
				<DialogTrigger asChild>
					<Button variant="ghost" size="sm" className="h-8 w-8 p-0">
						<DotsVerticalIcon className="h-4 w-4" />
					</Button>
				</DialogTrigger>

				<DialogContent className="sm:max-w-[425px]">
					<div className="flex items-center justify-between border-b pb-2">
						<DialogTitle className="p-0">Edit Project</DialogTitle>
						<DialogClose asChild>
							<Button variant="ghost" className="h-6 w-6 p-0 hover:bg-transparent">
								<span className="sr-only">Close</span>
							</Button>
						</DialogClose>
					</div>

					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<div className="space-y-2">
										<FormLabel>Project Name</FormLabel>
										<FormControl>
											<Input placeholder="Project Name" {...field} />
										</FormControl>
										{error && <ErrorMessage>{error}</ErrorMessage>}
									</div>
								)}
							/>

							<FormField
								control={form.control}
								name="description"
								render={({ field }) => (
									<div className="space-y-2">
										<FormLabel>Description</FormLabel>
										<FormControl>
											<textarea
												placeholder="Description"
												className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
												{...field}
											/>
										</FormControl>
										{error && <ErrorMessage>{error}</ErrorMessage>}
									</div>
								)}
							/>

							<FormField
								control={form.control}
								name="rate"
								render={({ field }) => (
									<div className="space-y-2">
										<FormLabel>Rate (USD)</FormLabel>
										<FormControl>
											<Input type="number" placeholder="Rate per hour" {...field} />
										</FormControl>
										{error && <ErrorMessage>{error}</ErrorMessage>}
									</div>
								)}
							/>

							<div className="flex justify-end space-x-4 pt-4">
								<Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
									Cancel
								</Button>
								<Button type="submit" variant="default" disabled={mutation.isPending}>
									{mutation.isPending && <Spinner className="mr-2 h-4 w-4" />}
									Save Changes
								</Button>
							</div>
						</form>
					</Form>
				</DialogContent>
			</Dialog>
		</div>
	);
};

export default EditDocument;
