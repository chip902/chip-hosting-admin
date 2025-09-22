"use client";
import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { timeLogSchema } from "@/app/validationSchemas";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import axios from "axios";
import { Customer, Project, Task, User } from "@/prisma/app/generated/prisma/client";
import useCreateTimeEntry from "@/app/hooks/useCreateTimeEntry";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, CalendarCheck2 } from "lucide-react";
import { toast } from "sonner";
import { generateW2WeekEntries, isUSFederalHoliday } from "@/lib/holidays";
import { Switch } from "@/components/ui/switch";

export type TimeLogSchema = z.infer<typeof timeLogSchema>;

interface LogTimeProps {
	onClose: () => void;
	initialValues?: {
		// Core fields from timeLogSchema
		customerId?: number;
		projectId?: number;
		taskId?: number;
		userId?: number;
		duration?: number;
		date?: Date;
		description?: string;
		startTime?: string;
		endTime?: string;
		repeatInterval?: number;
	};
}

const LogTime = ({ onClose, initialValues }: LogTimeProps) => {
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState("");
	const [customers, setCustomers] = useState<Customer[]>([]);
	const [allProjects, setAllProjects] = useState<Project[]>([]);
	const [projects, setProjects] = useState<Project[]>([]);
	const [tasks, setTasks] = useState<Task[]>([]);
	const [users, setUsers] = useState<User[]>([]);
	const [isW2Customer, setIsW2Customer] = useState(false);
	const [useQuickW2Entry, setUseQuickW2Entry] = useState(false);
	const [w2StandardHours, setW2StandardHours] = useState(true);
	const router = useRouter();
	const { mutateAsync: createTimeEntry } = useCreateTimeEntry();

	const form = useForm<TimeLogSchema>({
		resolver: zodResolver(timeLogSchema),
		defaultValues: {
			customerId: initialValues?.customerId || undefined,
			projectId: initialValues?.projectId || undefined,
			taskId: initialValues?.taskId || undefined,
			userId: initialValues?.userId || undefined,
			date: initialValues?.date?.toISOString().split("T")[0] || new Date().toISOString().split("T")[0],
			startTime: initialValues?.startTime || "09:00",
			endTime: initialValues?.endTime || "17:00",
			duration: initialValues?.duration || 0,
			description: initialValues?.description || "",
			repeatInterval: initialValues?.repeatInterval || 0,
		},
	});

	// Reset form when dialog is opened with new initial values
	useEffect(() => {
		form.reset({
			customerId: initialValues?.customerId || undefined,
			projectId: initialValues?.projectId || undefined,
			taskId: initialValues?.taskId || undefined,
			userId: initialValues?.userId || undefined,
			date: initialValues?.date?.toISOString().split("T")[0] || new Date().toISOString().split("T")[0],
			startTime: initialValues?.startTime || "09:00",
			endTime: initialValues?.endTime || "17:00",
			duration: initialValues?.duration || 0,
			description: initialValues?.description || "",
			repeatInterval: initialValues?.repeatInterval || 0,
		});
	}, [initialValues, form]);

	useEffect(() => {
		const fetchData = async () => {
			try {
				const response = await axios.get("/api/data");
				setCustomers(response.data.customers);
				setAllProjects(response.data.projects);
				setProjects([]); // Start with no projects until a customer is selected
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
	const selectedCustomerId = form.watch("customerId");

	// Update projects when selected customer changes
	useEffect(() => {
		if (selectedCustomerId) {
			const filteredProjects = allProjects.filter((project) => project.customerId === selectedCustomerId);
			setProjects(filteredProjects);
			// Clear project selection if it's not in the filtered list
			const currentProjectId = form.getValues("projectId");
			if (currentProjectId && !filteredProjects.some((p) => p.id === currentProjectId)) {
				form.setValue("projectId", undefined as any);
			}

			// Check if selected customer is W-2
			const customer = customers.find(c => c.id === selectedCustomerId);
			if (customer && (customer as any).employmentType === 'W2') {
				setIsW2Customer(true);
				// Auto-enable quick entry for W2 customers
				setUseQuickW2Entry(true);
				if (w2StandardHours) {
					form.setValue("startTime", "09:00");
					form.setValue("endTime", "17:00");
					form.setValue("duration", 480); // 8 hours in minutes
				}
			} else {
				setIsW2Customer(false);
				setUseQuickW2Entry(false);
			}
		} else {
			setProjects([]);
			form.setValue("projectId", undefined as any);
			setIsW2Customer(false);
			setUseQuickW2Entry(false);
		}
	}, [selectedCustomerId, allProjects, form, customers, w2StandardHours]);

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

			// Use a single toast.promise for better UX
			await toast.promise(
				Promise.all(logEntries.map((entry) => createTimeEntry(entry))),
				{
					loading: parsedRepeatInterval && parsedRepeatInterval > 1 
						? `Creating ${parsedRepeatInterval} time entries...` 
						: "Logging time entry...",
					success: (results) => {
						if (isW2Customer && useQuickW2Entry) {
							return `Successfully created ${results.length} W-2 time entries`;
						}
						return parsedRepeatInterval && parsedRepeatInterval > 1
							? `Successfully created ${results.length} time entries`
							: "Time entry logged successfully";
					},
					error: "Failed to create time entries",
				}
			);

			onClose();
			form.reset();
			router.refresh();
		} catch (error) {
			setSubmitting(false);
			console.error("Failed to submit time log:", error);

			// Show error toast
			toast.error("Failed to log time", {
				description: error instanceof Error ? error.message : "An unexpected error occurred while logging time",
			});

			setError("An unexpected error occurred");
		} finally {
			setSubmitting(false);
		}
	};

	// Add toast for form validation errors
	const onError = (errors: any) => {
		toast.error("Please fix the following errors:", {
			description: Object.values(errors)
				.map((error: any) => error.message)
				.join(", "),
		});
	};

	return (
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
									<Select
										onValueChange={(val) => field.onChange(parseInt(val, 10))}
										value={field.value?.toString()}
										disabled={!customers.length}>
										<FormControl>
											<SelectTrigger className="w-full">
												<SelectValue placeholder="Select a Customer" />
											</SelectTrigger>
										</FormControl>
										<SelectContent
											className="pointer-events-auto"
											position="popper"
											sideOffset={5}
											style={{ pointerEvents: "auto" }}>
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
									<Select
										onValueChange={(val) => field.onChange(parseInt(val, 10))}
										value={field.value?.toString()}
										disabled={!selectedCustomerId || !projects.length}>
										<FormControl>
											<SelectTrigger className="w-full">
												<SelectValue placeholder="Select a Project" />
											</SelectTrigger>
										</FormControl>
										<SelectContent
											className="pointer-events-auto"
											position="popper"
											sideOffset={5}
											style={{ pointerEvents: "auto" }}>
											{projects.map((project) => (
												<SelectItem key={project.id} value={project.id.toString()}>
													{project.name}
												</SelectItem>
											))}
											{projects.length === 0 && selectedCustomerId && (
												<div className="px-3 py-2 text-sm text-muted-foreground">No projects found for this customer</div>
											)}
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
									<Select onValueChange={(val) => field.onChange(parseInt(val, 10))} value={field.value?.toString()} disabled={!tasks.length}>
										<FormControl>
											<SelectTrigger className="w-full">
												<SelectValue placeholder="Select a Task" />
											</SelectTrigger>
										</FormControl>
										<SelectContent
											className="pointer-events-auto"
											position="popper"
											sideOffset={5}
											style={{ pointerEvents: "auto" }}>
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
									<Select onValueChange={(val) => field.onChange(parseInt(val, 10))} value={field.value?.toString()} disabled={!users.length}>
										<FormControl>
											<SelectTrigger className="w-full">
												<SelectValue placeholder="Select an Employee" />
											</SelectTrigger>
										</FormControl>
										<SelectContent
											className="pointer-events-auto"
											position="popper"
											sideOffset={5}
											style={{ pointerEvents: "auto" }}>
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
										disabled={isW2Customer && useQuickW2Entry}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					{isW2Customer && (
						<div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									<CalendarCheck2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
									<span className="font-medium text-blue-900 dark:text-blue-100">W-2 Quick Entry</span>
								</div>
								<Switch
									checked={useQuickW2Entry}
									onCheckedChange={(checked) => {
										setUseQuickW2Entry(checked);
										if (checked && w2StandardHours) {
											form.setValue("startTime", "09:00");
											form.setValue("endTime", "17:00");
											form.setValue("duration", 480);
										}
									}}
								/>
							</div>

							{useQuickW2Entry && (
								<div className="space-y-3">
									<div className="text-sm text-blue-700 dark:text-blue-300">
										This will create entries for Monday-Friday of the selected week, automatically skipping federal holidays.
									</div>

									<div className="flex items-center justify-between">
										<span className="text-sm">Use standard hours (9 AM - 5 PM)</span>
										<Switch
											checked={w2StandardHours}
											onCheckedChange={(checked) => {
												setW2StandardHours(checked);
												if (checked) {
													form.setValue("startTime", "09:00");
													form.setValue("endTime", "17:00");
													form.setValue("duration", 480);
												}
											}}
										/>
									</div>
								</div>
							)}
						</div>
					)}

					<div className="flex justify-end gap-3 mt-4">
						<Button type="button" variant="destructive" onClick={onClose}>
							Cancel
						</Button>
						{/* Remove DialogClose from submit button */}
						<Button type="submit" disabled={submitting}>
							{submitting ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading
								</>
							) : (
								"Log"
							)}
						</Button>
					</div>
				</form>
			</Form>
		</div>
	);
};

export default LogTime;
