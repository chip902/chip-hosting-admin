"use client";
import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { timeLogSchema } from "../validationSchemas";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import axios from "axios";
import { Customer, Project, Task, User } from "@prisma/client";
import useCreateTimeEntry from "../hooks/useCreateTimeEntry";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { Dialog, DialogClose, DialogContent, DialogOverlay } from "@/components/ui/dialog";

export type TimeLogSchema = z.infer<typeof timeLogSchema>;

interface LogTimeProps {
	onClose: () => void;
	initialValues?: {
		date?: Date;
		startTime?: string;
		endTime?: string;
		duration?: number;
	};
}

const LogTime = ({ onClose, initialValues }: LogTimeProps) => {
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState("");
	const [customers, setCustomers] = useState<Customer[]>([]);
	const [projects, setProjects] = useState<Project[]>([]);
	const [tasks, setTasks] = useState<Task[]>([]);
	const [users, setUsers] = useState<User[]>([]);
	const router = useRouter();
	const { mutate: createTimeEntry } = useCreateTimeEntry();

	const form = useForm<TimeLogSchema>({
		resolver: zodResolver(timeLogSchema),
		defaultValues: {
			date: initialValues?.date?.toISOString().split("T")[0] || new Date().toISOString().split("T")[0],
			startTime: initialValues?.startTime || "09:00",
			endTime: initialValues?.endTime || "17:00",
			duration: initialValues?.duration,
		},
	});

	// Reset form when dialog is opened with new initial values
	useEffect(() => {
		if (initialValues) {
			form.reset({
				date: initialValues.date?.toISOString().split("T")[0] || new Date().toISOString().split("T")[0],
				startTime: initialValues.startTime || "09:00",
				endTime: initialValues.endTime || "17:00",
				duration: initialValues.duration,
			});
		}
	}, [initialValues, form.reset]);

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

	const startTime = form.watch("startTime");
	const endTime = form.watch("endTime");

	useEffect(() => {
		if (startTime && endTime) {
			const start = new Date(`1970-01-01T${startTime}:00`);
			const end = new Date(`1970-01-01T${endTime}:00`);
			const diff = (end.getTime() - start.getTime()) / 60000;
			if (diff > 0) {
				form.setValue("duration", diff, { shouldValidate: true });
			}
		} else {
			form.setValue("duration", undefined as unknown as number, { shouldValidate: true });
		}
	}, [startTime, endTime, form.setValue, form.watch]);

	useEffect(() => {
		const durationValue = form.watch("duration");
		if (startTime && durationValue !== undefined) {
			const start = new Date(`1970-01-01T${startTime}:00`);
			const end = new Date(start.getTime() + durationValue * 60000);
			const hours = end.getHours().toString().padStart(2, "0");
			const minutes = end.getMinutes().toString().padStart(2, "0");
			form.setValue("endTime", `${hours}:${minutes}`, { shouldValidate: true });
		}
	}, [startTime, form.setValue, form.watch]);

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
			onClose();
		} catch (error) {
			setSubmitting(false);
			console.error("Failed to submit time log:", error);
			setError("An unexpected error occurred");
		} finally {
			setSubmitting(false);
			form.reset();
			router.refresh();
		}
	};

	return (
		<Dialog open onOpenChange={onClose}>
			<DialogOverlay />
			<DialogContent className="sm:max-w-[600px]">
				<div className="flex gap-3">
					<Form {...form}>
						<form className="flex flex-col space-y-4 w-full" onSubmit={form.handleSubmit(onSubmit)}>
							<div className="grid grid-cols-2 gap-4">
								<FormField
									control={form.control}
									name="customerId"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Customer</FormLabel>
											<Select onValueChange={(val) => field.onChange(parseInt(val, 10))} value={field.value?.toString()}>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder="Select a Customer" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{customers.map((customer) => (
														<SelectItem key={customer.id} value={customer.id.toString()}>
															{customer.name}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="projectId"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Project</FormLabel>
											<Select onValueChange={(val) => field.onChange(parseInt(val, 10))} value={field.value?.toString()}>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder="Select a Project" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{projects.map((project) => (
														<SelectItem key={project.id} value={project.id.toString()}>
															{project.name}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="taskId"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Task</FormLabel>
											<Select onValueChange={(val) => field.onChange(parseInt(val, 10))} value={field.value?.toString()}>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder="Select a Task" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{tasks.map((task) => (
														<SelectItem key={task.id} value={task.id.toString()}>
															{task.name}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="userId"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Employee</FormLabel>
											<Select onValueChange={(val) => field.onChange(parseInt(val, 10))} value={field.value?.toString()}>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder="Select an Employee" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{users.map((user) => (
														<SelectItem key={user.id} value={user.id.toString()}>
															{user.firstName} {user.lastName}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="duration"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Duration</FormLabel>
											<FormControl>
												<Input type="number" placeholder="Time spent in minutes" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="date"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Date</FormLabel>
											<FormControl>
												<Input type="date" {...field} value={field.value as string} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="startTime"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Start Time</FormLabel>
											<FormControl>
												<Input type="time" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="endTime"
									render={({ field }) => (
										<FormItem>
											<FormLabel>End Time</FormLabel>
											<FormControl>
												<Input type="time" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							<FormField
								control={form.control}
								name="description"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Description</FormLabel>
										<FormControl>
											<Textarea placeholder="Description of work done..." {...field} value={field.value as string} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="repeatInterval"
								render={({ field: { value, onChange, ...field } }) => (
									<FormItem>
										<FormLabel>Repeat for (days)</FormLabel>
										<FormControl>
											<Input
												type="number"
												placeholder="Number of days"
												value={value?.toString() || ""}
												onChange={(e) => onChange(e.target.value === "" ? undefined : parseInt(e.target.value, 10))}
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<div className="flex justify-end gap-3 mt-4">
								<DialogClose asChild>
									<Button type="button" variant="destructive">
										Cancel
									</Button>
								</DialogClose>
								<DialogClose asChild>
									<Button type="submit" disabled={submitting}>
										{submitting ? (
											<>
												<Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading
											</>
										) : (
											"Log"
										)}
									</Button>
								</DialogClose>
							</div>
						</form>
					</Form>
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default LogTime;
