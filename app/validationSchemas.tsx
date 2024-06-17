import { z } from "zod";

export const customerSchema = z.object({
	name: z.string().min(1, "Please enter a complete name.").max(255),
	email: z.string().email(),
	rate: z.number().min(1, "Enter a rate bigger than $1 an hour"),
});

export const timeLogSchema = z.object({
	customer: z.string().min(1, "Required"),
	projectId: z.string().min(1, "Required"),
	taskId: z.string().min(1, "Required"),
	userId: z.string().min(1, "Required"),
	duration: z.number().min(1, "Required"),
	description: z.string().nullable().optional(),
	date: z.string().min(1, "Required"),
	startTime: z.string().min(1, "Required"),
	endTime: z.string().min(1, "Required"),
	repeatInterval: z.number().min(1).optional(),
});
