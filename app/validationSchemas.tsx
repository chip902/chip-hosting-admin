import { z } from "zod";

export const customerSchema = z.object({
	id: z.number().optional(),
	name: z.string().min(1, "Please enter a complete name.").max(255),
	shortname: z.string().max(32).optional(),
	shortName: z.string().max(32).optional(),
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

export const projectSchema = z.object({
	id: z.number(),
	customerId: z.number().optional(),
	dateCreated: z.string().nullable().optional(),
	rate: z.number().optional(),
	description: z.string().optional(),
	name: z.string(),
});

export const bookingSchema = z.object({
	id: z.number().optional(),
	name: z.string().min(1),
	email: z.string().email(),
	date: z.string().refine((val) => !isNaN(Date.parse(val)), {
		message: "Invalid date",
	}),
	startTime: z.string().refine(
		(val) => {
			const timeParts = val.split(":");
			return timeParts.length === 2 && !isNaN(Number(timeParts[0])) && !isNaN(Number(timeParts[1]));
		},
		{
			message: "Invalid start time",
		}
	),
	endTime: z.string().refine(
		(val) => {
			const timeParts = val.split(":");
			return timeParts.length === 2 && !isNaN(Number(timeParts[0])) && !isNaN(Number(timeParts[1]));
		},
		{
			message: "Invalid end time",
		}
	),
	createdAt: z.string().nullable().optional(),
	updatedAt: z.string().nullable().optional(),
});
