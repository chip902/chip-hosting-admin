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
import useCreateTimeEntry from "../hooks/useCreateTimeEntry";

export type TimeLogSchema = z.infer<typeof timeLogSchema>;

const LogTime = () => {
	const [open, setOpen] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState("");
	const [customers, setCustomers] = useState<Customer[]>([]);
	const [projects, setProjects] = useState<Project[]>([]);
	const [tasks, setTasks] = useState<Task[]>([]);
	const [users, setUsers] = useState<User[]>([]);
	const router = useRouter();
	const createTimeEntry = useCreateTimeEntry();

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
			const diff = (end.getTime() - start.getTime()) / 60000;
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

			const parsedRepeatInterval = repeatInterval ? parseInt(repeatInterval as unknown as string, 10) : undefined;

			const logDataWithDate = {
				...logData,
				date: new Date(logData.date),
			};

			if (parsedRepeatInterval) {
				let currentDate = new Date(logDataWithDate.date);
				for (let i = 0; i < parsedRepeatInterval; i++) {
					logEntries.push({ ...logDataWithDate, date: new Date(currentDate) });
					currentDate.setDate(currentDate.getDate() + 1);
				}
			} else {
				logEntries.push({ ...logDataWithDate, date: new Date(logDataWithDate.date) });
			}

			await Promise.all(logEntries.map((entry) => axios.post("/api/timelog", entry)));

			setOpen(false);
			router.push("/timesheet");
			router.refresh();
		} catch (error) {
			console.error("Failed to submit time log:", error);
			setError("An unexpected error occurred");
		} finally {
			setSubmitting(false);
		}
	};

	const handleSelectChange = <T extends keyof TimeLogSchema>(name: T, value: TimeLogSchema[T]) => {
		// @ts-ignore
		setValue(name, value, { shouldValidate: true });
	};

	return (
		<Flex gap="3">
			<Dialog.Root open={open} onOpenChange={setOpen}>
				<Dialog.Trigger>
					<Button variant="solid">Log Time</Button>
				</Dialog.Trigger>
				<Dialog.Content className="gap-3">
					<Dialog.Title>Log Time</Dialog.Title>
					<Form.Root className="logTime" onSubmit={handleSubmit(onSubmit)}>
						<Grid columns={{ initial: "1", md: "2" }} gap="3" width="auto">
							<Form.Field name="customerId">
								<Form.Label>Customer</Form.Label>
								<Form.Control asChild>
									<Select.Root onValueChange={(value) => handleSelectChange("customerId", parseInt(value))}>
										<Select.Trigger placeholder="Select a Customer" />
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
							<Form.Field name="projectId">
								<Form.Label>Project</Form.Label>
								<Form.Control asChild>
									<Select.Root onValueChange={(value) => handleSelectChange("projectId", parseInt(value, 10))}>
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
								{errors.projectId && <ErrorMessage>{errors.projectId.message}</ErrorMessage>}
							</Form.Field>
							<Form.Field name="taskId">
								<Form.Label>Task</Form.Label>
								<Form.Control asChild>
									<Select.Root onValueChange={(value) => handleSelectChange("taskId", parseInt(value, 10))}>
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
								<Form.Label>Employee</Form.Label>
								<Form.Control asChild>
									<Select.Root onValueChange={(value) => handleSelectChange("userId", parseInt(value, 10))}>
										<Select.Trigger placeholder="Select an Employee" />
										<Select.Content>
											{users.map((user) => (
												<Select.Item key={user.id} value={String(user.id)}>
													{user.name}
												</Select.Item>
											))}
										</Select.Content>
									</Select.Root>
								</Form.Control>
								{errors.userId && <ErrorMessage>{errors.userId.message}</ErrorMessage>}
							</Form.Field>
							<Form.Field name="duration">
								<Form.Label>Duration</Form.Label>
								<Form.Control asChild>
									<TextField.Root placeholder="Time spent in minutes" {...register("duration", { valueAsNumber: true })} />
								</Form.Control>
								{errors.duration && <ErrorMessage>{errors.duration.message}</ErrorMessage>}
							</Form.Field>
							<Form.Field name="date">
								<Form.Label>Date</Form.Label>
								<Form.Control asChild>
									<input className="dark:text-white dark:bg-slate-500 rounded px-2" type="date" {...register("date")} />
								</Form.Control>
								{errors.date && <ErrorMessage>{errors.date.message}</ErrorMessage>}
							</Form.Field>
							<Form.Field name="startTime">
								<Form.Label>Start Time</Form.Label>
								<Form.Control asChild>
									<input className="dark:text-white dark:bg-slate-500 rounded px-2" type="time" {...register("startTime")} />
								</Form.Control>
								{errors.startTime && <ErrorMessage>{errors.startTime.message}</ErrorMessage>}
							</Form.Field>
							<Form.Field name="endTime">
								<Form.Label>End Time</Form.Label>
								<Form.Control asChild>
									<input className="dark:text-white dark:bg-slate-500 rounded px-2" type="time" {...register("endTime")} />
								</Form.Control>
								{errors.endTime && <ErrorMessage>{errors.endTime.message}</ErrorMessage>}
							</Form.Field>
						</Grid>
						<Form.Field name="description">
							<Form.Label>Description</Form.Label>
							<Form.Control asChild>
								<TextArea
									className="dark:text-white dark:bg-slate-500 rounded px-2"
									placeholder="Description of work done..."
									{...register("description")}
								/>
							</Form.Control>
							{errors.description && <ErrorMessage>{errors.description.message}</ErrorMessage>}
						</Form.Field>
						<Form.Field name="repeatInterval">
							<Form.Label>Repeat for (days)</Form.Label>
							<Form.Control asChild>
								<TextField.Root
									className="dark:text-white dark:bg-slate-500 rounded px-2"
									placeholder="Number of days"
									{...register("repeatInterval", {
										setValueAs: (v) => (v === "" ? undefined : parseInt(v, 10)),
									})}
								/>
							</Form.Control>
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
				</Dialog.Content>
			</Dialog.Root>
		</Flex>
	);
};

export default LogTime;
