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
import { Checkbox } from "@/components/ui/checkbox";

type ProjectSchema = z.infer<typeof projectSchema>;

interface Task {
	id: number;
	name: string;
	description: string | null;
}

interface User {
	id: number;
	firstName: string | null;
	lastName: string | null;
	email: string;
}

const AddDocument = ({ project }: { project?: typeof Project }) => {
	const [customers, setCustomers] = useState<Customer[]>([]);
	const [tasks, setTasks] = useState<Task[]>([]);
	const [users, setUsers] = useState<User[]>([]);
	const [selectedTasks, setSelectedTasks] = useState<number[]>([]);
	const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
	const [isModalOpen, setIsModalOpen] = useState(false);

	useEffect(() => {
		const fetchData = async () => {
			try {
				const [dataResponse, tasksResponse] = await Promise.all([
					axios.get("/api/data"),
					axios.get("/api/tasks")
				]);
				setCustomers(dataResponse.data.customers);
				setTasks(tasksResponse.data);
				setUsers(dataResponse.data.users);
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

			let projectResponse;
			if (project) {
				projectResponse = await toast.promise(axios.patch("/api/projects/" + project, newData), {
					loading: "Updating project...",
					success: "Project updated successfully",
					error: "Failed to update project",
				});
			} else {
				projectResponse = await toast.promise(axios.post("/api/projects", newData), {
					loading: "Creating new project...",
					success: "Project created successfully",
					error: "Failed to create project",
				});
			}

			// Assign selected tasks and users to the project
			if (projectResponse.data) {
				const promises = [];
				
				if (selectedTasks.length > 0) {
					promises.push(
						axios.post(`/api/projects/${projectResponse.data.id}/tasks`, {
							taskIds: selectedTasks,
						})
					);
				}
				
				if (selectedUsers.length > 0) {
					promises.push(
						axios.post(`/api/projects/${projectResponse.data.id}/users`, {
							userIds: selectedUsers,
						})
					);
				}
				
				if (promises.length > 0) {
					await Promise.all(promises);
				}
			}

			setSubmitting(false);
			router.push("/projects");
			router.refresh();
			setIsModalOpen(false);
			setSelectedTasks([]); // Reset selected tasks
			setSelectedUsers([]); // Reset selected users
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

							{/* Task Assignment Section */}
							<div className="space-y-2">
								<FormLabel>Assign Tasks</FormLabel>
								{tasks.length === 0 ? (
									<p className="text-sm text-muted-foreground">No tasks available. Create tasks first.</p>
								) : (
									<div className="h-32 border rounded-md p-2 overflow-y-auto">
										<div className="space-y-2">
											{tasks.map((task) => (
												<div key={task.id} className="flex items-center space-x-2">
													<Checkbox
														id={`task-${task.id}`}
														checked={selectedTasks.includes(task.id)}
														onCheckedChange={(checked) => {
															if (checked) {
																setSelectedTasks(prev => [...prev, task.id]);
															} else {
																setSelectedTasks(prev => prev.filter(id => id !== task.id));
															}
														}}
													/>
													<label htmlFor={`task-${task.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
														{task.name}
													</label>
													{task.description && (
														<span className="text-xs text-muted-foreground">- {task.description}</span>
													)}
												</div>
											))}
										</div>
									</div>
								)}
								{selectedTasks.length > 0 && (
									<p className="text-sm text-muted-foreground">
										{selectedTasks.length} task(s) selected
									</p>
								)}
							</div>

							{/* User Assignment Section */}
							<div className="space-y-2">
								<FormLabel>Assign Team Members</FormLabel>
								{users.length === 0 ? (
									<p className="text-sm text-muted-foreground">No users available.</p>
								) : (
									<div className="h-32 border rounded-md p-2 overflow-y-auto">
										<div className="space-y-2">
											{users.map((user) => (
												<div key={user.id} className="flex items-center space-x-2">
													<Checkbox
														id={`user-${user.id}`}
														checked={selectedUsers.includes(user.id)}
														onCheckedChange={(checked) => {
															if (checked) {
																setSelectedUsers(prev => [...prev, user.id]);
															} else {
																setSelectedUsers(prev => prev.filter(id => id !== user.id));
															}
														}}
													/>
													<label htmlFor={`user-${user.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
														{user.firstName} {user.lastName}
													</label>
													<span className="text-xs text-muted-foreground">({user.email})</span>
												</div>
											))}
										</div>
									</div>
								)}
								{selectedUsers.length > 0 && (
									<p className="text-sm text-muted-foreground">
										{selectedUsers.length} team member(s) selected
									</p>
								)}
							</div>

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
