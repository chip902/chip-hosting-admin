"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import { Dialog, DialogClose, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormLabel, FormItem, FormMessage } from "@/components/ui/form";
import { Spinner } from "@/components/ui/spinner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const taskSchema = z.object({
	name: z.string().min(1, "Task name is required"),
	description: z.string().optional(),
	rate: z.number().positive().optional(),
});

type TaskSchema = z.infer<typeof taskSchema>;

interface AddTaskProps {
	onTaskCreated?: () => void;
}

const AddTask = ({ onTaskCreated }: AddTaskProps) => {
	const [isModalOpen, setIsModalOpen] = useState(false);
	const router = useRouter();

	const form = useForm<TaskSchema>({
		resolver: zodResolver(taskSchema),
		defaultValues: {
			name: "",
			description: "",
			rate: undefined,
		},
	});

	const [submitting, setSubmitting] = useState(false);

	const onSubmit = async (data: TaskSchema) => {
		try {
			setSubmitting(true);
			const payload = {
				...data,
				rate: data.rate ? parseFloat(data.rate.toString()) : undefined,
			};

			await toast.promise(axios.post("/api/tasks", payload), {
				loading: "Creating new task...",
				success: "Task created successfully",
				error: "Failed to create task",
			});

			setSubmitting(false);
			form.reset();
			setIsModalOpen(false);
			router.refresh();
			
			if (onTaskCreated) {
				onTaskCreated();
			}
		} catch (error) {
			console.error("Error occurred during submission:", error);
			setSubmitting(false);
			toast.error("An unexpected error occurred", {
				description: error instanceof Error ? error.message : "Unknown error",
			});
		}
	};

	return (
		<Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
			<DialogTrigger asChild>
				<Button>Add Task</Button>
			</DialogTrigger>

			<DialogContent className="sm:max-w-[425px]">
				<DialogTitle className="text-xl font-semibold">Add New Task</DialogTitle>

				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Task Name</FormLabel>
									<FormControl>
										<Input placeholder="Enter task name" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="description"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Task Description</FormLabel>
									<FormControl>
										<Textarea
											{...field}
											placeholder="Enter task description"
											className="min-h-[80px]"
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="rate"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Task Rate ($) - Optional</FormLabel>
									<FormControl>
										<Input
											type="number"
											placeholder="Enter hourly rate"
											step="0.01"
											{...field}
											value={field.value || ""}
											onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
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
								Create Task
							</Button>
						</div>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
};

export default AddTask;
