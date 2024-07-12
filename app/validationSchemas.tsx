import { z } from "zod";

export const customerSchema = z.object({
	name: z.string().min(1, "Please enter a complete name.").max(255),
	email: z.string().email(),
	rate: z.number().min(1, "Enter a rate bigger than $1 an hour"),
});

export const timeLogSchema = z.object({
	customerId: z.number().nonnegative("Customer ID must be a non-negative number"),
	projectId: z.number().nonnegative("Project ID must be a non-negative number"),
	taskId: z.number().nonnegative("Task ID must be a non-negative number"),
	userId: z.number().nonnegative("User ID must be a non-negative number"),
	duration: z.number().nonnegative("Duration must be a non-negative number"),
	date: z.union([
		z.date(),
		z.string().refine((val) => !isNaN(Date.parse(val)), {
			message: "Expected date, received string",
		}),
	]),
	description: z.string().nullable().optional(),
	startTime: z.string().optional(),
	endTime: z.string().optional(),
	repeatInterval: z.number().nullable().optional(),
});
