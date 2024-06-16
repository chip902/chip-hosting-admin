import { z } from "zod";

export const customerSchema = z.object({
	name: z.string().min(1, "Please enter a complete name.").max(255),
	email: z.string().email(),
	rate: z.number().min(1, "Enter a rate bigger than $1 an hour"),
});

export const timeLogSchema = z.object({
	taskId: z.number().min(1, "Task ID must be provided"),
	userId: z.number().min(1, "User ID must be provided"),
	duration: z.number().min(1, "Duration must be at least 1 minute"),
	description: z.string().nullable(), // allow null values
});
