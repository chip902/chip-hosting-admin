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
	const { mutate: createTimeEntry } = useCreateTimeEntry();

	const {
		register,
		handleSubmit,
		watch,
		setValue,
		reset,
		formState: { errors },
	} = useForm<TimeLogSchema>({
		resolver: zodResolver(timeLogSchema),
		defaultValues: {
			date: new Date().toISOString().split("T")[0],
			startTime: "09:00",
			endTime: "17:00",
		},
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
	}, [error]);

	const startTime = watch("startTime");
	const endTime = watch("endTime");

	useEffect(() => {
		if (startTime && endTime) {
			const start = new Date(`1970-01-01T${startTime}:00`);
			const end = new Date(`1970-01-01T${endTime}:00`);
			const diff = (end.getTime() - start.getTime()) / 60000;
			if (diff > 0) {
				setValue("duration", diff, { shouldValidate: true });
			}
		} else {
			setValue("duration", undefined as unknown as number, { shouldValidate: true });
		}
	}, [startTime, endTime, setValue, watch]);

	useEffect(() => {
		const durationValue = watch("duration");
		if (startTime && durationValue !== undefined) {
			const start = new Date(`1970-01-01T${startTime}:00`);
			const end = new Date(start.getTime() + durationValue * 60000);
			const hours = end.getHours().toString().padStart(2, "0");
			const minutes = end.getMinutes().toString().padStart(2, "0");
			setValue("endTime", `${hours}:${minutes}`, { shouldValidate: true });
		}
	}, [startTime, endTime, setValue, watch]);

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
					const newEntry = {
						...logDataWithDate,
						date: new Date(currentDate),
						startTime: logDataWithDate.startTime,
						endTime: logDataWithDate.endTime,
					};
					logEntries.push(newEntry);
					currentDate.setDate(currentDate.getDate() + 1);
				}
			} else {
				logEntries.push({
					...logDataWithDate,
					date: new Date(logDataWithDate.date),
					startTime: logDataWithDate.startTime,
					endTime: logDataWithDate.endTime,
				});
			}

			await Promise.all(logEntries.map((entry) => createTimeEntry(entry)));
			setOpen(false);
			reset();
			router.refresh();
		} catch (error) {
			setSubmitting(false);
			console.error("Failed to submit time log:", error);
			setError("An unexpected error occurred");
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<Flex gap="3">
			<Dialog.Root open={open} onOpenChange={setOpen}>
				<Dialog.Trigger>
					<Button variant="solid">Log Time</Button>
				</Dialog.Trigger>
				<Dialog.Content className="w-full max-w-xl p-6 gap-3">
					<Dialog.Title className="text-lg font-semibold">Log Time</Dialog.Title>
					<Form.Root className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
						<Grid columns={{ initial: "1", md: "2" }} gap="4">
							<Form.Field name="customerId">
								<Form.Label>Customer</Form.Label>
								<Form.Control asChild>
									<Select.Root onValueChange={(value) => setValue("customerId", parseInt(value, 10), { shouldValidate: true })}>
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
							<Form.Field name="projectId">
								<Form.Label>Project</Form.Label>
								<Form.Control asChild>
									<Select.Root onValueChange={(value) => setValue("projectId", parseInt(value, 10), { shouldValidate: true })}>
										<Select.Trigger className="w-full" placeholder="Select a Project" />
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
									<Select.Root onValueChange={(value) => setValue("taskId", parseInt(value, 10), { shouldValidate: true })}>
										<Select.Trigger className="w-full" placeholder="Select a Task" />
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
									<Select.Root onValueChange={(value) => setValue("userId", parseInt(value, 10), { shouldValidate: true })}>
										<Select.Trigger className="w-full" placeholder="Select an Employee" />
										<Select.Content>
											{users.map((user) => (
												<Select.Item key={user.id} value={String(user.id)}>
													{user.firstName} {user.lastName}
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
									<TextField.Root className="w-full" placeholder="Time spent in minutes" {...register("duration", { valueAsNumber: true })} />
								</Form.Control>
								{errors.duration && <ErrorMessage>{errors.duration.message}</ErrorMessage>}
							</Form.Field>
							<Form.Field name="date">
								<Form.Label>Date</Form.Label>
								<Form.Control asChild>
									<input className="time-input" type="date" {...register("date")} />
								</Form.Control>
								{errors.date && <ErrorMessage>{errors.date.message}</ErrorMessage>}
							</Form.Field>
							<Form.Field name="startTime">
								<Form.Label>Start Time</Form.Label>
								<Form.Control asChild>
									<input className="time-input" type="time" {...register("startTime")} />
								</Form.Control>
								{errors.startTime && <ErrorMessage>{errors.startTime.message}</ErrorMessage>}
							</Form.Field>
							<Form.Field name="endTime">
								<Form.Label>End Time</Form.Label>
								<Form.Control asChild>
									<input className="time-input" type="time" {...register("endTime")} />
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
