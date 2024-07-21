import { z } from "zod";

export const customerSchema = z.object({
	id: z.number().optional(),
	name: z.string().min(1, "Please enter a complete name.").max(255),
	email: z.string().email().max(255),
	defaultRate: z.number().positive(),
	color: z.string().max(7).nullable().optional(),
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

export const filterSchema = z.object({
	isInvoiced: z.boolean().optional(),
	customerId: z.number().optional(),
	startDate: z.string().optional(),
	endDate: z.string().optional(),
});
