"use client";
import { useEffect, useState } from "react";
import * as Form from "@radix-ui/react-form";
import { Button, Dialog, Flex, Spinner, TextField, Select, Grid, TextArea } from "@radix-ui/themes";
import { zodResolver } from "@hookform/resolvers/zod";
import { timeLogSchema } from "../validationSchemas";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import axios from "axios";
import ErrorMessage from "@/components/ErrorMessage";
import { Customer, Project, Task, User } from "@prisma/client";

type TimeLogSchema = z.infer<typeof timeLogSchema>;

const LogTime = () => {
	const [open, setOpen] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState("");
	const [customers, setCustomers] = useState<Customer[]>([]);
	const [projects, setProjects] = useState<Project[]>([]);
	const [tasks, setTasks] = useState<Task[]>([]);
	const [users, setUsers] = useState<User[]>([]);
	const router = useRouter();

	const {
		register,
		handleSubmit,
		watch,
		setValue,
		formState: { errors },
	} = useForm<TimeLogSchema>({
		resolver: zodResolver(timeLogSchema),
	});

	useEffect(() => {
		const fetchData = async () => {
			try {
				const response = await axios.get("/api/data");
				setCustomers(response.data.customers);
				setProjects(response.data.projects);
				setTasks(response.data.tasks);
				setUsers(response.data.users);
			} catch (error) {
				console.error("Error fetching data:", error);
			}
		};
		fetchData();
	}, []);

	const startTime = watch("startTime");
	const endTime = watch("endTime");
	const duration = watch("duration");

	useEffect(() => {
		if (startTime && endTime) {
			const start = new Date(`1970-01-01T${startTime}:00`);
			const end = new Date(`1970-01-01T${endTime}:00`);
			const diff = (end.getTime() - start.getTime()) / 60000; // Difference in minutes
			if (diff > 0) setValue("duration", diff);
		}
	}, [startTime, endTime, setValue]);

	useEffect(() => {
		if (startTime && duration) {
			const start = new Date(`1970-01-01T${startTime}:00`);
			const end = new Date(start.getTime() + duration * 60000);
			const hours = end.getHours().toString().padStart(2, "0");
			const minutes = end.getMinutes().toString().padStart(2, "0");
			setValue("endTime", `${hours}:${minutes}`);
		}
	}, [startTime, duration, setValue]);

	const onSubmit = async (data: TimeLogSchema) => {
		try {
			setSubmitting(true);

			const { repeatInterval, ...logData } = data;
			const logEntries = [];

			if (repeatInterval) {
				let currentDate = new Date(logData.date);
				for (let i = 0; i < repeatInterval; i++) {
					logEntries.push({ ...logData, date: new Date(currentDate) });
					currentDate.setDate(currentDate.getDate() + 1);
				}
			} else {
				logEntries.push(logData);
			}

			await Promise.all(logEntries.map((entry) => axios.post("/api/timelog", entry)));

			setOpen(false);
			router.push("/timesheet");
			router.refresh();
		} catch (error) {
			setSubmitting(false);
			setError("An unexpected error occurred");
		}
	};

	return (
		<Flex gap="3">
			<Dialog.Root open={open} onOpenChange={setOpen}>
				<Dialog.Trigger>
					<Button variant="solid">Log Time</Button>
				</Dialog.Trigger>
				<Dialog.Content className="gap-3">
					<Dialog.Title>Log Time</Dialog.Title>
					<Flex gap="3">
						<Form.Root onSubmit={handleSubmit(onSubmit)}>
							<Grid columns={{ initial: "1", md: "2" }} gap="3" width="auto">
								<Form.Field name="customer">
									<Form.Control asChild>
										<Select.Root>
											<Select.Trigger placeholder="Select a Customer" />
											<Select.Content>
												<Select.Group>
													{customers.map((customer) => (
														<Select.Item key={customer.id} value={String(customer.id)}>
															<Select.Label>{customer.name}</Select.Label>
														</Select.Item>
													))}
												</Select.Group>
											</Select.Content>
										</Select.Root>
									</Form.Control>

									{error && <ErrorMessage>error.message</ErrorMessage>}
								</Form.Field>
								<Form.Field name="projectId">
									<Form.Control asChild>
										<Select.Root>
											<Select.Trigger placeholder="Select a Project" />
											<Select.Content>
												{projects.map((project) => (
													<Select.Item key={project.id} value={project.id.toString()}>
														{project.name}
													</Select.Item>
												))}
											</Select.Content>
										</Select.Root>
									</Form.Control>

									{error && <ErrorMessage>error.message</ErrorMessage>}
								</Form.Field>
								<Form.Field name="taskId">
									<Form.Control asChild>
										<Select.Root>
											<Select.Trigger placeholder="Select a Task" />
											<Select.Content>
												{tasks.map((task) => (
													<Select.Item key={task.id} value={String(task.id)}>
														{task.name}
													</Select.Item>
												))}
											</Select.Content>
										</Select.Root>
									</Form.Control>

									{errors.taskId && <ErrorMessage>{errors.taskId.message}</ErrorMessage>}
								</Form.Field>
								<Form.Field name="userId">
									<Form.Control asChild>
										<Select.Root>
											<Select.Trigger placeholder="Select an Employee" />
											<Select.Content>
												<Select.Group>
													{users.map((user) => (
														<Select.Item key={user.id} value={String(user.id)}>
															{user.name}
														</Select.Item>
													))}
												</Select.Group>
											</Select.Content>
										</Select.Root>
									</Form.Control>

									{errors.userId && <ErrorMessage>{errors.userId.message}</ErrorMessage>}
								</Form.Field>
								<Form.Field name="duration">
									<Form.Control asChild>
										<TextField.Root placeholder="Time spent in minutes" {...register("duration", { valueAsNumber: true })} />
									</Form.Control>

									{errors.duration && <ErrorMessage>{errors.duration.message}</ErrorMessage>}
								</Form.Field>

								<Form.Field name="date">
									<Form.Control asChild>
										<input type="date" {...register("date")} />
									</Form.Control>

									{errors.date && <ErrorMessage>{errors.date.message}</ErrorMessage>}
								</Form.Field>
								<Form.Field name="startTime">
									<Form.Label>Start Time</Form.Label>
									<Form.Control asChild>
										<input type="time" {...register("startTime")} />
									</Form.Control>
									{errors.startTime && <ErrorMessage>{errors.startTime.message}</ErrorMessage>}
								</Form.Field>
								<Form.Field name="endTime">
									<Form.Label>End Time</Form.Label>
									<Form.Control asChild>
										<input type="time" {...register("endTime")} />
									</Form.Control>
									{errors.endTime && <ErrorMessage>{errors.endTime.message}</ErrorMessage>}
								</Form.Field>
							</Grid>
							<Form.Field name="description">
								<Form.Control asChild>
									<TextArea placeholder="Description of work done..." {...register("description")} />
								</Form.Control>
								{errors.description && <ErrorMessage>{errors.description.message}</ErrorMessage>}
							</Form.Field>
							<Form.Field name="repeatInterval">
								<Form.Label>Repeat for (days)</Form.Label>
								<div className="mt-2">
									<Form.Control asChild>
										<TextField.Root placeholder="Number of days" {...register("repeatInterval", { valueAsNumber: true })} />
									</Form.Control>
								</div>
								{errors.repeatInterval && <ErrorMessage>{errors.repeatInterval.message}</ErrorMessage>}
							</Form.Field>
							<Flex gap="3" mt="4">
								<Dialog.Close>
									<Button type="button" color="red" size="2">
										Cancel
									</Button>
								</Dialog.Close>
								<Button type="submit" variant="solid" color="green" size="2" disabled={submitting}>
									{submitting && <Spinner />} Log
								</Button>
							</Flex>
						</Form.Root>
					</Flex>
				</Dialog.Content>
			</Dialog.Root>
		</Flex>
	);
};

export default LogTime;
