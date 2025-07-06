// app/projects/AddDocument.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { projectSchema } from "@/app/validationSchemas";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Project from "@prisma/client";
import { useForm } from "react-hook-form";
import axios from "axios";
import { Dialog, DialogClose, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormLabel } from "@/components/ui/form";
import { Spinner } from "@/components/ui/spinner";
import { Input } from "@/components/ui/input";
import { SelectContent, SelectItem, SelectTrigger, Select } from "@/components/ui/select";
import { toast } from "sonner";
import { Customer } from "@/types";

type ProjectSchema = z.infer<typeof projectSchema>;

const AddDocument = ({ project }: { project?: typeof Project }) => {
	const [customers, setCustomers] = useState<Customer[]>([]);
	const [isModalOpen, setIsModalOpen] = useState(false);

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
	const form = useForm<ProjectSchema>({
		resolver: zodResolver(projectSchema),
	});
	const [error, setError] = useState("");
	const [submitting, setSubmitting] = useState(false);

	const onSubmit = async (data: ProjectSchema) => {
		try {
			setSubmitting(true);
			const newData = {
				...data,
				archived: false,
				rate: data.rate ? parseFloat(data.rate as unknown as string) : undefined,
			};

			if (project) {
				await toast.promise(axios.patch("/api/projects/" + project, newData), {
					loading: "Updating project...",
					success: "Project updated successfully",
					error: "Failed to update project",
				});
			} else {
				await toast.promise(axios.post("/api/projects", newData), {
					loading: "Creating new project...",
					success: "Project created successfully",
					error: "Failed to create project",
				});
			}

			setSubmitting(false);
			router.push("/projects");
			router.refresh();
			setIsModalOpen(false);
		} catch (error) {
			console.error("Error occurred during submission:", error);
			setSubmitting(false);
			toast.error("An unexpected error occurred", {
				description: error instanceof Error ? error.message : "Unknown error",
			});
		}
	};

	return (
		<div className="flex justify-end p-4">
			<Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
				<DialogTrigger asChild>
					<Button>Add Project</Button>
				</DialogTrigger>

				<DialogContent className="sm:max-w-[425px]">
					<DialogTitle className="text-xl font-semibold">Add New Project</DialogTitle>

					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<div className="space-y-2">
										<FormLabel>Project Name</FormLabel>
										<FormControl>
											<Input placeholder="Enter project name" {...field} />
										</FormControl>
									</div>
								)}
							/>

							<FormField
								control={form.control}
								name="description"
								render={({ field }) => (
									<div className="space-y-2">
										<FormLabel>Project Description</FormLabel>
										<FormControl>
											<textarea
												{...field}
												className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
												placeholder="Enter project description"
											/>
										</FormControl>
									</div>
								)}
							/>

							<FormField
								control={form.control}
								name="customerId"
								render={({ field }) => (
									<div className="space-y-2">
										<FormLabel>Customer</FormLabel>
										<Select value={field.value?.toString()} onValueChange={(value) => field.onChange(parseInt(value, 10))}>
											<SelectTrigger className="w-full">
												{field.value ? customers.find((c) => c.id === field.value)?.name : "Select a customer"}
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
								)}
							/>

							<FormField
								control={form.control}
								name="rate"
								render={({ field }) => (
									<div className="space-y-2">
										<FormLabel>Project Rate (USD)</FormLabel>
										<FormControl>
											<Input type="number" placeholder="Enter hourly rate" {...field} />
										</FormControl>
									</div>
								)}
							/>

							<div className="flex justify-end space-x-4 pt-4">
								<DialogClose asChild>
									<Button type="button" variant="outline">
										Cancel
									</Button>
								</DialogClose>
								<Button type="submit" disabled={submitting}>
									{submitting && <Spinner className="mr-2 h-4 w-4" />}
									Create Project
								</Button>
							</div>
						</form>
					</Form>
				</DialogContent>
			</Dialog>
		</div>
	);
};

export default AddDocument;
