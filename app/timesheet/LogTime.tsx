"use client";
import * as Form from "@radix-ui/react-form";
import { Button, Dialog, Flex, Spinner, TextField } from "@radix-ui/themes";
import { zodResolver } from "@hookform/resolvers/zod";
import { timeLogSchema } from "../validationSchemas";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import ErrorMessage from "@/components/ErrorMessage";
import { TimeEntry } from "@prisma/client";

type TimeLogSchema = z.infer<typeof timeLogSchema>;

const LogTime = () => {
	const [open, setOpen] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState("");
	const router = useRouter();
	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<TimeEntry>({
		resolver: zodResolver(timeLogSchema),
	});

	const onSubmit = async (data: TimeLogSchema) => {
		try {
			setSubmitting(true);
			await axios.post("/api/timelog", data);
			setOpen(false);
			router.push("/timesheet");
			router.refresh();
		} catch (error) {
			setSubmitting(false);
			setError("An unexpected error occurred");
		}
	};

	return (
		<Flex direction="column" gap="2">
			<Dialog.Root open={open} onOpenChange={setOpen}>
				<Dialog.Trigger>
					<Button variant="solid">Log Time</Button>
				</Dialog.Trigger>
				<Dialog.Content>
					<Dialog.Title>Log Time</Dialog.Title>
					<Form.Root onSubmit={handleSubmit(onSubmit)}>
						<Form.Field name="taskId">
							<Form.Label>Task ID</Form.Label>
							<Form.Control asChild>
								<TextField.Root placeholder="Task ID" {...register("taskId")} />
							</Form.Control>
							{errors.taskId && <ErrorMessage>{errors.taskId.message}</ErrorMessage>}
						</Form.Field>
						<Form.Field name="userId">
							<Form.Label>User ID</Form.Label>
							<Form.Control asChild>
								<TextField.Root placeholder="User ID" {...register("userId")} />
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
						<Form.Field name="description">
							<Form.Label>Work Log</Form.Label>
							<Form.Control asChild>
								<TextField.Root placeholder="Description of work done..." {...register("description")} />
							</Form.Control>
							{errors.userId && <ErrorMessage>{errors.userId.message}</ErrorMessage>}
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
